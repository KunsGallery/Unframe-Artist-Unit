"use client";

import { useSyncExternalStore } from "react";
import { collection, documentId, getDocs, limit, onSnapshot, orderBy, query, startAfter, where, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "./firebase-client";
import type { PublicProfile } from "./profile";

// One subscription per browser, shared by home, artists, works and shuffle.
// Fetch another page only when requested; never download the whole archive.
const pageSize = 24;
const initial = { artists: [] as PublicProfile[], loading: true, error: null as string | null, hasMore: false, loadingMore: false };
let state = initial;
let cursor: QueryDocumentSnapshot | undefined;
let extra: PublicProfile[] = [];
let firstPage: PublicProfile[] = [];
let stop: (() => void) | undefined;
const listeners = new Set<() => void>();
function emit(next: Partial<typeof state>) { state = { ...state, ...next }; listeners.forEach((notify) => notify()); }
function normalize(doc: QueryDocumentSnapshot): PublicProfile { return { ...doc.data(), slug: doc.id } as PublicProfile; }
function merge() {
  const profiles = Array.from(new Map([...firstPage, ...extra].map((profile) => [profile.slug, profile])).values());
  return profiles.filter((profile) => !profile.isDemonstration && (!profile.accountType || profile.accountType === "artist"));
}
function baseQuery() { return query(collection(db!, "public_profiles"), where("published", "==", true), orderBy(documentId())); }
function start() {
  if (!db) { emit({ loading: false, error: "unavailable" }); return; }
  stop = onSnapshot(query(baseQuery(), limit(pageSize)), (snapshot) => {
    firstPage = snapshot.docs.map(normalize);
    // Restart pagination when the live page changes; don't retain stale public data.
    extra = [];
    cursor = snapshot.docs.at(-1);
    emit({ artists: merge(), loading: false, error: null, hasMore: snapshot.size === pageSize });
  }, () => emit({ loading: false, error: "unavailable", artists: [] }));
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  if (listeners.size === 1) start();
  return () => { listeners.delete(notify); if (!listeners.size) { stop?.(); stop = undefined; } };
}
async function loadMore() {
  if (!db || !cursor || !state.hasMore || state.loadingMore) return;
  const currentCursor = cursor;
  emit({ loadingMore: true });
  try {
    const snapshot = await getDocs(query(baseQuery(), startAfter(currentCursor), limit(pageSize)));
    if (cursor !== currentCursor) return;
    extra.push(...snapshot.docs.map(normalize));
    cursor = snapshot.docs.at(-1);
    emit({ artists: merge(), hasMore: snapshot.size === pageSize, error: null });
  } catch { emit({ error: "unavailable" }); }
  finally { emit({ loadingMore: false }); }
}
function retry() { stop?.(); start(); }
export function usePublicArchive() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  return { ...snapshot, loadMore, retry };
}
