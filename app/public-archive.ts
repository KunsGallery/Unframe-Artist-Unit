"use client";

import { useSyncExternalStore } from "react";
import { collection, doc, documentId, getDoc, getDocs, limit, onSnapshot, orderBy, query, startAfter, where, type DocumentSnapshot, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "./firebase-client";
import type { PublicProfile } from "./profile";

// One subscription per browser, shared by home, artists, works and shuffle.
// Fetch another page only when requested; never download the whole archive.
// Pages follow /api/artist-order (reshuffled every 8 hours); if that order is
// unavailable they fall back to address order.
const pageSize = 24;
const initial = { artists: [] as PublicProfile[], loading: true, error: null as string | null, hasMore: false, loadingMore: false };
let state = initial;
let order: string[] | null = null;
let offset = 0;
let cursor: QueryDocumentSnapshot | undefined;
let extra: PublicProfile[] = [];
let firstPage: PublicProfile[] = [];
let stop: (() => void) | undefined;
let generation = 0;
const listeners = new Set<() => void>();
function emit(next: Partial<typeof state>) { state = { ...state, ...next }; listeners.forEach((notify) => notify()); }
function normalize(snapshot: DocumentSnapshot): PublicProfile { return { ...snapshot.data(), slug: snapshot.id } as PublicProfile; }
function merge() {
  const profiles = Array.from(new Map([...firstPage, ...extra].map((profile) => [profile.slug, profile])).values());
  if (order) {
    const position = new Map(order.map((slug, index) => [slug, index]));
    profiles.sort((a, b) => (position.get(a.slug) ?? Infinity) - (position.get(b.slug) ?? Infinity));
  }
  return profiles.filter((profile) => !profile.isDemonstration && (!profile.accountType || profile.accountType === "artist"));
}
function baseQuery() { return query(collection(db!, "public_profiles"), where("published", "==", true), orderBy(documentId())); }
// `published == true` keeps the query provably within the read rules.
function slugQuery(slugs: string[]) { return query(collection(db!, "public_profiles"), where("published", "==", true), where(documentId(), "in", slugs)); }

// A list query is refused as a whole if any address in it was unpublished after
// the order was cached, so fall back to reading those artists one by one.
async function readSlugs(slugs: string[]) {
  try { return (await getDocs(slugQuery(slugs))).docs as DocumentSnapshot[]; }
  catch {
    const reads = await Promise.allSettled(slugs.map((slug) => getDoc(doc(db!, "public_profiles", slug))));
    return reads.flatMap((read) => read.status === "fulfilled" && read.value.exists() && read.value.data()?.published === true ? [read.value] : []);
  }
}

let orderRequest: Promise<string[] | null> | null = null;
export function getArtistOrder() {
  orderRequest ??= fetch("/api/artist-order").then((response) => response.ok ? response.json() : null).then((body: { order?: unknown } | null) => Array.isArray(body?.order) ? body!.order.filter((slug): slug is string => typeof slug === "string") : null).catch(() => null);
  return orderRequest;
}

function onPage(docs: DocumentSnapshot[], hasMore: boolean) {
  firstPage = docs.map(normalize);
  // Restart pagination when the live page changes; don't retain stale public data.
  extra = [];
  emit({ artists: merge(), loading: false, error: null, hasMore });
}
function onError() { emit({ loading: false, error: "unavailable", artists: [] }); }

function start() {
  if (!db) { emit({ loading: false, error: "unavailable" }); return; }
  const current = ++generation;
  void getArtistOrder().then((nextOrder) => {
    if (current !== generation || !listeners.size) return;
    order = nextOrder;
    if (order) {
      offset = pageSize;
      const slugs = order.slice(0, pageSize);
      if (!slugs.length) { emit({ artists: [], loading: false, error: null, hasMore: false }); return; }
      stop = onSnapshot(slugQuery(slugs), (snapshot) => { offset = pageSize; onPage(snapshot.docs, order!.length > pageSize); }, () => {
        // Without live updates, but still showing the artists that remain public.
        void readSlugs(slugs).then((docs) => { if (current === generation) onPage(docs, order!.length > pageSize); }).catch(onError);
      });
      return;
    }
    stop = onSnapshot(query(baseQuery(), limit(pageSize)), (snapshot) => { cursor = snapshot.docs.at(-1); onPage(snapshot.docs, snapshot.size === pageSize); }, onError);
  });
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  if (listeners.size === 1) start();
  return () => { listeners.delete(notify); if (!listeners.size) { generation++; stop?.(); stop = undefined; } };
}
async function loadMore() {
  if (!db || !state.hasMore || state.loadingMore) return;
  emit({ loadingMore: true });
  try {
    if (order) {
      const from = offset;
      const docs = await readSlugs(order.slice(from, from + pageSize));
      if (offset !== from) return;
      extra.push(...docs.map(normalize));
      offset = from + pageSize;
      emit({ artists: merge(), hasMore: order.length > offset, error: null });
      return;
    }
    if (!cursor) return;
    const currentCursor = cursor;
    const snapshot = await getDocs(query(baseQuery(), startAfter(currentCursor), limit(pageSize)));
    if (cursor !== currentCursor) return;
    extra.push(...snapshot.docs.map(normalize));
    cursor = snapshot.docs.at(-1);
    emit({ artists: merge(), hasMore: snapshot.size === pageSize, error: null });
  } catch { emit({ error: "unavailable" }); }
  finally { emit({ loadingMore: false }); }
}
function retry() { generation++; stop?.(); stop = undefined; orderRequest = null; start(); }
export function usePublicArchive() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  return { ...snapshot, loadMore, retry };
}
