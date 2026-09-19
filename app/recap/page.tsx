import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { Breadcrumb, DemoNotice, MetaLine, SectionHeading } from "../components";
import { annualRecap } from "../data";
import { getServerLocale } from "../server-locale";
import { tx } from "../i18n-shared";

export default function RecapPage() {
  const locale = getServerLocale();
  if (annualRecap.stats.length === 0) {
    return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={tx(locale, "Annual recap", "연간 리캡")} /><div className="empty-state"><h3>{tx(locale, "No annual recap yet.", "아직 연간 리캡이 없습니다.")}</h3><p>{tx(locale, "The recap will appear after the unit has published its first annual record.", "유닛의 첫 연간 기록이 공개되면 이곳에 리캡이 나타납니다.")}</p></div></div></main>;
  }
  const stats = locale === "ko" ? ["유닛의 아티스트", "진행 중인 프로젝트", "새로운 연결", "연결된 도시"] : annualRecap.stats.map(([, label]) => label);
  return <main><DemoNotice /><div className="page-wrap inner-page recap-page"><Breadcrumb current={annualRecap.title} /><section className="recap-hero"><div><MetaLine>{tx(locale, "u.a.u ANNUAL CONNECTION RECAP", "u.a.u 연간 연결 리캡")}</MetaLine><h1>{annualRecap.title}</h1><p>{annualRecap.intro}</p><div className="recap-event-meta"><span><CalendarDays size={15} /> {tx(locale, "Annual record", "연간 기록")}</span><span><MapPin size={15} /> {annualRecap.subtitle}</span></div></div><div className="recap-orbit" aria-hidden="true"><span>u.a.u</span><i /><i /><i /></div></section><section className="recap-stat-board"><div className="recap-stat-heading"><MetaLine>{tx(locale, "THE YEAR IN NUMBERS", "숫자로 보는 한 해")}</MetaLine><p>{tx(locale, "Not a leaderboard. A record of what moved between people.", "순위가 아닙니다. 사람 사이에서 움직인 것들의 기록입니다.")}</p></div>{annualRecap.stats.map(([value, label], index) => <div className="recap-stat" key={label}><strong>{value}</strong><span>{stats[index]}</span></div>)}</section><section className="recap-awards"><SectionHeading title={tx(locale, "Connection awards", "연결 어워드")} /><div className="award-list">{annualRecap.awards.map(([award, winner, description], index) => <div className="award-row" key={award}><span>0{index + 1}</span><div><MetaLine>{award}</MetaLine><h3>{winner}</h3><p>{description}</p></div><Sparkles size={16} /></div>)}</div></section><section className="recap-gathering"><MetaLine>{annualRecap.title}</MetaLine><h2>{tx(locale, <>Come back<br /><em>for the next connection.</em></>, <>다음 연결을 위해<br /><em>다시 돌아오세요.</em></>)}</h2><Link className="button button-blue" href="/join">{tx(locale, "Find your way in", "당신의 방식으로 들어오기")} <ArrowUpRight size={16} /></Link></section></div></main>;
}
