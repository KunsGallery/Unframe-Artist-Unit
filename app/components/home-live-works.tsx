"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ArtImage } from "../components";
import { usePublishedWorks, workPath } from "../live-works";
import { tx, type Locale } from "../i18n-shared";

export function HomeFeaturedWork({ locale }: { locale: Locale }) {
  const { works, loading, error } = usePublishedWorks();
  const featured = works[0];
  return <div className="hero-stage"><div className="hero-stage-label"><span>{featured ? tx(locale, "Published work", "공개된 작품") : tx(locale, "A space for practices", "각자의 작업을 위한 공간")}</span><span>{featured ? `01 / ${String(works.length).padStart(2, "0")}` : "U.A.U"}</span></div>{featured ? <Link href={workPath(featured)} className="home-featured-work"><ArtImage className="home-featured-image" src={featured.imageUrl} label={featured.title} /><span><strong>{featured.title}</strong><small>{featured.artistName} · {featured.year || ""}</small></span></Link> : <Link className="home-editorial-visual" href="/artists"><img src="/assets/uau-hero.webp" alt={tx(locale, "Sculptural installation in a gallery", "갤러리 공간의 입체 설치 작업")} /><span className="home-visual-shade"/><span className="home-visual-caption"><strong>{loading ? tx(locale, "An archive taking shape.", "아카이브가 만들어지고 있습니다.") : error ? tx(locale, "The archive is taking a moment.", "아카이브를 잠시 불러오지 못했습니다.") : tx(locale, "Space for what comes next.", "다음 작업을 위한 공간.")}</strong><small>{tx(locale, "ARTISTS · WORKS · CONNECTIONS", "아티스트 · 작품 · 연결")}</small></span><span className="home-visual-index">01 <i>—</i> U.A.U</span><span className="home-visual-link">{tx(locale, "Meet the artists", "아티스트 만나기")} <ArrowUpRight size={16} /></span></Link>}</div>;
}

export function HomeWorks({ locale }: { locale: Locale }) {
  const { works, loading, error } = usePublishedWorks();
  if (loading) return <p className="section-note">{tx(locale, "Opening works…", "작품을 불러오는 중…")}</p>;
  if (error) return <p role="alert" className="section-note">{tx(locale, "Works could not be loaded. Please try again.", "작품을 불러오지 못했습니다. 다시 시도해 주세요.")}</p>;
  if (!works.length) return <div className="empty-state"><h3>{tx(locale, "No published works yet.", "아직 공개된 작품이 없습니다.")}</h3><p>{tx(locale, "Meet the artists while their work archive grows.", "작품 아카이브가 채워지는 동안 아티스트를 만나보세요.")}</p><Link className="text-link" href="/artists">{tx(locale, "Artists", "아티스트")} <ArrowUpRight size={14} /></Link></div>;
  return <div className="works-grid">{works.slice(0, 3).map((work) => <Link href={workPath(work)} className="work-card" key={`${work.artistSlug}:${work.id}`}><ArtImage className="work-art" src={work.imageUrl} label={work.title} /><div className="work-info"><div><strong>{work.title}</strong><span>{work.artistName} · {work.year || ""}</span></div></div></Link>)}</div>;
}
