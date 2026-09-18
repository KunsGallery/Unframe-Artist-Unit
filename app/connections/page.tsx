import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DemoNotice, PageIntro, PageSection } from "../components";
import { getServerLocale } from "../server-locale";
import { tx } from "../i18n-shared";
import { ConnectionMap } from "./connection-map";

export default function ConnectionsPage() {
  const locale = getServerLocale();
  return <main><DemoNotice /><div className="page-wrap inner-page"><div className="breadcrumb"><Link href="/">u.a.u</Link><span>/</span><span>{tx(locale, "Connections", "연결")}</span></div><PageIntro split /><PageSection sectionId="map"><ConnectionMap locale={locale} /></PageSection><PageSection sectionId="call"><section className="connection-call"><div><span className="meta-line">{tx(locale, "FIND YOUR UNIT", "당신의 유닛 찾기")}</span><h2>{tx(locale, <>I&apos;m looking for<br /><em>someone to work with.</em></>, <>함께 작업할<br /><em>사람을 찾고 있습니다.</em></>)}</h2><Link className="button button-blue" href="/artists">{tx(locale, "Start exploring", "탐색 시작하기")} <ArrowUpRight size={16} /></Link></div></section></PageSection></div></main>;
}
