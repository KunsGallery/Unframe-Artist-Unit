"use client";

import { usePublicArchive } from "../public-archive";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { Shuffle } from "lucide-react";
import { db } from "../firebase-client";
import { tx, type Locale } from "../i18n-shared";

export function RandomArtistLink({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { artists, loading: archiveLoading } = usePublicArchive();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function discover() {
    if (!db || loading) return;
    setLoading(true); setMessage("");
    try {
      const slugs = artists.map((artist) => artist.slug);
      if (!slugs.length) {
        setMessage(tx(locale, "No artist pages are open yet.", "아직 공개된 아티스트 페이지가 없습니다."));
        return;
      }
      router.push(`/artist/${encodeURIComponent(slugs[Math.floor(Math.random() * slugs.length)])}`);
    } catch {
      setMessage(tx(locale, "Artists could not be loaded. Please try again.", "아티스트를 불러오지 못했습니다. 다시 시도해 주세요."));
    } finally { setLoading(false); }
  }
  if (archiveLoading || !artists.length) return null;
  return <div className="random-artist-action"><button type="button" className="button button-outline" onClick={() => void discover()} disabled={loading}><Shuffle size={15}/>{loading ? tx(locale, "Finding a practice…", "작가를 찾는 중…") : tx(locale, "Surprise me with an artist", "랜덤 아티스트 만나기")}</button>{message && <span role="status">{message}</span>}</div>;
}
