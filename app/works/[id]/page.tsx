"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { ArtImage, Breadcrumb, DemoNotice, MetaLine } from "../../components";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import type { ArtistSiteWork, PublicProfile } from "../../profile";
import { WorkInquiry } from "./work-inquiry";

type WorkRecord = { work: ArtistSiteWork; profile: PublicProfile };

export default function WorkDetail() {
  const { locale } = useLanguage();
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<WorkRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const id = params?.id;

  useEffect(() => {
    if (!id || !db || !id.includes("~")) {
      setLoading(false);
      return;
    }
    const separator = id.indexOf("~");
    const slug = id.slice(0, separator);
    const workId = id.slice(separator + 1);
    return onSnapshot(doc(db, "public_profiles", slug), (snapshot) => {
      const profile = snapshot.exists() ? ({ slug: snapshot.id, ...snapshot.data() } as PublicProfile) : null;
      const work = profile?.published ? profile.siteWorks?.find((item) => item.id === workId && item.title && item.imageUrl) : null;
      setRecord(profile && work ? { profile, work } : null);
      setLoading(false);
      setError(null);
    }, (snapshotError) => {
      setError(snapshotError.message);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <main className="page-wrap inner-page"><p>{tx(locale, "Opening work…", "작품을 불러오는 중…")}</p></main>;
  if (!record) return <main className="page-wrap inner-page"><Breadcrumb current={tx(locale, "Work", "작품")} /><div className="empty-state"><h1>{error ? tx(locale, "This work could not be loaded.", "작품을 불러오지 못했습니다.") : tx(locale, "This work is not available.", "이 작품은 현재 공개되어 있지 않습니다.")}</h1><Link href="/works" className="text-link">{tx(locale, "Browse works", "작품 둘러보기")}</Link></div></main>;

  const { work, profile } = record;
  return <main><DemoNotice /><div className="page-wrap inner-page work-detail"><Breadcrumb current={work.title} /><Link className="back-link" href="/works"><ArrowLeft size={15} /> {tx(locale, "All works", "모든 작품")}</Link><section className="work-detail-grid"><div className="detail-work-art"><ArtImage className="detail-work-image" src={work.imageUrl} label={work.title} /></div><div className="work-detail-copy"><MetaLine>{work.medium || tx(locale, "Work", "작품")}{work.year ? ` · ${work.year}` : ""}</MetaLine><h1>{work.title}</h1><Link href={`/artist/${profile.slug}`} className="work-artist-link">{profile.artistName || profile.displayName} <ArrowUpRight size={15} /></Link><div className="work-detail-rule" /><div className="work-facts"><div><span>{tx(locale, "Year", "제작연도")}</span><strong>{work.year || "—"}</strong></div><div><span>{tx(locale, "Medium", "재료 / 매체")}</span><strong>{work.medium || "—"}</strong></div><div><span>{tx(locale, "Dimensions", "규격")}</span><strong>{work.dimensions || "—"}</strong></div></div><WorkInquiry work={work} profile={profile} locale={locale} /></div></section><section className="work-detail-footer"><span>u.a.u / UNFRAME ARTIST UNIT</span><Link href={`/artist/${profile.slug}`} className="text-link">{tx(locale, "Visit artist profile", "아티스트 프로필 보기")} <ArrowUpRight size={14} /></Link></section></div></main>;
}
