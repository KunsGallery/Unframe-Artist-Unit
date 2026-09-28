"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { Shuffle } from "lucide-react";
import { db } from "../firebase-client";
import { tx, type Locale } from "../i18n-shared";

export function RandomArtistLink({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function discover() {
    if (!db || loading) return;
    setLoading(true); setMessage("");
    try {
      const snapshot = await getDocs(query(collection(db, "public_profiles"), where("published", "==", true), limit(100)));
      const slugs = snapshot.docs.filter((item) => {
        const accountType = item.data().accountType;
        return !accountType || accountType === "artist";
      }).map((item) => item.id);
      if (!slugs.length) {
        setMessage(tx(locale, "No artist pages are open yet.", "아직 공개된 아티스트 페이지가 없습니다."));
        return;
      }
      router.push(`/artist/${encodeURIComponent(slugs[Math.floor(Math.random() * slugs.length)])}`);
    } catch {
      setMessage(tx(locale, "Artists could not be loaded. Please try again.", "아티스트를 불러오지 못했습니다. 다시 시도해 주세요."));
    } finally { setLoading(false); }
  }
  return <div className="random-artist-action"><button type="button" className="button button-outline" onClick={() => void discover()} disabled={loading}><Shuffle size={15}/>{loading ? tx(locale, "Finding a practice…", "작가를 찾는 중…") : tx(locale, "Surprise me with an artist", "랜덤 아티스트 만나기")}</button>{message && <span role="status">{message}</span>}</div>;
}
