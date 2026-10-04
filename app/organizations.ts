"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type Timestamp } from "firebase/firestore";
import { db } from "./firebase-client";
import { usePublicArchive } from "./public-archive";
import type { PublicProfile } from "./profile";

export type GalleryRecord = {
  id: string;
  ownerUid: string;
  name: string;
  city: string;
  description: string;
  websiteUrl: string;
  published: boolean;
  movingBanner?: import("./moving-banner").MovingBannerConfig;
};

export type ExhibitionRecord = {
  kind?: "exhibition" | "project" | "opencall";
  movingBanner?: import("./moving-banner").MovingBannerConfig;
  id: string;
  ownerUid: string;
  galleryId: string;
  title: string;
  year: string;
  startDate?: string;
  endDate?: string;
  description: string;
  artistSlugs: string[];
  published: boolean;
  createdAt?: Timestamp;
};

function normalizeGallery(id: string, data: Record<string, unknown>): GalleryRecord {
  return {
    id,
    ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
    name: typeof data.name === "string" && data.name.trim() ? data.name : id,
    city: typeof data.city === "string" ? data.city : "",
    description: typeof data.description === "string" ? data.description : "",
    websiteUrl: typeof data.websiteUrl === "string" ? data.websiteUrl : "",
    published: data.published === true,
    movingBanner: data.movingBanner as GalleryRecord["movingBanner"],
  };
}

export function normalizeExhibition(id: string, data: Record<string, unknown>): ExhibitionRecord {
  return {
    kind: data.kind === "opencall" || data.kind === "project" ? data.kind : "exhibition",
    movingBanner: data.movingBanner as ExhibitionRecord["movingBanner"],
    id,
    ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
    galleryId: typeof data.galleryId === "string" ? data.galleryId : "",
    title: typeof data.title === "string" && data.title.trim() ? data.title : id,
    year: typeof data.year === "string" ? data.year : "",
    startDate: typeof data.startDate === "string" ? data.startDate : "",
    endDate: typeof data.endDate === "string" ? data.endDate : "",
    description: typeof data.description === "string" ? data.description : "",
    artistSlugs: Array.isArray(data.artistSlugs) ? data.artistSlugs.filter((item): item is string => typeof item === "string") : [],
    published: data.published === true,
    createdAt: data.createdAt as Timestamp | undefined,
  };
}

export function usePublishedGalleries() {
  const [galleries, setGalleries] = useState<GalleryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!db) { setLoading(false); setError("Gallery data is unavailable."); return; }
    return onSnapshot(query(collection(db, "galleries"), where("published", "==", true)), (snapshot) => {
      setGalleries(snapshot.docs.map((item) => normalizeGallery(item.id, item.data())));
      setLoading(false); setError(null);
    }, (snapshotError) => { setError(snapshotError.message); setLoading(false); });
  }, []);
  return { galleries, error, loading };
}

export function usePublishedExhibitions() {
  const [exhibitions, setExhibitions] = useState<ExhibitionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!db) { setLoading(false); setError("Exhibition data is unavailable."); return; }
    return onSnapshot(query(collection(db, "exhibitions"), where("published", "==", true)), (snapshot) => {
      setExhibitions(snapshot.docs.map((item) => normalizeExhibition(item.id, item.data())));
      setLoading(false); setError(null);
    }, (snapshotError) => { setError(snapshotError.message); setLoading(false); });
  }, []);
  return { exhibitions, error, loading };
}

export function usePublishedArtists() { return usePublicArchive(); }
