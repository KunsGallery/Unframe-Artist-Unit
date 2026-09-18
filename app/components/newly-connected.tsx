"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { artists } from "../data";
import { artistText, cityText, countryText, tx, type Locale } from "../i18n-shared";
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

  return <div className="artist-list">{artists.slice(0, 4).map((artist, index) => { const copy = artistText(locale, artist.slug)!; return <Link href={`/${artist.slug}`} className="artist-row" key={artist.slug}><span className="artist-index">0{index + 1}</span><span className={`artist-avatar ${artist.tone}`}>{artist.initials}</span><span className="artist-name">{artist.name} {artist.verified && <VerifiedMark compact />}<small>{copy.discipline}</small></span><span className="artist-place">{cityText(locale, artist.city)}, {countryText(locale, artist.country)}</span><span className="artist-tags">{copy.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</span><ArrowUpRight className="row-arrow" size={17} /></Link>; })}</div>;
}
