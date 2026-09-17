"use client";

import Link from "next/link";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { artists } from "../data";
import { Breadcrumb, DemoNotice, MetaLine, VerifiedMark } from "../components";
import { useLanguage } from "../i18n-provider";
import { artistText, cityText, countryText, tx } from "../i18n-shared";

export default function ArtistsPage() {
  const { locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState("All practices");
  const filtered = useMemo(() => artists.filter(a => {
    const copy = artistText(locale, a.slug)!;
    return `${a.name} ${a.city} ${a.country} ${a.discipline} ${a.tags.join(" ")} ${copy.discipline} ${copy.tags.join(" ")} ${copy.bio}`.toLowerCase().includes(query.toLowerCase()) && (discipline === "All practices" || a.discipline === discipline);
  }), [query, discipline, locale]);
  const disciplines = ["All practices", "Painting", "Textile / Installation", "Sound", "Sculpture", "Moving image", "Ceramics"];
  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={tx(locale, "Artists", "아티스트")} /><div className="page-intro"><MetaLine>{tx(locale, "THE UNIT / 06 ARTISTS", "유닛 / 아티스트 06명")}</MetaLine><h1>{tx(locale, <>Artists, in their<br /><em>own rhythm.</em></>, <>아티스트는 각자의<br /><em>리듬으로.</em></>)}</h1><p>{tx(locale, "Independent practices connected through UNFRAME, each with their own pace, place, and way of working.", "UNFRAME을 통해 연결된 독립적인 실천들. 각자의 속도와 장소, 작업 방식으로 움직입니다.")}</p></div><div className="filter-bar"><label className="search-field"><span className="sr-only">{tx(locale, "Search artists", "아티스트 검색")}</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={tx(locale, "Search by name, practice, place…", "이름, 실천, 장소로 검색…")} /><span>⌕</span></label><select value={discipline} onChange={e => setDiscipline(e.target.value)} aria-label={tx(locale, "Filter by practice", "실천 분야로 필터")}>{disciplines.map(option => <option key={option} value={option}>{tx(locale, option, ({ "All practices": "모든 분야", Painting: "회화", "Textile / Installation": "텍스타일 / 설치", Sound: "사운드", Sculpture: "조각", "Moving image": "영상", Ceramics: "도예" } as Record<string, string>)[option])}</option>)}</select><button className="filter-button"><SlidersHorizontal size={15} /> {tx(locale, "More filters", "추가 필터")}</button></div><p className="result-count">{locale === "ko" ? `${filtered.length}명의 아티스트 · 데모 아카이브` : `${filtered.length} artists in the demonstration archive`}</p><div className="artist-directory">{filtered.map((artist, index) => { const copy = artistText(locale, artist.slug)!; return <Link href={`/${artist.slug}`} data-cursor="artist" className="directory-row" key={artist.slug}><span className="artist-index">0{index + 1}</span><span className={`artist-avatar large ${artist.tone}`}>{artist.initials}</span><span className="directory-main"><strong>{artist.name} {artist.verified && <VerifiedMark compact />}</strong><span>{copy.discipline} · {copy.stage}</span></span><span className="directory-location">{cityText(locale, artist.city)}<small>{countryText(locale, artist.country)}</small></span><span className="directory-tags">{copy.tags.map(tag => <span key={tag}>{tag}</span>)}</span><ArrowUpRight size={17} /></Link>})}{filtered.length === 0 && <div className="empty-state"><h3>{tx(locale, "No artist found.", "아티스트를 찾지 못했습니다.")}</h3><p>{tx(locale, "Try a different name, place, or practice.", "다른 이름, 장소, 분야로 검색해 보세요.")}</p></div>}</div></div></main>;
}
