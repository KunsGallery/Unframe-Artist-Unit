"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArtImage, Breadcrumb, DemoNotice, MetaLine, PageIntro, PageSection, SectionHeading } from "../components";
import { usePublishedWorks, workPath } from "../live-works";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

export default function WorksPage() {
  const { locale } = useLanguage();
  const { works, loading, error } = usePublishedWorks();
  const [queryText, setQueryText] = useState("");

  const filtered = useMemo(() => works.filter((work) => [work.title, work.artistName, work.medium, work.year].filter(Boolean).join(" ").toLowerCase().includes(queryText.toLowerCase())), [queryText, works]);
  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={tx(locale, "Works", "작품")} /><PageIntro split /><PageSection sectionId="filters"><div className="filter-bar"><label className="search-field"><span className="sr-only">{tx(locale, "Search works", "작품 검색")}</span><input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder={tx(locale, "Search works, artists, mediums…", "작품, 아티스트, 매체로 검색…")} /><span>⌕</span></label></div></PageSection><PageSection sectionId="archive"><SectionHeading title={locale === "ko" ? filtered.length + "점의 작품" : filtered.length + " works"} action={tx(locale, "Published archive", "공개 아카이브")} />{error && <p role="alert" className="section-note">{tx(locale, "Works could not be loaded. Please try again.", "작품을 불러오지 못했습니다. 다시 시도해 주세요.")}</p>}<div className="works-grid archive-grid">{filtered.map((work) => <Link href={workPath(work)} className="work-card" key={work.artistSlug + ":" + work.id}><ArtImage className="work-art" src={work.imageUrl} label={work.title} /><div className="work-info"><div><strong>{work.title}</strong><span>{work.artistName} · {work.year || tx(locale, "undated", "연도 미상")}</span></div></div><div className="work-meta"><MetaLine>{work.medium || tx(locale, "Medium to be added", "매체를 추가해 주세요")}</MetaLine><span className="availability">{tx(locale, "Published", "공개됨")}</span></div></Link>)}</div>{!loading && !error && filtered.length === 0 && <div className="empty-state"><h3>{queryText ? tx(locale, "No matching works.", "검색 결과가 없습니다.") : tx(locale, "No published works yet.", "아직 공개된 작품이 없습니다.")}</h3><p>{tx(locale, "Published works will appear here when artists add them to their public pages.", "아티스트가 공개 페이지에 작품을 추가하면 이곳에 나타납니다.")}</p></div>}</PageSection></div></main>;
}
