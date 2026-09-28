import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, MoveUpRight } from "lucide-react";
import { DemoNotice, MetaLine, SectionHeading } from "./components";
import { HomeFeaturedWork, HomeWorks } from "./components/home-live-works";
import { HomeFaq } from "./components/home-faq";
import { NewlyConnected } from "./components/newly-connected";
import { RandomArtistLink } from "./components/random-artist-link";
import { getServerLocale } from "./server-locale";
import { tx } from "./i18n-shared";
import { SiteCopy } from "./site-content";

export default function Home() {
  const locale = getServerLocale();
  return <main>
    <DemoNotice />
    <section className="hero-shell page-wrap">
      <div className="hero-copy"><p className="hero-kicker">u.a.u / UNFRAME ARTIST UNIT</p><h1><SiteCopy contentKey="home.hero.line1" fallback={locale === "ko" ? "관계가 계속되는" : "A network"} /><br /><em><SiteCopy contentKey="home.hero.emphasis" fallback={locale === "ko" ? "아티스트" : "that stays"} /></em><br /><SiteCopy contentKey="home.hero.line3" fallback={locale === "ko" ? "네트워크." : "connected."} /></h1><p className="hero-lede"><SiteCopy className="site-copy-preline" contentKey="home.hero.lede" fallback={locale === "ko" ? "전시에서 시작된 관계가\n그 이후에도 이어집니다." : "A relationship that starts in an exhibition\nand keeps going after."} /><br /><small><SiteCopy contentKey="home.hero.subline" fallback={locale === "ko" ? "연결과 지속을 중심으로 움직이는 글로벌 아티스트 네트워크." : "A global artist network built around connection and continuity."} /></small></p><div className="hero-actions"><Link className="button button-blue" href="/connections"><SiteCopy contentKey="home.hero.primary" fallback={locale === "ko" ? "연결 따라가기" : "Trace the connections"} /> <ArrowUpRight size={16} /></Link><Link className="underlined-link" href="/artists"><SiteCopy contentKey="home.hero.secondary" fallback={locale === "ko" ? "아티스트 만나기" : "Meet the artists"} /> <ArrowDownRight size={16} /></Link></div></div>
      <HomeFeaturedWork locale={locale} />
    </section>

    <div className="home-manifesto" aria-label={tx(locale, "U.A.U manifesto", "U.A.U 선언") }><div className="home-manifesto-track" aria-hidden="true">{[0, 1].map((copy) => <span className="home-manifesto-group" key={copy}><b>UNFRAME ARTIST UNIT</b><i>✳</i><b>BREAK THE FRAME</b><i>✳</i><b>{tx(locale, "A NETWORK THAT STAYS", "관계가 이어지는 예술의 단위")}</b><i>✳</i><b>{tx(locale, "MAKE · MEET · CONTINUE", "만들고 · 만나고 · 이어가기")}</b><i>✳</i></span>)}</div></div>

    <section className="intro-band page-wrap" id="about"><div className="intro-title"><span>01</span><h2><SiteCopy className="site-copy-preline" contentKey="home.intro.title" fallback={locale === "ko" ? "아티스트는 실천으로 들어와\n관계로 남습니다." : "Artists enter through practice,\nremain through relationship."} /></h2></div><div className="intro-copy"><p><SiteCopy contentKey="home.intro.body" fallback={locale === "ko" ? "u.a.u는 UNFRAME을 통해 형성된 관계를 중심으로 움직이는 아티스트 유닛입니다. 전시를 넘어 지속적인 교류와 협업, 실천으로 이어갑니다." : "u.a.u is an artist unit built around relationships formed through UNFRAME — extending beyond exhibitions into ongoing exchange, collaboration and practice."} /></p><Link className="text-link" href="/connections"><SiteCopy contentKey="home.intro.cta" fallback={locale === "ko" ? "우리가 연결되는 방식" : "How we connect"} /> <ArrowUpRight size={14} /></Link></div></section>

    <section className="home-spatial" aria-labelledby="home-spatial-title"><div className="page-wrap home-spatial-inner"><div className="home-spatial-copy"><MetaLine>{tx(locale, "FROM IMAGE TO SPACE", "이미지에서 공간으로")}</MetaLine><h2 id="home-spatial-title">{tx(locale, "A work can open\nanother room.", "작품 한 점에서\n또 하나의 방이 열립니다.")}</h2><p>{tx(locale, "U.A.U connects artist pages, works and exhibition records into a living archive — with room for each practice to take its own shape.", "작가 페이지와 작품, 전시의 기록을 하나의 살아 있는 아카이브로 연결합니다. 각자의 작업이 고유한 방식으로 자리할 공간을 함께 만듭니다.")}</p><Link className="button button-light" href="/artists">{tx(locale, "Explore the artists", "아티스트 만나기")} <ArrowUpRight size={15} /></Link></div><div className="home-spatial-art" role="img" aria-label={tx(locale, "A sculptural work in a quiet gallery space", "고요한 갤러리 공간 속 입체 작업") }><span>U.A.U <i>·</i> SPATIAL ARCHIVE</span><div className="spatial-orbit spatial-orbit-one"/><div className="spatial-orbit spatial-orbit-two"/><b>ROOM<br/>FOR<br/><em>practice.</em></b><small>ARTISTS / WORKS / EXHIBITIONS</small></div></div></section>

    <section className="page-wrap section-space" id="artists"><SectionHeading title={tx(locale, "Newly connected", "새롭게 연결된 아티스트")} action={tx(locale, "All artists", "모든 아티스트")} href="/artists" /><p className="section-note">{tx(locale, "Published profiles will appear here as the unit grows.", "유닛이 성장하며 공개된 프로필이 이곳에 나타납니다.")}</p><NewlyConnected locale={locale} /><RandomArtistLink locale={locale} /></section>

    <section className="page-wrap section-space works-section"><SectionHeading title={tx(locale, "Works to spend time with", "천천히 머물러 볼 작품")} action={tx(locale, "Discover all works", "모든 작품 보기")} href="/works" /><HomeWorks locale={locale} /></section>

    <HomeFaq locale={locale} />

    <section className="join-band page-wrap"><div><MetaLine>{tx(locale, "OPEN TO / ARTISTS · CURATORS · COLLECTORS", "열려 있는 대상 / 아티스트 · 큐레이터 · 컬렉터")}</MetaLine><h2><SiteCopy contentKey="home.join.title" fallback={locale === "ko" ? "여기에는 자리가 있습니다" : "There is room for"} /><br /><span><SiteCopy contentKey="home.join.subtitle" fallback={locale === "ko" ? "다음에 올 것." : "what comes next."} /></span></h2></div><Link className="button button-blue" href="/join"><SiteCopy contentKey="home.join.cta" fallback={locale === "ko" ? "당신의 방식으로 들어오기" : "Find your way in"} /> <MoveUpRight size={16} /></Link></section>
  </main>;
}
