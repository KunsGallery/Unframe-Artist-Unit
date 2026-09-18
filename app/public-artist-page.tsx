"use client";

import Link from "next/link";
import { ArrowUpRight, Globe2, Instagram, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useLanguage } from "./i18n-provider";
import { tx } from "./i18n-shared";
import { db } from "./firebase-client";
import { recordEngagement } from "./engagements";
import { useAuth } from "./auth-provider";
import type { PublicProfile } from "./profile";
import { artistSiteSectionLabels, getArtistSiteSections } from "./artist/site-config";

function getInitials(value: string) {
  return value.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

function SiteHeader({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const sections = getArtistSiteSections(profile);
  return <header className="public-site-header"><Link href="/" className="public-site-brand" aria-label="u.a.u home"><img src="/assets/uau-logo-lockup.png" alt="u.a.u" /></Link><nav aria-label={tx(locale, "Artist page navigation", "아티스트 페이지 메뉴")}>{sections.map((section) => <a href={`#${section}`} key={section}>{tx(locale, artistSiteSectionLabels[section].en, artistSiteSectionLabels[section].ko)}</a>)}</nav><span className="public-site-label">u.a.u / {tx(locale, "artist page", "아티스트 페이지")}</span></header>;
}

function PublicLinks({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <div className="public-artist-links">{profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noreferrer"><Globe2 size={14} /> {tx(locale, "Website", "웹사이트")}</a>}<a href="mailto:hello@uau.unframe.kr"><Mail size={14} /> {tx(locale, "Contact", "연락하기")}</a><a href="#works"><Instagram size={14} /> Instagram</a></div>;
}

function ArtistIdentity({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <div className="public-artist-identity"><div className="public-artist-mark">{getInitials(profile.displayName)}</div><div><span>{profile.practice || tx(locale, "Artist", "아티스트")}</span><h1>{profile.artistName || profile.displayName}</h1><p>{profile.basedInCity}{profile.basedInCity && profile.country ? " · " : ""}{profile.country}</p><div className="public-artist-id"><strong>{profile.uauArtistId || tx(locale, "Identity in progress", "아이덴티티 생성 중")}</strong>{profile.verificationStatus === "approved" && <small>{tx(locale, "Verified Artist", "인증 아티스트")}</small>}{profile.foundingNumber && <small>{profile.foundingStatus === "founding" ? tx(locale, "Founding Artist", "Founding Artist") : tx(locale, "Connected Artist", "Connected Artist")}</small>}</div></div></div>;
}

function WorksSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const works = profile.siteWorks || [];
  return <section id="works" className="public-artist-works"><div className="public-section-label">{tx(locale, "Artworks", "작품")} <span>/{tx(locale, "selected works", "선정 작품")}</span></div>{works.length ? <div className="public-site-work-grid">{works.map((work, index) => <article className="public-site-work-card" key={work.id}><div className="public-work-image">{work.imageUrl ? <img src={work.imageUrl} alt={work.title} /> : <img src="/assets/uau-hero.png" alt={work.title} />}</div><div className="public-site-work-copy"><span>{String(index + 1).padStart(2, "0")} / {work.year || tx(locale, "undated", "연도 미상")}</span><h2>{work.title || tx(locale, "Untitled work", "제목 없는 작품")}</h2><p>{work.medium || tx(locale, "Medium to be added", "매체를 추가해 주세요")}</p></div></article>)}</div> : <div className="public-work-feature"><div className="public-work-image"><img src="/assets/uau-hero.png" alt={tx(locale, `${profile.displayName}'s featured work`, `${profile.displayName}의 대표 작품`)} /></div><div className="public-work-copy"><span>{tx(locale, "The first room is waiting", "첫 번째 방을 기다리는 중")}</span><h2>{tx(locale, "The work is still becoming.", "작품은 아직 되어가는 중입니다.")}</h2><p>{tx(locale, "Selected works will appear here as the artist builds their public archive.", "아티스트가 공개 아카이브를 만들어 가면 대표 작품이 이곳에 기록됩니다.")}</p><Link className="text-link" href="/login">{tx(locale, "Build an artist page", "아티스트 페이지 만들기")} <ArrowUpRight size={14} /></Link></div></div>}</section>;
}

function ExhibitionsSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const exhibitions = profile.siteExhibitions || [];
  return <section id="exhibitions" className="public-artist-section"><div className="public-section-label">{tx(locale, "Exhibitions", "전시")}</div>{exhibitions.length ? <div className="public-record-list">{exhibitions.map((exhibition) => <div key={exhibition.id}><span>{exhibition.year}</span><strong>{exhibition.title}</strong><small>{[exhibition.venue, exhibition.location].filter(Boolean).join(" · ") || tx(locale, "Location to be added", "장소 준비 중")}</small></div>)}</div> : <div className="public-empty-record"><strong>{tx(locale, "The next room is open.", "다음 방이 열려 있습니다.")}</strong><span>{tx(locale, "Exhibition records will appear here as the practice continues.", "작업이 계속되면 전시 기록이 이곳에 남습니다.")}</span></div>}</section>;
}

function CvSection({ locale }: { locale: "en" | "ko" }) {
  return <section id="cv" className="public-artist-section public-cv"><div className="public-section-label">CV</div><div><p>{tx(locale, "A concise record of exhibitions, projects, and the movements around the practice.", "작업을 둘러싼 전시와 프로젝트, 움직임을 간결하게 기록합니다.")}</p><Link className="text-link" href="/join">{tx(locale, "Connect with u.a.u", "u.a.u와 연결하기")} <ArrowUpRight size={14} /></Link></div></section>;
}

function AboutSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <section id="about" className="public-artist-section public-about"><div className="public-section-label">{tx(locale, "About", "소개")}</div><div><h2>{profile.bio || tx(locale, "A practice with a door left open.", "문을 열어둔 실천입니다.")}</h2><PublicLinks profile={profile} locale={locale} /></div></section>;
}

function PublicSiteSections({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <>{getArtistSiteSections(profile).map((section) => section === "works" ? <WorksSection key={section} profile={profile} locale={locale} /> : section === "exhibitions" ? <ExhibitionsSection key={section} profile={profile} locale={locale} /> : section === "cv" ? <CvSection key={section} locale={locale} /> : <AboutSection key={section} profile={profile} locale={locale} />)}</>;
}

function GalleryTemplate({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <div className="public-template public-template-gallery"><section className="public-gallery-hero"><div className="public-gallery-hero-art"><img src="/assets/uau-hero.png" alt={tx(locale, "Featured artwork", "대표 작품")} /></div><div className="public-gallery-hero-copy"><span>{profile.practice || tx(locale, "Artist", "아티스트")}</span><h1>{profile.artistName || profile.displayName}</h1><p>{profile.basedInCity} · {profile.country}</p><PublicLinks profile={profile} locale={locale} /></div></section><PublicSiteSections profile={profile} locale={locale} /></div>;
}

function EditorialTemplate({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <div className="public-template public-template-editorial"><section className="public-editorial-hero"><ArtistIdentity profile={profile} locale={locale} /><div className="public-editorial-statement"><p>{profile.bio || tx(locale, "A practice that keeps the question open.", "질문을 열어둔 채 계속 움직이는 실천.")}</p><PublicLinks profile={profile} locale={locale} /></div></section><PublicSiteSections profile={profile} locale={locale} /></div>;
}

function ArchiveTemplate({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <div className="public-template public-template-archive"><section className="public-archive-intro"><ArtistIdentity profile={profile} locale={locale} /><p>{profile.bio || tx(locale, "A living index of works, encounters, and what comes after.", "작품과 만남, 그리고 그 이후를 기록하는 살아 있는 색인.")}</p><PublicLinks profile={profile} locale={locale} /></section><PublicSiteSections profile={profile} locale={locale} /></div>;
}

export function PublicArtistPage({ slug }: { slug: string }) {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const recordedView = useRef(false);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    return onSnapshot(doc(db, "public_profiles", slug), (snapshot) => {
      const next = snapshot.exists() ? ({ ...snapshot.data(), slug } as PublicProfile) : null;
      setProfile(next?.published ? next : null);
      setError(!next?.published);
      setLoading(false);
    }, () => {
      setError(true);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!user || !profile || recordedView.current) return;
    recordedView.current = true;
    void recordEngagement({ actorUid: user.uid, action: "view", targetType: "artist", targetId: slug, source: "public-artist-page" });
  }, [profile, slug, user]);

  if (loading) return <main className="public-artist-page"><div className="public-page-loading">{tx(locale, "Opening the artist's room…", "아티스트의 공간을 여는 중…")}</div></main>;
  if (error || !profile) return <main className="public-artist-page"><div className="public-page-private"><span>u.a.u</span><h1>{tx(locale, "This room is not open yet.", "아직 열리지 않은 공간입니다.")}</h1><p>{tx(locale, "The artist is still shaping this page. Come back when the door is open.", "아티스트가 아직 페이지를 다듬고 있습니다. 문이 열리면 다시 찾아와 주세요.")}</p><Link className="button button-blue" href="/artists">{tx(locale, "Explore artists", "아티스트 둘러보기")} <ArrowUpRight size={16} /></Link></div></main>;

  return <main className="public-artist-page"><SiteHeader profile={profile} locale={locale} /><div className="public-artist-shell" data-site-accent={profile.siteAccent || "blue"}>{profile.siteTemplate === "gallery" ? <GalleryTemplate profile={profile} locale={locale} /> : profile.siteTemplate === "archive" ? <ArchiveTemplate profile={profile} locale={locale} /> : <EditorialTemplate profile={profile} locale={locale} />}<footer className="public-artist-footer"><span>u.a.u / UNFRAME ARTIST UNIT</span><span>{profile.uauArtistId || profile.displayName} · {profile.basedInCity}</span><Link href="/">{tx(locale, "Enter u.a.u", "u.a.u 들어가기")} <ArrowUpRight size={13} /></Link></footer></div></main>;
}
