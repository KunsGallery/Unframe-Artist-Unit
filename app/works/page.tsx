"use client";

import Link from "next/link";
import { ArrowUpRight, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { artworks } from "../data";
import { ArtImage, BookmarkButton, Breadcrumb, DemoNotice, MetaLine, PageIntro, PageSection, SectionHeading } from "../components";
import { useLanguage } from "../i18n-provider";
import { artworkText, tx } from "../i18n-shared";

export default function WorksPage() {
  const { locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("All works");
  const filtered = useMemo(() => artworks.filter(w => {
    const copy = artworkText(locale, w.id)!;
    return `${w.title} ${w.artist} ${w.medium} ${copy.medium}`.toLowerCase().includes(query.toLowerCase()) && (availability === "All works" || w.status === availability);
  }), [query, availability, locale]);
  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={tx(locale, "Works", "작품")} /><PageIntro split /><PageSection sectionId="filters"><div className="filter-bar"><label className="search-field"><span className="sr-only">{tx(locale, "Search works", "작품 검색")}</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={tx(locale, "Search works, artists, mediums…", "작품, 아티스트, 매체로 검색…")} /><span>⌕</span></label><select value={availability} onChange={e => setAvailability(e.target.value)} aria-label={tx(locale, "Filter by availability", "판매 상태로 필터")}><option value="All works">{tx(locale, "All works", "모든 작품")}</option><option value="Available">{tx(locale, "Available", "판매 가능")}</option><option value="Price on request">{tx(locale, "Price on request", "가격 문의")}</option></select><button className="filter-button" onClick={() => setQuery(artworks[Math.floor(Math.random() * artworks.length)].title)}><Shuffle size={15} /> {tx(locale, "Shuffle u.a.u", "u.a.u 셔플")}</button></div></PageSection><PageSection sectionId="archive"><SectionHeading title={locale === "ko" ? `${filtered.length}점의 작품` : `${filtered.length} works`} action={tx(locale, "Viewing guide", "감상 가이드")} href="#guide" /><div className="works-grid archive-grid">{filtered.map(work => { const copy = artworkText(locale, work.id)!; return <Link href={`/works/${work.id}`} className="work-card" key={work.id}><ArtImage className={`work-art ${work.accent}`} position={work.imagePosition} label={work.title} /><div className="work-info"><div><strong>{work.title}</strong><span>{work.artist} · {work.year}</span></div><BookmarkButton label="" /></div><div className="work-meta"><MetaLine>{copy.medium}</MetaLine><span className="availability">{copy.status}</span></div></Link>})}</div>{filtered.length === 0 && <div className="empty-state"><h3>{tx(locale, "The archive is quiet here.", "이곳의 아카이브가 조용합니다.")}</h3><p>{tx(locale, "Try another search or shuffle the unit.", "다른 검색어를 입력하거나 유닛을 셔플해 보세요.")}</p></div>}</PageSection></div></main>;
}
