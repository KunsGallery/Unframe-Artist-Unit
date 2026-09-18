import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DemoNotice, MetaLine } from "../components";
import { getServerLocale } from "../server-locale";
import { tx } from "../i18n-shared";
import { ConnectionMap } from "./connection-map";

export default function ConnectionsPage() {
  const locale = getServerLocale();
  return <main><DemoNotice /><div className="page-wrap inner-page"><div className="breadcrumb"><Link href="/">u.a.u</Link><span>/</span><span>{tx(locale, "Connections", "연결")}</span></div><div className="page-intro split-intro"><div><MetaLine>{tx(locale, "THE RELATIONSHIP ARCHIVE", "관계 아카이브")}</MetaLine><h1>{tx(locale, <>Nothing happens<br /><em>alone.</em></>, <>아무 일도<br /><em>혼자 일어나지 않습니다.</em></>)}</h1></div><p>{tx(locale, "Follow the people, places, and projects that keep a practice moving. Every line starts with a real encounter.", "실천을 계속 움직이는 사람과 장소, 프로젝트를 따라가세요. 모든 선은 실제 만남에서 시작됩니다.")}</p></div><ConnectionMap locale={locale} /><section className="connection-call"><MetaLine>{tx(locale, "FIND YOUR UNIT", "당신의 유닛 찾기")}</MetaLine><h2>{tx(locale, <>I&apos;m looking for<br /><em>someone to work with.</em></>, <>함께 작업할<br /><em>사람을 찾고 있습니다.</em></>)}</h2><Link className="button button-blue" href="/artists">{tx(locale, "Start exploring", "탐색 시작하기")} <ArrowUpRight size={16} /></Link></section></div></main>;
}
