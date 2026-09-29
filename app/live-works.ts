"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase-client";
import type { ArtistSiteWork, PublicProfile } from "./profile";

export type PublishedWork = ArtistSiteWork & {
  artistSlug: string;
  artistName: string;
  ownerUid: string;
};

export function workPath(work: Pick<PublishedWork, "artistSlug" | "id">) {
  return `/works/${encodeURIComponent(`${work.artistSlug}~${work.id}`)}`;
}

export function usePublishedWorks() {
  const [works, setWorks] = useState<PublishedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError("Published works are unavailable.");
      setLoading(false);
      return;
    }
    return onSnapshot(query(collection(db, "public_profiles"), where("published", "==", true)), (snapshot) => {
      const result = snapshot.docs.flatMap((item) => {
        const profile = { slug: item.id, ...item.data() } as PublicProfile;
        if (profile.isDemonstration || (profile.accountType && profile.accountType !== "artist")) return [];
        return (profile.siteWorks || []).filter((work) => work.id && work.title && work.imageUrl).map((work) => ({
          ...work,
          artistSlug: item.id,
          artistName: profile.artistName || profile.displayName,
          ownerUid: profile.ownerUid,
        }));
      });
      setWorks(result);
      setError(null);
      setLoading(false);
    }, (snapshotError) => {
      setError(snapshotError.message);
      setLoading(false);
    });
  }, []);

  return { works, loading, error };
}
