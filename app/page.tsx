import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, MoveUpRight } from "lucide-react";
import { DemoNotice, MetaLine, SectionHeading } from "./components";
import { artworks } from "./data";
import { HomeFaq } from "./components/home-faq";
import { NewlyConnected } from "./components/newly-connected";
import { getServerLocale } from "./server-locale";
import { tx } from "./i18n-shared";
import { SiteCopy } from "./site-content";

export default function Home() {
  const locale = getServerLocale();
  return <main>
    <DemoNotice />
    <section className="hero-shell page-wrap">
      <div className="hero-copy"><p className="hero-kicker">u.a.u / UNFRAME ARTIST UNIT</p><h1><SiteCopy contentKey="home.hero.line1" fallback={locale === "ko" ? "관계가 계속되는" : "A network"} /><br /><em><SiteCopy contentKey="home.hero.emphasis" fallback={locale === "ko" ? "아티스트" : "that stays"} /></em><br /><SiteCopy contentKey="home.hero.line3" fallback={locale === "ko" ? "네트워크." : "connected."} /></h1><p className="hero-lede"><SiteCopy className="site-copy-preline" contentKey="home.hero.lede" fallback={locale === "ko" ? "전시에서 시작된 관계가\n그 이후에도 이어집니다." : "A relationship that starts in an exhibition\nand keeps going after."} /><br /><small><SiteCopy contentKey="home.hero.subline" fallback={locale === "ko" ? "연결과 지속을 중심으로 움직이는 글로벌 아티스트 네트워크." : "A global artist network built around connection and continuity."} /></small></p><div className="hero-actions"><Link className="button button-blue" href="/connections"><SiteCopy contentKey="home.hero.primary" fallback={locale === "ko" ? "연결 따라가기" : "Trace the connections"} /> <ArrowUpRight size={16} /></Link><Link className="underlined-link" href="/artists"><SiteCopy contentKey="home.hero.secondary" fallback={locale === "ko" ? "아티스트 만나기" : "Meet the artists"} /> <ArrowDownRight size={16} /></Link></div></div>
      <div className="hero-stage"><div className="hero-stage-label"><span>{tx(locale, "Published work", "공개된 작품")}</span><span>{artworks.length > 0 ? `01 / ${String(artworks.length).padStart(2, "0")}` : "—"}</span></div><div className="empty-state hero-empty-state"><h3>{tx(locale, "The first work is on its way.", "첫 작품을 기다리고 있습니다.")}</h3><p>{tx(locale, "Published works will appear here when artists open their archive.", "아티스트가 아카이브를 공개하면 이곳에 작품이 나타납니다.")}</p><Link className="text-link" href="/join">{tx(locale, "Open your artist page", "아티스트 페이지 열기")} <ArrowUpRight size={14} /></Link></div></div>
    </section>

    <section className="intro-band page-wrap" id="about"><div className="intro-title"><span>01</span><h2><SiteCopy className="site-copy-preline" contentKey="home.intro.title" fallback={locale === "ko" ? "아티스트는 실천으로 들어와\n관계로 남습니다." : "Artists enter through practice,\nremain through relationship."} /></h2></div><div className="intro-copy"><p><SiteCopy contentKey="home.intro.body" fallback={locale === "ko" ? "u.a.u는 UNFRAME을 통해 형성된 관계를 중심으로 움직이는 아티스트 유닛입니다. 전시를 넘어 지속적인 교류와 협업, 실천으로 이어갑니다." : "u.a.u is an artist unit built around relationships formed through UNFRAME — extending beyond exhibitions into ongoing exchange, collaboration and practice."} /></p><Link className="text-link" href="/connections"><SiteCopy contentKey="home.intro.cta" fallback={locale === "ko" ? "우리가 연결되는 방식" : "How we connect"} /> <ArrowUpRight size={14} /></Link></div></section>

    <section className="page-wrap section-space" id="artists"><SectionHeading title={tx(locale, "Newly connected", "새롭게 연결된 아티스트")} action={tx(locale, "All artists", "모든 아티스트")} href="/artists" /><p className="section-note">{tx(locale, "Published profiles will appear here as the unit grows.", "유닛이 성장하며 공개된 프로필이 이곳에 나타납니다.")}</p><NewlyConnected locale={locale} /></section>

    <section className="page-wrap section-space works-section"><SectionHeading title={tx(locale, "Works to spend time with", "천천히 머물러 볼 작품")} action={tx(locale, "Discover all works", "모든 작품 보기")} href="/works" />{artworks.length > 0 ? <div className="works-grid">{artworks.slice(0, 3).map(work => <Link href={`/works/${work.id}`} className="work-card" key={work.id}><div className={`work-art ${work.accent}`} /><div className="work-info"><div><strong>{work.title}</strong><span>{work.artist} · {work.year}</span></div></div></Link>)}</div> : <div className="empty-state"><h3>{tx(locale, "No published works yet.", "아직 공개된 작품이 없습니다.")}</h3><p>{tx(locale, "Works will appear here after an artist publishes them.", "아티스트가 작품을 공개하면 이곳에 나타납니다.")}</p></div>}</section>

    <HomeFaq locale={locale} />

    <section className="join-band page-wrap"><div><MetaLine>{tx(locale, "OPEN TO / ARTISTS · CURATORS · COLLECTORS", "열려 있는 대상 / 아티스트 · 큐레이터 · 컬렉터")}</MetaLine><h2>{tx(locale, "There is room for", "여기에는 자리가 있습니다")}<br /><span>{tx(locale, "what comes next.", "다음에 올 것.")}</span></h2></div><Link className="button button-blue" href="/join">{tx(locale, "Find your way in", "당신의 방식으로 들어오기")} <MoveUpRight size={16} /></Link></section>
  </main>;
}
