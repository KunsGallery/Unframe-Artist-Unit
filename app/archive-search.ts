"use client";
import { useEffect, useState } from "react";
import { collection, documentId, getDocs, limit, orderBy, query, startAfter, where, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "./firebase-client";
import type { PublicProfile } from "./profile";
import { collectArchivePages } from "./archive-records";
import { usePublicArchive } from "./public-archive";

// Browse stays paginated. An explicit search traverses every public page,
// independent of how many directory pages the visitor has already opened.
export function useSearchableArchive(active: boolean) {
  const browse = usePublicArchive();
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState({ artists: [] as PublicProfile[], loading: true, error: null as string | null });
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const firestore = db;
    setSearch({ artists: [], loading: true, error: null });
    async function read() {
      try {
        if (!firestore) throw new Error("unavailable");
        const artists = await collectArchivePages<PublicProfile, QueryDocumentSnapshot>(async cursor => {
          const constraints = [where("published", "==", true), orderBy(documentId()), limit(100)];
          const page = await getDocs(query(collection(firestore, "public_profiles"), ...constraints, ...(cursor ? [startAfter(cursor)] : [])));
          return { items: page.docs.map(item => ({ ...item.data(), slug: item.id } as PublicProfile)).filter(item => !item.isDemonstration && (!item.accountType || item.accountType === "artist")), cursor: page.docs.at(-1), hasMore: page.size === 100 };
        }, () => cancelled);
        if (!cancelled && artists) setSearch({ artists, loading: false, error: null });
      } catch { if (!cancelled) setSearch({ artists: [], loading: false, error: "unavailable" }); }
    }
    // Avoid beginning a full traversal for a transient first keystroke.
    const timer = setTimeout(() => void read(), 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [active, attempt]);
  return active ? { ...search, hasMore: false, loadingMore: false, loadMore: async () => {}, retry: () => setAttempt(value => value + 1) } : browse;
}
