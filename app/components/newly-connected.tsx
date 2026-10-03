"use client";

import { usePublicArchive } from "../public-archive";
import { RandomArtistLink } from "./random-artist-link";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { tx, type Locale } from "../i18n-shared";
import { db } from "../firebase-client";
import { VerifiedMark } from "../components";
import type { PublicProfile } from "../profile";
import { useEffect, useState } from "react";

type ConnectedArtist = { slug: string; displayName: string; artistName?: string; practice?: string; basedInCity?: string; country?: string; verificationStatus?: string; uauArtistId?: string; accountType?: string };

export function NewlyConnected({ locale }: { locale: Locale }) {
  const { artists, loading, error, retry } = usePublicArchive();
  const liveArtists = artists.slice(0, 4);
  if (loading) return <p role="status">{tx(locale, "Loading artists…", "아티스트를 불러오는 중…")}</p>;
  if (error) return <div role="alert"><p>{tx(locale, "Artists could not be loaded.", "아티스트를 불러오지 못했습니다.")}</p><button className="button button-outline" onClick={retry}>{tx(locale, "Try again", "다시 시도")}</button></div>;
  if (liveArtists.length > 0) {
    return <><div className="artist-list">{liveArtists.map((artist, index) => <Link href={`/artist/${artist.slug}`} className="artist-row" key={artist.slug}><span className="artist-index">0{index + 1}</span><span className="artist-avatar tone-blue">{(artist.artistName || artist.displayName).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span className="artist-name">{artist.artistName || artist.displayName} {artist.verificationStatus === "approved" && <VerifiedMark compact />}<small>{artist.practice || tx(locale, "Artist", "아티스트")}</small></span><span className="artist-place">{artist.basedInCity}{artist.basedInCity && artist.country ? ", " : ""}{artist.country}</span><span className="artist-tags"><span>{artist.uauArtistId || tx(locale, "Newly connected", "새롭게 연결됨")}</span></span><ArrowUpRight className="row-arrow" size={17} /></Link>)}</div><RandomArtistLink locale={locale}/></>;
  }

  return <div className="empty-state"><h3>{tx(locale, "The archive is ready for its first connection.", "아카이브에 첫 연결을 기다리고 있습니다.")}</h3><p>{tx(locale, "Published artist profiles will appear here when they are ready.", "작가의 실제 프로필을 준비하고 있습니다. 참여 방법을 먼저 알아보세요.")}</p><Link className="text-link" href="/join">{tx(locale, "How to join U.A.U", "U.A.U 참여 안내")} <ArrowUpRight size={14}/></Link></div>;
}
