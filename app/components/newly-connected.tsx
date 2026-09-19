"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { tx, type Locale } from "../i18n-shared";
import { db } from "../firebase-client";
import { VerifiedMark } from "../components";
import type { PublicProfile } from "../profile";
import { useEffect, useState } from "react";

type ConnectedArtist = { slug: string; displayName: string; artistName?: string; practice?: string; basedInCity?: string; country?: string; verificationStatus?: string; uauArtistId?: string };

export function NewlyConnected({ locale }: { locale: Locale }) {
  const [liveArtists, setLiveArtists] = useState<ConnectedArtist[]>([]);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(query(collection(db, "public_profiles"), where("published", "==", true), limit(4)), (snapshot) => {
      setLiveArtists(snapshot.docs.map((item) => ({ slug: item.id, ...(item.data() as Omit<PublicProfile, "slug">) })));
    }, () => setLiveArtists([]));
  }, []);

  if (liveArtists.length > 0) {
    return <div className="artist-list">{liveArtists.map((artist, index) => <Link href={`/artist/${artist.slug}`} className="artist-row" key={artist.slug}><span className="artist-index">0{index + 1}</span><span className="artist-avatar tone-blue">{(artist.artistName || artist.displayName).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span className="artist-name">{artist.artistName || artist.displayName} {artist.verificationStatus === "approved" && <VerifiedMark compact />}<small>{artist.practice || tx(locale, "Artist", "아티스트")}</small></span><span className="artist-place">{artist.basedInCity}{artist.basedInCity && artist.country ? ", " : ""}{artist.country}</span><span className="artist-tags"><span>{artist.uauArtistId || tx(locale, "Newly connected", "새롭게 연결됨")}</span></span><ArrowUpRight className="row-arrow" size={17} /></Link>)}</div>;
  }

  return <div className="empty-state"><h3>{tx(locale, "The archive is ready for its first connection.", "아카이브에 첫 연결을 기다리고 있습니다.")}</h3><p>{tx(locale, "Published artist profiles will appear here when they are ready.", "공개된 아티스트 프로필이 준비되면 이곳에 나타납니다.")}</p></div>;
}
