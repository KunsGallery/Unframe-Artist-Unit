"use client";

import Link from "next/link";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Breadcrumb, DemoNotice, PageIntro, PageSection, VerifiedMark } from "../components";
import { db } from "../firebase-client";
import type { PublicProfile } from "../profile";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

const disciplines = ["All practices", "Painting", "Textile / Installation", "Sound", "Sculpture", "Moving image", "Ceramics"];
const disciplineKo: Record<string, string> = { "All practices": "모든 분야", Painting: "회화", "Textile / Installation": "텍스타일 / 설치", Sound: "사운드", Sculpture: "조각", "Moving image": "영상", Ceramics: "도예" };

export default function ArtistsPage() {
  const { locale } = useLanguage();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [discipline, setDiscipline] = useState("All practices");

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    return onSnapshot(query(collection(db, "public_profiles"), where("published", "==", true)), (snapshot) => {
      setProfiles(snapshot.docs.map((item) => ({ slug: item.id, ...item.data() } as PublicProfile)));
      setLoading(false);
    }, () => {
      setProfiles([]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => profiles.filter((profile) => {
    const haystack = [profile.artistName, profile.displayName, profile.basedInCity, profile.country, profile.practice, profile.bio].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(queryText.toLowerCase()) && (discipline === "All practices" || profile.practice === discipline);
  }), [discipline, profiles, queryText]);

  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={tx(locale, "Artists", "아티스트")} /><PageIntro /><PageSection sectionId="directory"><div className="filter-bar"><label className="search-field"><span className="sr-only">{tx(locale, "Search artists", "아티스트 검색")}</span><input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder={tx(locale, "Search artists…", "아티스트 검색…")} /><span>⌕</span></label><select value={discipline} onChange={(event) => setDiscipline(event.target.value)} aria-label={tx(locale, "Filter by practice", "실천 분야로 필터")}>{disciplines.map((option) => <option key={option} value={option}>{tx(locale, option, disciplineKo[option])}</option>)}</select><button className="filter-button" type="button"><SlidersHorizontal size={15} /> {tx(locale, "More filters", "추가 필터")}</button></div><p className="result-count">{locale === "ko" ? filtered.length + "명의 아티스트" : filtered.length + " artists"}</p><div className="artist-directory">{filtered.map((artist, index) => <Link href={"/artist/" + artist.slug} className="directory-row" key={artist.slug}><span className="artist-index">0{index + 1}</span><span className="artist-avatar large tone-blue">{(artist.artistName || artist.displayName).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span className="directory-main"><strong>{artist.artistName || artist.displayName} {artist.verificationStatus === "approved" && <VerifiedMark compact />}</strong><span>{artist.practice || tx(locale, "Artist", "아티스트")} · {artist.basedInCity || "—"}</span></span><span className="directory-location">{artist.basedInCity || "—"}<small>{artist.country || "—"}</small></span><span className="directory-tags"><span>{artist.uauArtistId || tx(locale, "Published", "공개됨")}</span></span><ArrowUpRight size={17} /></Link>)}{!loading && filtered.length === 0 && <div className="empty-state"><h3>{tx(locale, "No published artists yet.", "아직 공개된 아티스트가 없습니다.")}</h3><p>{tx(locale, "Published profiles will appear here when they are ready.", "공개된 프로필이 준비되면 이곳에 나타납니다.")}</p></div>}</div></PageSection></div></main>;
}
