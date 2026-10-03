"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, ExternalLink, FileDown, Globe2, Mail } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePublicArchive } from "./public-archive";
import { collection, doc, limit, onSnapshot, query, where } from "firebase/firestore";
import { useLanguage } from "./i18n-provider";
import { tx } from "./i18n-shared";
import { db } from "./firebase-client";
import { recordEngagement } from "./engagements";
import { useAuth } from "./auth-provider";
import type { PublicProfile } from "./profile";
import type { ArtistSiteWork } from "./profile";
import { ArtistContact } from "./components/artist-contact";
import "./artist-growth.css";
import "./public-artist-layout.css";
import { artistSiteSectionLabels, getArtistSiteSections } from "./artist/site-config";
import { artistCvCategories, artistCvCategoryLabels, formatArtistCvDate, safeExternalUrl, sortArtistCvEntries } from "./artist/cv";

function getInitials(value: string) {
  return value.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

function SiteHeader({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const sections = getArtistSiteSections(profile);
return <header className="public-site-header"><Link href="/" className="public-site-brand" aria-label="u.a.u home"><img src="/assets/uau-logo-lockup.png" alt="u.a.u" /></Link><nav aria-label={tx(locale, "Artist page navigation", "아티스트 페이지 메뉴")}>{sections.map((section) => <a href={`#${section}`} key={section}>{tx(locale, artistSiteSectionLabels[section].en, artistSiteSectionLabels[section].ko)}</a>)}{(profile.contactPurposes?.length || profile.collaborationOpen) ? <a href="#contact">{tx(locale, "Contact", "연락")}</a> : null}</nav><span className="public-site-label">u.a.u / {tx(locale, "artist page", "아티스트 페이지")}</span></header>;
}

function ArtistSectionIndex({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const sections = useMemo(() => [{ id: "public-artist-content-start", label: tx(locale, "Artist", "작가") }, ...getArtistSiteSections(profile).map((id) => ({ id, label: tx(locale, artistSiteSectionLabels[id].en, artistSiteSectionLabels[id].ko) })), ...(profile.contactPurposes?.length || profile.collaborationOpen ? [{ id: "contact", label: tx(locale, "Contact", "연락") }] : [])], [locale, profile]);
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState("hero");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const hero = document.querySelector<HTMLElement>(".public-personal-hero, .public-gallery-hero, .public-archive-intro");
        setVisible(Boolean(hero && window.scrollY > hero.offsetHeight - 160));
        const visibleSections = sections.map(({ id }) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section)).filter((section) => section.getBoundingClientRect().top < 180);
        const visibleSection = visibleSections[visibleSections.length - 1];
        if (visibleSection?.id) setActiveId(visibleSection.id);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [sections]);
  return <aside className={`public-artist-index ${visible ? "is-visible" : ""}`} aria-label={tx(locale, "Artist page index", "작가 페이지 목차")}><strong>{profile.artistName || profile.displayName}</strong><span>{profile.practice}</span><nav>{sections.map((section) => <a key={section.id} href={`#${section.id}`} className={activeId === section.id ? "is-active" : ""}>{section.label}</a>)}</nav><a href="#public-artist-content-start" className="public-index-top">{tx(locale, "Back to top", "페이지 위로 ↑")}</a></aside>;
}

function PublicLinks({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const hasContact = Boolean(profile.contactPurposes?.length || profile.collaborationOpen);
  return <div className="public-artist-links">{profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noreferrer"><Globe2 size={14} /> {tx(locale, "Website", "웹사이트")}</a>}{hasContact && <a href="#contact"><Mail size={14} /> {tx(locale, "Contact", "연락하기")}</a>}</div>;
}

function ArtistIdentity({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <div className="public-artist-identity"><div className="public-artist-mark">{profile.profileImageUrl ? <img src={profile.profileImageUrl} alt="" loading="eager" decoding="async" /> : getInitials(profile.displayName)}</div><div><span>{profile.practice || tx(locale, "Artist", "아티스트")}</span><h1>{profile.artistName || profile.displayName}</h1><p>{profile.basedInCity}{profile.basedInCity && profile.country ? " · " : ""}{profile.country}</p><div className="public-artist-id"><strong>{profile.uauArtistId || tx(locale, "Identity in progress", "아이덴티티 생성 중")}</strong>{profile.verificationStatus === "approved" && <small>{tx(locale, "Verified Artist", "인증 아티스트")}</small>}{profile.foundingNumber && <small>{profile.foundingStatus === "founding" ? tx(locale, "Founding Artist", "Founding Artist") : tx(locale, "Connected Artist", "Connected Artist")}</small>}</div></div></div>;
}

function WorksSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const works = (profile.siteWorks || []).filter((work) => work.title?.trim() && work.imageUrl?.trim());
  const [activeMedium, setActiveMedium] = useState("all");
  const [activeYear, setActiveYear] = useState("all");
  const [modalView, setModalView] = useState<{ mode: "archive" } | { mode: "work"; work: ArtistSiteWork; fromArchive: boolean } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const media = Array.from(new Set(works.map((work) => work.medium?.trim()).filter((medium): medium is string => Boolean(medium))));
  const years = Array.from(new Set(works.map((work) => work.year).filter(Boolean))).sort().reverse();
  const filteredWorks = works.filter((work) => (activeMedium === "all" || work.medium?.trim() === activeMedium) && (activeYear === "all" || work.year === activeYear));
  const visibleLimit = profile.siteTemplate === "archive" ? 6 : 2;
  const selectedWorks = filteredWorks.slice(0, visibleLimit);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (modalView && !dialog.open) dialog.showModal();
    if (!modalView && dialog.open) dialog.close();
  }, [modalView]);

  function closeViewer() {
    setModalView(null);
  }

  function moveWithinArchive(direction: -1 | 1) {
    if (modalView?.mode !== "work") return;
    const source = modalView.fromArchive ? works : selectedWorks;
    const currentIndex = source.findIndex((work) => work.id === modalView.work.id);
    if (currentIndex < 0 || source.length < 2) return;
    const nextWork = source[(currentIndex + direction + source.length) % source.length];
    setModalView({ ...modalView, work: nextWork });
  }

  function artworkCard(work: ArtistSiteWork, index: number, fromArchive = false) {
    return <button type="button" className="public-site-work-card" key={work.id} onClick={() => setModalView({ mode: "work", work, fromArchive })} aria-label={tx(locale, `Open ${work.title}`, `${work.title} 상세 보기`)}>
      <span className="public-work-image"><img src={work.displayImageUrl || work.imageUrl} srcSet={work.thumbnailImageUrl && work.displayImageUrl && work.thumbnailImageWidth && work.displayImageWidth && work.thumbnailImageWidth !== work.displayImageWidth ? `${work.thumbnailImageUrl} ${work.thumbnailImageWidth}w, ${work.displayImageUrl} ${work.displayImageWidth}w` : undefined} sizes="(max-width: 600px) 100vw, 50vw" alt={work.title} loading="lazy" decoding="async" /></span>
      <span className="public-site-work-copy"><span>{String(index + 1).padStart(2, "0")} / {work.year || tx(locale, "undated", "연도 미상")}</span><strong>{work.title}</strong><span>{work.medium || tx(locale, "Medium not listed", "매체 미기재")}</span></span>
    </button>;
  }

  return <section id="works" className="public-artist-works"><div className="public-works-heading"><div><div className="public-section-label">{tx(locale, "Selected works", "작품")}</div><h2 className="public-section-title">{tx(locale, "A selection of works", "작업의 장면들")}</h2><p>{tx(locale, `${works.length} works in this artist's public archive`, `공개 아카이브 ${works.length}점`)}</p></div>{works.length > visibleLimit && <button type="button" className="public-archive-open" onClick={() => setModalView({ mode: "archive" })}>{tx(locale, "View full archive", "전체 작품 보기")} <ArrowUpRight size={15}/></button>}</div>
   {works.length > 1 && media.length > 1 && <div className="public-work-filters" role="group" aria-label={tx(locale, "Filter works by medium", "매체별 작품 필터")}><button type="button" aria-pressed={activeMedium === "all"} className={activeMedium === "all" ? "is-active" : ""} onClick={() => setActiveMedium("all")}>{tx(locale, "All", "전체")}</button>{media.map((medium) => <button type="button" key={medium} aria-pressed={activeMedium === medium} className={activeMedium === medium ? "is-active" : ""} onClick={() => setActiveMedium(medium)}>{medium}</button>)}</div>}
    {profile.siteTemplate === "archive" && years.length > 1 && <label className="artist-year-filter">{tx(locale, "Year", "제작 연도")}<select value={activeYear} onChange={(event) => setActiveYear(event.target.value)}><option value="all">{tx(locale, "All years", "전체 연도")}</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>}
    {works.length ? <div className="public-site-work-grid">{selectedWorks.map((work) => artworkCard(work, works.indexOf(work)))}</div> : <div className="public-empty-record"><strong>{tx(locale, "No selected works yet.", "아직 공개된 작품이 없습니다.")}</strong><span>{tx(locale, "Works will appear here after the artist adds them to this page.", "아티스트가 공개할 작품을 추가하면 이곳에 표시됩니다.")}</span></div>}
    <p className="public-work-filter-status" role="status">{tx(locale, `${selectedWorks.length} of ${filteredWorks.length} works shown`, `${filteredWorks.length}점 중 ${selectedWorks.length}점 표시 중`)}</p>
    <dialog ref={dialogRef} className="public-artist-dialog" onClose={closeViewer} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); moveWithinArchive(-1); } if (event.key === "ArrowRight") { event.preventDefault(); moveWithinArchive(1); } }} aria-label={modalView?.mode === "archive" ? tx(locale, "Complete artwork archive", "전체 작품 아카이브") : tx(locale, "Artwork details", "작품 상세 정보")}>
      <div className="public-dialog-toolbar">{modalView?.mode === "work" && modalView.fromArchive ? <button type="button" className="public-dialog-back" onClick={() => setModalView({ mode: "archive" })}>{tx(locale, "Back to archive", "아카이브로 돌아가기")}</button> : <span className="public-section-label">{modalView?.mode === "archive" ? tx(locale, "Complete archive", "전체 작품") : tx(locale, "Artwork", "작품")}</span>}<button type="button" className="public-dialog-close" onClick={closeViewer} aria-label={tx(locale, "Close", "닫기")}>×</button></div>
      {modalView?.mode === "archive" ? <><h2 className="public-dialog-title">{tx(locale, "Works, gathered over time.", "시간을 따라 쌓인 작품들.")}</h2><div className="public-site-work-grid public-archive-grid">{works.map((work, index) => artworkCard(work, index, true))}</div></> : modalView?.mode === "work" ? <div className="public-work-detail-view"><div className="public-work-detail-image"><img src={modalView.work.imageUrl} alt={modalView.work.title} /></div><div className="public-work-detail-copy"><span>{[modalView.work.year, modalView.work.medium].filter(Boolean).join(" · ")}</span><h2>{modalView.work.title}</h2><Link className="button button-blue" href={`/works/${encodeURIComponent(`${profile.slug}~${modalView.work.id}`)}`}>{tx(locale, "Work details and inquiry", "작품 상세와 문의하기")} <ArrowUpRight size={15}/></Link><div className="public-work-navigation"><button type="button" onClick={() => moveWithinArchive(-1)} aria-label={tx(locale, "Previous artwork", "이전 작품")}><ArrowLeft size={15}/>{tx(locale, "Previous", "이전 작품")}</button><button type="button" onClick={() => moveWithinArchive(1)} aria-label={tx(locale, "Next artwork", "다음 작품")}>{tx(locale, "Next", "다음 작품")}<ArrowRight size={15}/></button></div></div></div> : null}
    </dialog>
  </section>;
}

function ExhibitionsSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sortArtistCvEntries((profile.siteExhibitions || []).filter((entry) => (entry.category === "solo" || entry.category === "group" || !entry.category) && entry.eventDate && entry.eventDate >= today));
  return <section id="exhibitions" className="public-artist-section"><div><div className="public-section-label">{tx(locale, "Exhibitions", "전시")}</div><h2 className="public-section-title">{tx(locale, "Where the work meets its audience", "작업이 관객을 만나는 자리")}</h2></div>{upcoming.length ? <div className="public-record-list">{upcoming.map((entry) => { const url = safeExternalUrl(entry.externalUrl); return <div key={entry.id}><span>{formatArtistCvDate(entry)}</span><strong>{entry.title}</strong><small>{[entry.venue, entry.location].filter(Boolean).join(" · ")}</small>{url && <a className="cv-entry-link" href={url} target="_blank" rel="noopener noreferrer" aria-label={tx(locale, `Open link for ${entry.title}`, `${entry.title} 링크 새 창에서 열기`)}><ExternalLink size={13}/></a>}</div>; })}</div> : <div className="public-empty-record"><strong>{tx(locale, "No upcoming exhibitions announced.", "현재 예정된 전시가 없습니다.")}</strong><span>{tx(locale, "Past exhibitions remain in the CV below.", "지난 전시 이력은 아래 CV에서 확인할 수 있습니다.")}</span></div>}</section>;
}

function CvSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const entries = profile.siteExhibitions || [];
  const populatedCategories = artistCvCategories.filter((category) => entries.some((entry) => (entry.category || "group") === category));
  const hasLegacy = Boolean(profile.artistCv?.trim());
  return <section id="cv" className="public-artist-section public-cv"><div><div className="public-section-label">Curriculum Vitae</div><h2 className="public-section-title">{tx(locale, "Selected exhibitions & recognitions", "전시와 활동 이력")}</h2></div><div className="public-cv-content"><div className="public-cv-actions">{profile.profileImageUrl && <img src={profile.profileImageUrl} alt="" loading="lazy"/>}<button type="button" className="public-archive-open" onClick={() => window.print()}><FileDown size={14}/>{tx(locale, "Print / save CV as PDF", "CV 인쇄 / PDF로 저장")}</button></div><div className="artist-cv-public"><h2>{profile.artistName || profile.displayName}</h2>{populatedCategories.length ? populatedCategories.map((category) => { const grouped = sortArtistCvEntries(entries.filter((entry) => (entry.category || "group") === category)); return <section key={category} className="artist-cv-public-group"><h3>{tx(locale, artistCvCategoryLabels[category].en, artistCvCategoryLabels[category].ko)}</h3><div className="artist-cv-public-list">{grouped.map((entry) => { const url = safeExternalUrl(entry.externalUrl); return <article key={entry.id}><time>{formatArtistCvDate(entry)}</time><div><strong>{entry.title}</strong><span>{[entry.venue, entry.location].filter(Boolean).join(" · ")}</span></div>{url && <a className="cv-entry-link" href={url} target="_blank" rel="noopener noreferrer" aria-label={tx(locale, `Open link for ${entry.title}`, `${entry.title} 링크 새 창에서 열기`)}><ExternalLink size={13}/></a>}</article>; })}</div></section>; }) : <p className="artist-cv-first-record">{hasLegacy ? profile.artistCv : tx(locale, "The artist has not added a CV yet.", "아직 등록된 CV가 없습니다.")}</p>}</div></div></section>;
}

function StudioArchiveSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const entries = profile.siteArchive || [];
  return <section id="studioArchive" className="public-artist-section public-studio-archive"><div><div className="public-section-label">Studio Archive</div><h2 className="public-section-title">{tx(locale, "Notes from the process", "작업의 뒷면")}</h2></div><div>{entries.length ? entries.map((entry) => <article key={entry.id}>{entry.videoUrl && <video src={entry.videoUrl} controls playsInline preload="metadata" aria-label={entry.title || tx(locale, "Studio process video", "작업 과정 영상")} />}{entry.imageUrl && <img src={entry.imageUrl} alt="" loading="lazy"/>}<h2>{entry.title}</h2><p>{entry.note}</p></article>) : <div className="public-empty-record"><strong>{tx(locale, "No studio notes have been shared yet.", "아직 공개된 작업 기록이 없습니다.")}</strong></div>}</div></section>;
}

function InspirationSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <section id="inspiration" className="public-artist-section public-inspiration"><div><div className="public-section-label">Influences</div><h2 className="public-section-title">{tx(locale, "A shelf of references", "영감의 서재")}</h2></div><div>{(profile.siteInspirations || []).map((item) => { let url = ""; try { const parsed = new URL(item.url || ""); if (["https:", "http:"].includes(parsed.protocol)) url = parsed.toString(); } catch { /* Hide invalid external destinations. */ } return <article key={item.id}><span>{item.kind || tx(locale, "INSPIRATION", "영감의 원천")}</span><h2>{item.title}</h2>{item.creator && <p>{item.creator}</p>}{item.note && <p>{item.note}</p>}{url && <a href={url} target="_blank" rel="noreferrer">{tx(locale, "Visit source", "원본 보러가기")} <ArrowUpRight size={13}/></a>}</article>; })}</div></section>;
}

function AboutSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const storyImage = profile.siteCoverImageUrl || profile.siteWorks?.find((work) => work.imageUrl)?.displayImageUrl || profile.siteWorks?.find((work) => work.imageUrl)?.imageUrl;
  if (profile.siteTemplate === "editorial") return <section id="about" className="public-artist-section public-about artist-journal-story"><div><div className="public-section-label">{tx(locale, "Artist statement", "작가 노트")}</div><h2 className="public-section-title">{tx(locale, "In the artist's words", "작가의 언어")}</h2><p className="public-artist-statement-copy">{profile.artistStatement || profile.bio}</p>{profile.bio && profile.artistStatement && <p className="public-artist-bio-copy">{profile.bio}</p>}<PublicLinks profile={profile} locale={locale}/>{profile.artistAudioUrl && <audio controls preload="none" src={profile.artistAudioUrl} aria-label={tx(locale, "Artist audio introduction", "작가 오디오 소개")}/>}</div>{storyImage && <img className="artist-journal-story-image" src={storyImage} alt={tx(locale, "Image selected from the artist's practice", "작가의 작업에서 선택한 이미지")} loading="lazy" decoding="async"/>}</section>;
  return <section id="about" className="public-artist-section public-about"><div><div className="public-section-label">{tx(locale, "Artist statement", "작가 노트")}</div><h2 className="public-section-title">{tx(locale, "In the artist's words", "작가의 언어")}</h2></div><div><p className="public-artist-statement-copy">{profile.artistStatement || profile.bio || tx(locale, "The artist is preparing a note about their practice.", "작가가 자신의 작업에 관한 글을 준비하고 있습니다.")}</p>{profile.bio && profile.artistStatement && <p className="public-artist-bio-copy">{profile.bio}</p>}<PublicLinks profile={profile} locale={locale} />{profile.artistAudioUrl && <audio className="artist-audio-guide" controls preload="none" src={profile.artistAudioUrl} aria-label={tx(locale, "Artist audio introduction", "작가 오디오 소개")}/>}</div></section>;
}

function PublicSiteSections({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const sections = getArtistSiteSections(profile);
  const renderSection = (section: typeof sections[number]) => section === "works" ? <WorksSection key={section} profile={profile} locale={locale} /> : section === "exhibitions" ? <ExhibitionsSection key={section} profile={profile} locale={locale} /> : section === "cv" ? <CvSection key={section} profile={profile} locale={locale} /> : section === "studioArchive" ? <StudioArchiveSection key={section} profile={profile} locale={locale}/> : section === "inspiration" ? <InspirationSection key={section} profile={profile} locale={locale}/> : <AboutSection key={section} profile={profile} locale={locale}/>;
  return <>{sections.map((section, index) => {
    if (profile.siteTemplate === "archive" && section === "about" && sections[index + 1] === "cv") return <div className="artist-archive-records" key="about-cv">{renderSection("about")}{renderSection("cv")}</div>;
    if (profile.siteTemplate === "archive" && section === "cv" && sections[index - 1] === "about") return null;
    return renderSection(section);
  })}{profile.contactPurposes?.length || profile.collaborationOpen ? <div id="contact"><ArtistContact profile={profile} locale={locale}/></div> : null}</>;
}

function UauArtistBridge({ currentSlug, locale }: { currentSlug: string; locale: "en" | "ko" }) {
  const archive = usePublicArchive();
  const artists = archive.artists.filter((artist) => artist.slug !== currentSlug);
  if (!artists.length) return null;
  return <section className="uau-artist-bridge" aria-labelledby="uau-artist-bridge-title"><div><span className="public-section-label">U.A.U / UNIT</span><h2 id="uau-artist-bridge-title">{tx(locale, "More from U.A.U", "U.A.U의 다른 아티스트")}</h2><p>{tx(locale, "Stay with the work. Meet another practice in the unit.", "작업을 따라 다른 U.A.U 아티스트의 실천도 만나보세요.")}</p></div><nav aria-label={tx(locale, "More U.A.U artists", "다른 U.A.U 아티스트")}>{artists.slice(0, 5).map((artist) => <Link href={`/artist/${artist.slug}`} key={artist.slug}><span>{artist.practice || tx(locale, "Artist", "아티스트")} · {artist.basedInCity || "U.A.U"}</span><strong>{artist.artistName || artist.displayName}</strong><ArrowUpRight size={15}/></Link>)}</nav></section>;
}

function ArtistMobileDock({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const available = new Set(["public-artist-content-start", ...getArtistSiteSections(profile), ...(profile.contactPurposes?.length || profile.collaborationOpen ? ["contact"] : [])]);
  const items = [
    { id: "public-artist-content-start", label: tx(locale, "Artist", "작가") },
    { id: "works", label: tx(locale, "Works", "작품") },
    { id: "cv", label: tx(locale, "CV", "이력") },
    { id: "contact", label: tx(locale, "Contact", "연락") },
  ].filter((item) => available.has(item.id));
  return <nav className="public-artist-mobile-dock" aria-label={tx(locale, "Quick page sections", "페이지 빠른 이동")}>{items.map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</nav>;
}

function FeaturedArtwork({ profile, locale, journal = false }: { profile: PublicProfile; locale: "en" | "ko"; journal?: boolean }) {
  const work = profile.siteWorks?.find((item) => item.imageUrl && item.title?.trim());
  const cover = journal ? profile.siteCoverImageUrl || work?.displayImageUrl || work?.imageUrl : work?.displayImageUrl || work?.imageUrl || profile.siteCoverImageUrl;
  if (!cover) return null;
  const showingWork = !journal || !profile.siteCoverImageUrl;
  return <figure className={journal ? "artist-journal-cover" : "artist-gallery-feature"}><img src={cover} alt={showingWork && work ? work.title : tx(locale, "Artist's cover image", "작가의 커버 이미지")} loading="eager" decoding="async" /><figcaption><span>{showingWork && work ? [work.title, work.year, work.medium].filter(Boolean).join(" · ") : tx(locale, "Selected by the artist", "작가가 선택한 이미지")}</span>{showingWork && work && <a href="#works">{tx(locale, "Explore works", "작품 살펴보기")} <ArrowDownRight size={14}/></a>}</figcaption></figure>;
}

function GalleryTemplate({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <div className="public-template public-template-gallery"><section className="artist-gallery-opening"><FeaturedArtwork profile={profile} locale={locale}/><div className="artist-gallery-identity"><ArtistIdentity profile={profile} locale={locale}/><div>{profile.bio && <p className="artist-opening-note">{profile.bio}</p>}<PublicLinks profile={profile} locale={locale}/></div></div></section><PublicSiteSections profile={profile} locale={locale}/></div>;
}

function EditorialTemplate({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const openingLine = (profile.artistStatement || "").split("\n")[0].trim();
return <div className="public-template public-template-editorial"><section className="artist-journal-opening"><div><span className="public-section-label">{tx(locale, "An artist's journal", "아티스트 저널")}</span>{openingLine && openingLine.length <= 100 && <p className="artist-journal-lead">{openingLine}</p>}<ArtistIdentity profile={profile} locale={locale}/>{profile.bio && <p className="artist-opening-note">{profile.bio}</p>}<PublicLinks profile={profile} locale={locale}/></div><FeaturedArtwork profile={profile} locale={locale} journal/></section><PublicSiteSections profile={profile} locale={locale}/></div>;
}

function ArchiveTemplate({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <div className="public-template public-template-archive"><section className="artist-archive-opening"><ArtistIdentity profile={profile} locale={locale}/><div>{profile.bio && <p className="artist-opening-note">{profile.bio}</p>}<PublicLinks profile={profile} locale={locale}/></div></section><PublicSiteSections profile={profile} locale={locale}/></div>;
}

export function PublicArtistPage({ slug }: { slug: string }) {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adminAccess, setAdminAccess] = useState(false);
  const [adminAccessChecked, setAdminAccessChecked] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const recordedView = useRef(false);

  useEffect(() => {
    if (!user || !db) {
      setAdminAccess(false);
      setAdminAccessChecked(true);
      return;
    }
    setAdminAccessChecked(false);
    return onSnapshot(doc(db, "admins", user.uid), (snapshot) => {
      const data = snapshot.data();
      setAdminAccess(snapshot.exists() && data?.active === true && ["super_admin", "editor", "curator", "support", "finance", "moderator"].includes(String(data?.role)));
      setAdminAccessChecked(true);
    }, () => { setAdminAccess(false); setAdminAccessChecked(true); });
  }, [user]);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      setError(true);
      return;
    }
    if (!adminAccessChecked) return;
    setLoading(true);
    return onSnapshot(doc(db, "public_profiles", slug), (snapshot) => {
      const next = snapshot.exists() ? ({ ...snapshot.data(), slug } as PublicProfile) : null;
      const canView = Boolean(next && !next.isDemonstration && (next.published || adminAccess));
      setProfile(canView ? next : null);
      setPreviewOnly(Boolean(canView && next && !next.published));
      setError(!canView);
      setLoading(false);
    }, () => {
      setProfile(null);
      setPreviewOnly(false);
      setError(true);
      setLoading(false);
    });
  }, [adminAccess, adminAccessChecked, slug]);

  useEffect(() => {
    if (!user || !profile || previewOnly || recordedView.current) return;
    recordedView.current = true;
    void recordEngagement({ actorUid: user.uid, action: "view", targetType: "artist", targetId: slug, source: "public-artist-page" });
  }, [previewOnly, profile, slug, user]);

  if (loading) return <main className="public-artist-page"><div className="public-page-loading">{tx(locale, "Opening the artist's room…", "아티스트의 공간을 여는 중…")}</div></main>;
  if (error || !profile) return <main className="public-artist-page"><div className="public-page-private"><span>u.a.u</span><h1>{tx(locale, "This room is not open yet.", "아직 열리지 않은 공간입니다.")}</h1><p>{tx(locale, "The artist is still shaping this page. Come back when the door is open.", "아티스트가 아직 페이지를 다듬고 있습니다. 문이 열리면 다시 찾아와 주세요.")}</p><Link className="button button-blue" href="/artists">{tx(locale, "Explore artists", "아티스트 둘러보기")} <ArrowUpRight size={16} /></Link></div></main>;

  return <ArtistProfileView profile={profile} locale={locale} previewOnly={previewOnly}/>;
}

export function ArtistProfileView({ profile, locale, previewOnly = false }: { profile: PublicProfile; locale: "en" | "ko"; previewOnly?: boolean }) {
  return <main className="public-artist-page">{previewOnly && <div className="artist-admin-preview" role="status">{tx(locale, "Draft preview · changes have not been saved", "초안 미리보기 · 아직 저장하지 않은 변경사항입니다")} <Link href="/admin/artists">{tx(locale, "Edit profile", "프로필 수정")} <ArrowUpRight size={13}/></Link></div>}<SiteHeader profile={profile} locale={locale} /><ArtistSectionIndex profile={profile} locale={locale}/><div className="public-artist-shell" data-site-accent={profile.siteAccent || "blue"}><span id="public-artist-content-start" className="public-artist-top-anchor" aria-hidden="true" />{profile.siteTemplate === "gallery" ? <GalleryTemplate profile={profile} locale={locale} /> : profile.siteTemplate === "archive" ? <ArchiveTemplate profile={profile} locale={locale} /> : <EditorialTemplate profile={profile} locale={locale} />}{!previewOnly && <UauArtistBridge currentSlug={profile.slug} locale={locale}/>}<footer className="public-artist-footer"><span>u.a.u / UNFRAME ARTIST UNIT</span><span>{profile.uauArtistId || profile.displayName} · {profile.basedInCity}</span><Link href="/">{tx(locale, "Enter u.a.u", "u.a.u 들어가기")} <ArrowUpRight size={13} /></Link></footer></div><ArtistMobileDock profile={profile} locale={locale}/></main>;
}
