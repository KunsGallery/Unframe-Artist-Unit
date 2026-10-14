"use client";
import Link from "next/link";
import { usePublishedExhibitions } from "../organizations";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

export function ArchiveConnections({ artistSlug, workId }: { artistSlug: string; workId?: string }) {
  const { locale } = useLanguage();
  const { exhibitions, loading, error } = usePublishedExhibitions();
  const linked = exhibitions.filter(item => item.kind !== "opencall" && (workId ? item.workRefs?.some(ref => ref.artistSlug === artistSlug && ref.workId === workId) : item.artistSlugs.includes(artistSlug))).sort((a, b) => (b.startDate || b.year).localeCompare(a.startDate || a.year));
  return <section className="public-record-section" aria-label={tx(locale, "Linked exhibition records", "연결된 전시 기록")}><h2>{tx(locale, "Exhibition archive", "전시 아카이브")}</h2>
    {loading ? <p role="status">{tx(locale, "Opening records…", "전시 기록을 불러오는 중…")}</p> : error ? <p role="alert">{tx(locale, "Records could not be loaded.", "전시 기록을 불러오지 못했습니다.")}</p> : linked.length ? <div className="public-record-list">{linked.map(item => <Link className="public-record-row" href={`/exhibitions/${encodeURIComponent(item.id)}`} key={item.id}><span>{item.year}</span><div><h3>{item.title}</h3><p>{[item.startDate, item.endDate].filter(Boolean).join(" – ")}</p></div><span aria-hidden="true">↗</span></Link>)}</div> : <p>{tx(locale, "No linked exhibition records yet.", "아직 연결된 전시 기록이 없습니다.")}</p>}
  </section>;
}
