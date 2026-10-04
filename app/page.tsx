import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DemoNotice, PageSection, ArtImage } from "./components";
import { HomeFeaturedWork } from "./components/home-live-works";
import { HomeDiscovery } from "./components/home-discovery";
import { HomeMarquee } from "./components/home-marquee";
import { HomeFaq } from "./components/home-faq";
import { getServerLocale } from "./server-locale";
import { tx } from "./i18n-shared";
import { SiteCopy } from "./site-content";
import "./home.css";

// Living catalogue: artwork leads; the existing U.A.U identity and relationship story stay.
export default function Home() {
  const locale = getServerLocale();
  return <main className="home-catalogue"><DemoNotice />
    <section className="hero-shell page-wrap"><div className="hero-copy">
      <h1><SiteCopy className="site-copy-preline" contentKey="home.catalogue.title" fallback={tx(locale, "Meet the work.\nStay connected.", "작품을 만나고,\n관계를 이어갑니다.")} /></h1>
      <p className="hero-lede"><SiteCopy className="site-copy-preline" contentKey="home.hero.lede" fallback={tx(locale, "A relationship that starts in an exhibition and keeps going after.", "전시에서 시작된 관계가 그 이후에도 이어집니다.")} /></p>
      <div className="hero-actions"><Link className="button button-blue" href="/artists"><SiteCopy contentKey="home.catalogue.primary" fallback={tx(locale, "Explore the artists", "아티스트 둘러보기")} /><ArrowUpRight size={16} /></Link><Link className="underlined-link" href="/join"><SiteCopy contentKey="home.catalogue.secondary" fallback={tx(locale, "Join U.A.U", "U.A.U 참여 안내")} /><ArrowUpRight size={16} /></Link></div>
    </div><HomeFeaturedWork locale={locale} /></section>
    <div className="home-sections"><PageSection sectionId="manifesto"><HomeMarquee /></PageSection><HomeDiscovery locale={locale} />
      <PageSection sectionId="spatial"><section className="home-spatial" aria-labelledby="home-spatial-title"><div className="page-wrap home-spatial-inner"><div className="home-spatial-copy"><h2 id="home-spatial-title"><SiteCopy className="site-copy-preline" contentKey="home.spatial.title" fallback={tx(locale, "One artwork opens another room.", "작품 한 점에서 또 하나의 방이 열립니다.")} /></h2><p><SiteCopy contentKey="home.spatial.body" fallback={tx(locale, "Connect artist pages, works and exhibition records in a living archive.", "작가 페이지와 작품, 전시의 기록을 하나의 살아 있는 아카이브로 연결합니다.")} /></p><Link className="button button-light" href="/projects">{tx(locale, "Explore the exhibition archive", "전시 아카이브 둘러보기")}<ArrowUpRight size={16} /></Link></div><ArtImage className="catalogue-spatial-image" src="/assets/uau-hero.webp" label={tx(locale, "U.A.U gallery installation visual", "U.A.U 갤러리 설치 비주얼")} /></div></section></PageSection>
      <PageSection sectionId="intro"><section className="intro-band page-wrap" id="about"><div className="intro-title"><h2><SiteCopy className="site-copy-preline" contentKey="home.intro.title" fallback={tx(locale, "Artists enter through practice, remain through relationship.", "아티스트는 실천으로 들어와 관계로 남습니다.")} /></h2></div><div className="intro-copy"><p><SiteCopy contentKey="home.intro.body" fallback={tx(locale, "An artist unit connected through UNFRAME, beyond the exhibition.", "UNFRAME을 통해 형성된 관계를 전시 이후의 교류와 협업으로 이어갑니다.")} /></p><Link className="text-link" href="/about">{tx(locale, "About U.A.U", "U.A.U 알아보기")}<ArrowUpRight size={16} /></Link></div></section></PageSection>
      <PageSection sectionId="join"><section className="join-band page-wrap"><div><h2><SiteCopy contentKey="home.join.title" fallback={tx(locale, "There is room for", "여기에는 자리가 있습니다")} /><br /><SiteCopy contentKey="home.join.subtitle" fallback={tx(locale, "what comes next.", "다음에 올 것.")} /></h2><p>{tx(locale, "Artists, curators, galleries and collectors — find your way into the unit.", "아티스트, 큐레이터, 갤러리, 컬렉터. 각자의 방식으로 함께하세요.")}</p></div><Link className="button button-blue" href="/join"><SiteCopy contentKey="home.join.cta" fallback={tx(locale, "Find your way in", "당신의 방식으로 들어오기")} /><ArrowUpRight size={16} /></Link></section></PageSection>
      <PageSection sectionId="faq"><HomeFaq locale={locale} /></PageSection>
    </div></main>;
}
