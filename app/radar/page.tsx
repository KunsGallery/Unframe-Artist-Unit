"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Sparkles } from "lucide-react";
import { DemoNotice, PageIntro, PageSection, SectionHeading } from "../components";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { usePublishedExhibitions, usePublishedGalleries } from "../organizations";

export default function RadarPage() {
  const { locale } = useLanguage();
  const { exhibitions, loading, error } = usePublishedExhibitions();
  const { galleries } = usePublishedGalleries();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = exhibitions.filter((item) => item.startDate && (!item.endDate || item.endDate >= today))
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

  return <main><DemoNotice /><div className="page-wrap radar-page"><PageIntro className="radar-hero" bare showActions={false} />
    <PageSection sectionId="calendar"><section className="radar-section"><SectionHeading title={tx(locale, "On the calendar", "캘린더 위의 장면")} action={tx(locale, "Browse exhibitions", "전시 둘러보기")} href="/projects" />
      {error && <p role="alert">{tx(locale, "The calendar could not be loaded.", "일정을 불러오지 못했습니다.")}</p>}
      {loading && <p>{tx(locale, "Opening the calendar…", "일정을 불러오는 중…")}</p>}
      <div className="radar-event-list" id="events">{upcoming.map((event, index) => {
        const gallery = galleries.find((item) => item.id === event.galleryId);
        return <article className="radar-event-row" key={event.id}><span className="radar-index">{String(index + 1).padStart(2, "0")}</span><div className="radar-date"><CalendarDays size={15} /><strong>{event.startDate}{event.endDate ? ` — ${event.endDate}` : ""}</strong><small>{tx(locale, "Exhibition", "전시")}</small></div><div><span className="meta-line">{gallery?.name || "u.a.u"}{gallery?.city ? ` · ${gallery.city}` : ""}</span><h2>{event.title}</h2><p>{event.description}</p><Link className="text-link" href={`/exhibitions/${event.id}`}>{tx(locale, "View exhibition", "전시 보기")} <ArrowUpRight size={14} /></Link></div></article>;
      })}{!loading && !error && upcoming.length === 0 && <div className="empty-state"><h3>{tx(locale, "No upcoming public dates yet.", "아직 공개된 예정 일정이 없습니다.")}</h3><p>{tx(locale, "Dated, published exhibitions will appear here.", "날짜를 입력하고 공개한 전시가 이곳에 표시됩니다.")}</p></div>}</div>
    </section></PageSection>
    <PageSection sectionId="opportunities"><section className="radar-section"><SectionHeading title={tx(locale, "Open calls & opportunities", "공개 모집과 기회")} /><div className="empty-state"><h3>{tx(locale, "No open calls have been published yet.", "아직 공개된 모집이 없습니다.")}</h3><p>{tx(locale, "Confirmed calls will appear here when they are ready.", "확인된 공고가 준비되면 이곳에 표시됩니다.")}</p></div></section></PageSection>
    <PageSection sectionId="note"><section className="radar-note"><Sparkles size={18} /><div><span className="meta-line">{tx(locale, "WHY THIS IS HERE", "이곳에 있는 이유")}</span><h2>{tx(locale, "A date that leads to a place.", "사람과 공간으로 이어지는 일정.")}</h2><p>{tx(locale, "This calendar comes from exhibitions published by the unit. Each listing leads back to the actual exhibition record.", "이 일정은 유닛이 공개한 전시 기록에서 가져옵니다. 각 일정에서 실제 전시 기록으로 이동할 수 있습니다.")}</p></div></section></PageSection>
  </div></main>;
}
