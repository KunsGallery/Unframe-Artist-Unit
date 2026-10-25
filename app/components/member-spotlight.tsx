"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ArtImage } from "../components";
import { orderWindow } from "../artist-order";
import { db } from "../firebase-client";
import { tx, type Locale } from "../i18n-shared";
import { sealTiers } from "../membership-seal";
import { pickSpotlight, type SpotlightItem } from "../member-spotlight";
import type { PublicProfile } from "../profile";
import { UauSeal } from "./uau-seal";

// Shows nothing until there is at least one active member with a work image.
// Kept outside PageSection so a saved home order never pushes it below the fold.
export function MemberSpotlight({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<SpotlightItem[]>([]);

  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    const members = query(collection(db, "public_profiles"), where("published", "==", true), where("membership.tier", "in", Object.keys(sealTiers)));
    getDocs(members).then((snapshot) => {
      const profiles = snapshot.docs.map((item) => ({ ...item.data(), slug: item.id } as PublicProfile));
      if (!cancelled) setItems(pickSpotlight(profiles, orderWindow(new Date()).seed));
    }).catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, []);

  return <MemberSpotlightView items={items} locale={locale} />;
}

export function MemberSpotlightView({ items, locale }: { items: SpotlightItem[]; locale: Locale }) {
  if (!items.length) return null;
  return <section id="spotlight" className="page-wrap member-spotlight" aria-labelledby="member-spotlight-title">
    <div className="member-spotlight-head"><div><span className="member-spotlight-kicker">{tx(locale, "MEMBER SPOTLIGHT · CHANGES AT 10:00 AND 18:00", "MEMBER SPOTLIGHT · 오전 10시·오후 6시 교체")}</span><h2 id="member-spotlight-title">{tx(locale, <>Now in <em>the room.</em></>, <>지금, <em>이 방에.</em></>)}</h2></div><div className="member-spotlight-note"><p>{tx(locale, "U.A.U member artists, introduced twice a day. Every member gets the same turn.", "U.A.U 멤버 작가를 하루 두 번 바꿔 소개합니다. 멤버 모두에게 같은 횟수로 돌아갑니다.")}</p><Link className="underlined-link" href="/membership">{tx(locale, "About membership", "멤버십 안내")} <ArrowUpRight size={14} /></Link></div></div>
    <div className={`member-spotlight-grid is-${items.length}`}>{items.map(({ profile, work }) => <Link href={`/artist/${profile.slug}`} className="member-spotlight-card" key={profile.slug}>
      <ArtImage className="member-spotlight-art" src={work.displayImageUrl || work.imageUrl} thumbnailSrc={work.thumbnailImageUrl} displayWidth={work.displayImageWidth} thumbnailWidth={work.thumbnailImageWidth} label={work.title} />
      <span className="member-spotlight-name">{profile.artistName || profile.displayName}<UauSeal membership={profile.membership} size={16} locale={locale} /></span>
      <small>{[profile.basedInCity, profile.practice].filter(Boolean).join(" · ")}</small>
      <span className="member-spotlight-work">{work.title}{work.year ? `, ${work.year}` : ""}</span>
    </Link>)}</div>
  </section>;
}
