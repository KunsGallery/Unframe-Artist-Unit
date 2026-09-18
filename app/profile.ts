"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, where, type Timestamp } from "firebase/firestore";
import { db } from "./firebase-client";

export type UauAccountType = "artist" | "curator" | "gallery" | "collector" | "director" | "institution";
export type ArtistSiteTemplate = "gallery" | "editorial" | "archive";
export type ArtistSiteSection = "works" | "exhibitions" | "cv" | "about";
export type ArtistSiteAccent = "blue" | "ink" | "clay";

export type ArtistVerificationStatus = "pending" | "approved" | "rejected";
export type ArtistFoundingStatus = "founding" | "regular";

export type ArtistSiteWork = {
  id: string;
  title: string;
  year?: string;
  medium?: string;
  imageUrl?: string;
};

export type ArtistSiteExhibition = {
  id: string;
  year: string;
  title: string;
  venue?: string;
  location?: string;
};

export type UauUserProfile = {
  uid: string;
  email?: string;
  displayName?: string;
  artistName?: string;
  accountType?: UauAccountType;
  country?: string;
  basedInCity?: string;
  bio?: string;
  practice?: string;
  websiteUrl?: string;
  onboardingCompleted?: boolean;
  publicSlug?: string;
  siteTemplate?: ArtistSiteTemplate;
  siteSections?: ArtistSiteSection[];
  siteAccent?: ArtistSiteAccent;
  sitePublished?: boolean;
  uauArtistId?: string;
  foundingNumber?: number;
  foundingStatus?: ArtistFoundingStatus;
  verificationStatus?: ArtistVerificationStatus;
  invitationNumber?: number;
  invitationAcceptedAt?: Timestamp | null;
  verifiedAt?: Timestamp | null;
  approvedAt?: Timestamp | null;
  connectedAt?: Timestamp | null;
  siteWorks?: ArtistSiteWork[];
  siteExhibitions?: ArtistSiteExhibition[];
  showExhibitions?: boolean;
  showCV?: boolean;
  showAbout?: boolean;
  language?: "en" | "ko";
  currency?: string;
  timezone?: string;
  updatedAt?: Timestamp | null;
};

export type ArtistMembership = {
  id: string;
  name?: string;
  verified?: boolean;
  applicationStatus?: "pending" | "approved" | "rejected";
  published?: boolean;
};

export type UauMembership = {
  id: string;
  active?: boolean;
  status?: "active" | "paused" | "cancelled";
  plan?: string;
};

export type PublicProfile = {
  slug: string;
  ownerUid: string;
  displayName: string;
  artistName?: string;
  accountType?: UauAccountType;
  country?: string;
  basedInCity?: string;
  practice?: string;
  bio?: string;
  websiteUrl?: string;
  siteTemplate: ArtistSiteTemplate;
  siteSections?: ArtistSiteSection[];
  siteAccent?: ArtistSiteAccent;
  showExhibitions: boolean;
  showCV: boolean;
  showAbout: boolean;
  published: boolean;
  uauArtistId?: string;
  foundingNumber?: number;
  foundingStatus?: ArtistFoundingStatus;
  verificationStatus?: ArtistVerificationStatus;
  invitationNumber?: number;
  verifiedAt?: Timestamp | null;
  siteWorks?: ArtistSiteWork[];
  siteExhibitions?: ArtistSiteExhibition[];
};

export const accountTypes: Array<{ value: UauAccountType; en: string; ko: string }> = [
  { value: "artist", en: "Artist", ko: "아티스트" },
  { value: "curator", en: "Curator", ko: "큐레이터" },
  { value: "gallery", en: "Gallery / project space", ko: "갤러리 / 프로젝트 스페이스" },
  { value: "collector", en: "Collector", ko: "컬렉터" },
  { value: "director", en: "Director / producer", ko: "디렉터 / 프로듀서" },
  { value: "institution", en: "Institution", ko: "기관" },
];

export function useUserProfile(uid?: string | null) {
  const [profile, setProfile] = useState<UauUserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid || !db) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    return onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        setProfile(snapshot.exists() ? ({ uid, ...snapshot.data() } as UauUserProfile) : { uid });
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uid]);

  return { profile, loading };
}

export function useArtistMembership(uid?: string | null) {
  const [artist, setArtist] = useState<ArtistMembership | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid || !db) {
      setArtist(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const artistQuery = query(collection(db, "artists"), where("ownerUid", "==", uid));
    return onSnapshot(
      artistQuery,
      (snapshot) => {
        const first = snapshot.docs[0];
        setArtist(first ? ({ id: first.id, ...first.data() } as ArtistMembership) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uid]);

  return { artist, loading };
}

export function useMembership(uid?: string | null) {
  const [membership, setMembership] = useState<UauMembership | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid || !db) {
      setMembership(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const membershipQuery = query(collection(db, "memberships"), where("ownerUid", "==", uid));
    return onSnapshot(
      membershipQuery,
      (snapshot) => {
        const first = snapshot.docs[0];
        setMembership(first ? ({ id: first.id, ...first.data() } as UauMembership) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uid]);

  return { membership, loading };
}

export async function saveUserProfile(uid: string, values: Partial<Omit<UauUserProfile, "uid">>) {
  if (!db) throw new Error("Firebase is not configured.");
  await setDoc(doc(db, "users", uid), { ...values, updatedAt: serverTimestamp() }, { merge: true });
}

export async function savePublicProfile(uid: string, slug: string, values: Omit<PublicProfile, "slug" | "ownerUid">) {
  if (!db) throw new Error("Firebase is not configured.");
  await setDoc(
    doc(db, "public_profiles", slug),
    { ...values, slug, ownerUid: uid, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function createArtistApplication(uid: string, values: {
  name: string;
  artistName?: string;
  country: string;
  basedInCity: string;
  practice: string;
  bio?: string;
  invitationNumber?: number;
}) {
  if (!db) throw new Error("Firebase is not configured.");
  return addDoc(collection(db, "artists"), {
    ownerUid: uid,
    name: values.name,
    artistName: values.artistName || values.name,
    country: values.country,
    basedInCity: values.basedInCity,
    practice: values.practice,
    bio: values.bio || "",
    invitationNumber: values.invitationNumber ?? null,
    verified: false,
    applicationStatus: "pending",
    published: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
