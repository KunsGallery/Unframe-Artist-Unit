"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageSection, SectionHeading } from "../components";
import { usePublicArchive } from "../public-archive";
import { useSitePageContent } from "../site-page-content";
import { HomeWorks } from "./home-live-works";
import { NewlyConnected } from "./newly-connected";
import { tx, type Locale } from "../i18n-shared";

export function HomeDiscovery({ locale }: { locale: Locale }) {
  const { artists, loading, error, retry } = usePublicArchive();
  const { content } = useSitePageContent();
  const hasWorks = artists.some((artist) => artist.siteWorks?.some((work) => work.id && work.title && work.imageUrl));
  const showWorks = !content.hiddenSections.includes("works");
  const showArtists = !content.hiddenSections.includes("artists");
  if (!showWorks && !showArtists) return null;
  if (loading || error || !artists.length) return <PageSection sectionId={showWorks ? "works" : "artists"}><section className="page-wrap catalogue-archive-notice" aria-live="polite"><div><h2>{loading ? tx(locale, "Opening the archive…", "아카이브를 열고 있습니다…") : error ? tx(locale, "The archive could not be opened.", "아카이브를 불러오지 못했습니다.") : tx(locale, "The next connection starts with a practice.", "다음 연결은, 한 사람의 작업에서.")}</h2><p>{error ? tx(locale, "Please try again in a moment.", "잠시 후 다시 시도해 주세요.") : tx(locale, "Published artists and works appear here. Discover how to join.", "공개된 작가와 작품이 이곳에 모입니다. U.A.U와 함께하는 방법을 알아보세요.")}</p></div>{error ? <button type="button" className="button button-outline" onClick={retry}>{tx(locale, "Try again", "다시 시도")}</button> : <Link className="text-link" href="/join">{tx(locale, "U.A.U participation", "U.A.U 참여 안내")}<ArrowUpRight size={16} /></Link>}</section></PageSection>;
  return <>{hasWorks && showWorks && <PageSection sectionId="works"><section className="page-wrap section-space works-section"><SectionHeading title={tx(locale, "Works to spend time with", "천천히 머물러 볼 작품")} action={tx(locale, "All works", "모든 작품 보기")} href="/works" /><HomeWorks locale={locale} /></section></PageSection>}{showArtists && <PageSection sectionId="artists"><section className="page-wrap section-space"><SectionHeading title={tx(locale, "U.A.U artists", "U.A.U 아티스트")} action={tx(locale, "All artists", "모든 아티스트")} href="/artists" /><NewlyConnected locale={locale} /></section></PageSection>}</>;
}
