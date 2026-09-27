"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Breadcrumb, DemoNotice, PageIntro, PageSection, VerifiedMark } from "../components";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { usePublishedArtists } from "../organizations";

export default function ArtistsPage() {
  const { locale } = useLanguage();
  const { artists, loading, error } = usePublishedArtists();
  const [queryText, setQueryText] = useState("");
  const [discipline, setDiscipline] = useState("");
  const disciplines = useMemo(() => Array.from(new Set(artists.map((artist) => artist.practice?.trim()).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, locale === "ko" ? "ko" : "en")), [artists, locale]);
  const filtered = useMemo(() => artists.filter((artist) => {
    const haystack = [artist.artistName, artist.displayName, artist.basedInCity, artist.country, artist.practice, artist.bio].filter(Boolean).join(" ").toLocaleLowerCase();
    return haystack.includes(queryText.trim().toLocaleLowerCase()) && (!discipline || artist.practice?.trim() === discipline);
  }), [artists, discipline, queryText]);

  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={tx(locale, "Artists", "아티스트")} /><PageIntro /><PageSection sectionId="directory"><div className="filter-bar"><label className="search-field"><span className="sr-only">{tx(locale, "Search artists", "아티스트 검색")}</span><input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder={tx(locale, "Search artists…", "아티스트 검색…")} /><span>⌕</span></label><select value={discipline} onChange={(event) => setDiscipline(event.target.value)} aria-label={tx(locale, "Filter by practice", "실천 분야로 필터")}><option value="">{tx(locale, "All practices", "모든 분야")}</option>{disciplines.map((option) => <option key={option} value={option}>{option}</option>)}</select></div><p className="result-count" role="status">{loading ? tx(locale, "Opening artists…", "아티스트를 불러오는 중…") : locale === "ko" ? filtered.length + "명의 아티스트" : filtered.length + " artists"}</p>{error && <p role="alert">{tx(locale, "Artists could not be loaded. Please try again.", "아티스트를 불러오지 못했습니다. 다시 시도해 주세요.")}</p>}<div className="artist-directory">{filtered.map((artist, index) => <Link href={`/artist/${artist.slug}`} className="directory-row" key={artist.slug}><span className="artist-index">{String(index + 1).padStart(2, "0")}</span><span className="artist-avatar large tone-blue">{(artist.artistName || artist.displayName).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span className="directory-main"><strong>{artist.artistName || artist.displayName} {artist.verificationStatus === "approved" && <VerifiedMark compact />}</strong><span>{artist.practice || tx(locale, "Artist", "아티스트")} · {artist.basedInCity || "—"}</span></span><span className="directory-location">{artist.basedInCity || "—"}<small>{artist.country || "—"}</small></span><span className="directory-tags"><span>{artist.uauArtistId || tx(locale, "Published", "공개됨")}</span></span><ArrowUpRight size={17} /></Link>)}{!loading && !error && filtered.length === 0 && <div className="empty-state"><h3>{queryText || discipline ? tx(locale, "No matching artists.", "검색 결과가 없습니다.") : tx(locale, "No published artists yet.", "아직 공개된 아티스트가 없습니다.")}</h3><p>{tx(locale, "Try another name or practice.", "다른 이름이나 분야로 검색해 보세요.")}</p></div>}</div></PageSection></div></main>;
}
