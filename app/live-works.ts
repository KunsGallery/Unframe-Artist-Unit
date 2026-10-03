"use client";

import { usePublicArchive } from "./public-archive";
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
  const archive = usePublicArchive();
  const works = archive.artists.flatMap((profile) => (profile.siteWorks || []).filter((work) => work.id && work.title && work.imageUrl).map((work) => ({ ...work, artistSlug: profile.slug, artistName: profile.artistName || profile.displayName || "", ownerUid: profile.ownerUid } as PublishedWork)));
  return { ...archive, works };
}
