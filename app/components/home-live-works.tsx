"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ArtImage } from "../components";
import { usePublishedWorks, workPath } from "../live-works";
import { tx, type Locale } from "../i18n-shared";

export function HomeFeaturedWork({ locale }: { locale: Locale }) {
  const { works, loading, error } = usePublishedWorks();
  const featured = works[0];
  return <div className="hero-stage"><div className="hero-stage-label"><span>{tx(locale, "Published work", "공개된 작품")}</span><span>{featured ? `01 / ${String(works.length).padStart(2, "0")}` : "—"}</span></div>{featured ? <Link href={workPath(featured)} className="home-featured-work"><ArtImage className="home-featured-image" src={featured.imageUrl} label={featured.title} /><span><strong>{featured.title}</strong><small>{featured.artistName} · {featured.year || ""}</small></span></Link> : <div className="empty-state hero-empty-state"><h3>{loading ? tx(locale, "Opening the archive…", "아카이브를 불러오는 중…") : error ? tx(locale, "Works are temporarily unavailable.", "작품을 불러오지 못했습니다.") : tx(locale, "The first work is on its way.", "첫 작품을 기다리고 있습니다.")}</h3><p>{tx(locale, "Explore the artists who are shaping this archive.", "이 아카이브를 만들어가는 아티스트를 만나보세요.")}</p><Link className="text-link" href="/artists">{tx(locale, "Meet the artists", "아티스트 만나기")} <ArrowUpRight size={14} /></Link></div>}</div>;
}

export function HomeWorks({ locale }: { locale: Locale }) {
  const { works, loading, error } = usePublishedWorks();
  if (loading) return <p className="section-note">{tx(locale, "Opening works…", "작품을 불러오는 중…")}</p>;
  if (error) return <p role="alert" className="section-note">{tx(locale, "Works could not be loaded. Please try again.", "작품을 불러오지 못했습니다. 다시 시도해 주세요.")}</p>;
  if (!works.length) return <div className="empty-state"><h3>{tx(locale, "No published works yet.", "아직 공개된 작품이 없습니다.")}</h3><p>{tx(locale, "Meet the artists while their work archive grows.", "작품 아카이브가 채워지는 동안 아티스트를 만나보세요.")}</p><Link className="text-link" href="/artists">{tx(locale, "Artists", "아티스트")} <ArrowUpRight size={14} /></Link></div>;
  return <div className="works-grid">{works.slice(0, 3).map((work) => <Link href={workPath(work)} className="work-card" key={`${work.artistSlug}:${work.id}`}><ArtImage className="work-art" src={work.imageUrl} label={work.title} /><div className="work-info"><div><strong>{work.title}</strong><span>{work.artistName} · {work.year || ""}</span></div></div></Link>)}</div>;
}
