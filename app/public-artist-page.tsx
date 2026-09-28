"use client";

import Link from "next/link";
import { ArrowUpRight, FileDown, Globe2, Mail } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useLanguage } from "./i18n-provider";
import { tx } from "./i18n-shared";
import { db } from "./firebase-client";
import { recordEngagement } from "./engagements";
import { useAuth } from "./auth-provider";
import type { PublicProfile } from "./profile";
import type { ArtistSiteWork } from "./profile";
import { ArtistContact } from "./components/artist-contact";
import "./artist-growth.css";
import { artistSiteSectionLabels, getArtistSiteSections } from "./artist/site-config";

function getInitials(value: string) {
  return value.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

function SiteHeader({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const sections = getArtistSiteSections(profile);
  return <header className="public-site-header"><Link href="/" className="public-site-brand" aria-label="u.a.u home"><img src="/assets/uau-logo-lockup.png" alt="u.a.u" /></Link><nav aria-label={tx(locale, "Artist page navigation", "아티스트 페이지 메뉴")}>{sections.map((section) => <a href={`#${section}`} key={section}>{tx(locale, artistSiteSectionLabels[section].en, artistSiteSectionLabels[section].ko)}</a>)}</nav><span className="public-site-label">u.a.u / {tx(locale, "artist page", "아티스트 페이지")}</span></header>;
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
  const [modalView, setModalView] = useState<{ mode: "archive" } | { mode: "work"; work: ArtistSiteWork; fromArchive: boolean } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const media = Array.from(new Set(works.map((work) => work.medium?.trim()).filter((medium): medium is string => Boolean(medium))));
  const filteredWorks = activeMedium === "all" ? works : works.filter((work) => work.medium?.trim() === activeMedium);
  const selectedWorks = filteredWorks.slice(0, 6);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (modalView && !dialog.open) dialog.showModal();
    if (!modalView && dialog.open) dialog.close();
  }, [modalView]);

  function closeViewer() {
    setModalView(null);
  }

  function artworkCard(work: ArtistSiteWork, index: number, fromArchive = false) {
    return <button type="button" className="public-site-work-card" key={work.id} onClick={() => setModalView({ mode: "work", work, fromArchive })} aria-label={tx(locale, `Open ${work.title}`, `${work.title} 상세 보기`)}>
      <span className="public-work-image"><img src={work.imageUrl} alt={work.title} loading="lazy" decoding="async" /></span>
      <span className="public-site-work-copy"><span>{String(index + 1).padStart(2, "0")} / {work.year || tx(locale, "undated", "연도 미상")}</span><strong>{work.title}</strong><span>{work.medium || tx(locale, "Medium not listed", "매체 미기재")}</span></span>
    </button>;
  }

  return <section id="works" className="public-artist-works"><div className="public-works-heading"><div><div className="public-section-label">{tx(locale, "Selected works", "작품")}</div><p>{tx(locale, `${works.length} works in this artist's public archive`, `공개 아카이브 ${works.length}점`)}</p></div>{works.length > 6 && <button type="button" className="public-archive-open" onClick={() => setModalView({ mode: "archive" })}>{tx(locale, "View full archive", "전체 작품 보기")} <ArrowUpRight size={15}/></button>}</div>
    {works.length > 1 && media.length > 1 && <div className="public-work-filters" role="group" aria-label={tx(locale, "Filter works by medium", "매체별 작품 필터")}><button type="button" aria-pressed={activeMedium === "all"} className={activeMedium === "all" ? "is-active" : ""} onClick={() => setActiveMedium("all")}>{tx(locale, "All", "전체")}</button>{media.map((medium) => <button type="button" key={medium} aria-pressed={activeMedium === medium} className={activeMedium === medium ? "is-active" : ""} onClick={() => setActiveMedium(medium)}>{medium}</button>)}</div>}
    {works.length ? <div className="public-site-work-grid">{selectedWorks.map((work, index) => artworkCard(work, index))}</div> : <div className="public-empty-record"><strong>{tx(locale, "No selected works yet.", "아직 공개된 작품이 없습니다.")}</strong><span>{tx(locale, "Works will appear here after the artist adds them to this page.", "아티스트가 공개할 작품을 추가하면 이곳에 표시됩니다.")}</span></div>}
    <p className="public-work-filter-status" role="status">{tx(locale, `${filteredWorks.length} works shown`, `${filteredWorks.length}점 표시 중`)}</p>
    <dialog ref={dialogRef} className="public-artist-dialog" onClose={closeViewer} aria-label={modalView?.mode === "archive" ? tx(locale, "Complete artwork archive", "전체 작품 아카이브") : tx(locale, "Artwork details", "작품 상세 정보")}>
      <div className="public-dialog-toolbar">{modalView?.mode === "work" && modalView.fromArchive ? <button type="button" className="public-dialog-back" onClick={() => setModalView({ mode: "archive" })}>{tx(locale, "Back to archive", "아카이브로 돌아가기")}</button> : <span className="public-section-label">{modalView?.mode === "archive" ? tx(locale, "Complete archive", "전체 작품") : tx(locale, "Artwork", "작품")}</span>}<button type="button" className="public-dialog-close" onClick={closeViewer} aria-label={tx(locale, "Close", "닫기")}>×</button></div>
      {modalView?.mode === "archive" ? <><h2 className="public-dialog-title">{tx(locale, "Works, gathered over time.", "시간을 따라 쌓인 작품들.")}</h2><div className="public-site-work-grid public-archive-grid">{works.map((work, index) => artworkCard(work, index, true))}</div></> : modalView?.mode === "work" ? <div className="public-work-detail-view"><div className="public-work-detail-image"><img src={modalView.work.imageUrl} alt={modalView.work.title} /></div><div className="public-work-detail-copy"><span>{[modalView.work.year, modalView.work.medium].filter(Boolean).join(" · ")}</span><h2>{modalView.work.title}</h2><Link className="button button-blue" href={`/works/${encodeURIComponent(`${profile.slug}~${modalView.work.id}`)}`}>{tx(locale, "Work details and inquiry", "작품 상세와 문의하기")} <ArrowUpRight size={15}/></Link></div></div> : null}
    </dialog>
  </section>;
}

function ExhibitionsSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const exhibitions = profile.siteExhibitions || [];
  return <section id="exhibitions" className="public-artist-section"><div className="public-section-label">{tx(locale, "Exhibitions", "전시")}</div>{exhibitions.length ? <div className="public-record-list">{exhibitions.map((exhibition) => <div key={exhibition.id}><span>{exhibition.year}</span><strong>{exhibition.title}</strong><small>{[exhibition.venue, exhibition.location].filter(Boolean).join(" · ") || tx(locale, "Location to be added", "장소 준비 중")}</small></div>)}</div> : <div className="public-empty-record"><strong>{tx(locale, "The next room is open.", "다음 방이 열려 있습니다.")}</strong><span>{tx(locale, "Exhibition records will appear here as the practice continues.", "작업이 계속되면 전시 기록이 이곳에 남습니다.")}</span></div>}</section>;
}

function CvSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <section id="cv" className="public-artist-section public-cv"><div className="public-section-label">CV</div><div className="public-cv-content"><div className="public-cv-actions">{profile.profileImageUrl && <img src={profile.profileImageUrl} alt="" loading="lazy"/>}<button type="button" className="public-archive-open" onClick={() => window.print()}><FileDown size={14}/>{tx(locale, "Print / save CV as PDF", "CV 인쇄 / PDF로 저장")}</button></div><div><p>{profile.artistCv || tx(locale, "The artist has not added a CV yet.", "아직 CV가 등록되지 않았습니다.")}</p>{profile.siteExhibitions?.length ? <div className="public-record-list">{profile.siteExhibitions.map((item) => <div key={item.id}><span>{item.year}</span><strong>{item.title}</strong><small>{[item.venue, item.location].filter(Boolean).join(" · ")}</small></div>)}</div> : null}</div></div></section>;
}

function StudioArchiveSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const entries = profile.siteArchive || [];
  return <section id="studioArchive" className="public-artist-section public-studio-archive"><div className="public-section-label">STUDIO ARCHIVE <span>/{tx(locale, "process notes", "작업의 뒷면")}</span></div><div>{entries.length ? entries.map((entry) => <article key={entry.id}>{entry.imageUrl && <img src={entry.imageUrl} alt="" loading="lazy"/>}<h2>{entry.title}</h2><p>{entry.note}</p></article>) : <div className="public-empty-record"><strong>{tx(locale, "The archive is taking shape.", "아카이브를 채워가는 중입니다.")}</strong></div>}</div></section>;
}

function InspirationSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <section id="inspiration" className="public-artist-section public-inspiration"><div className="public-section-label">INFLUENCE & INSPIRATION</div><div>{(profile.siteInspirations || []).map((item) => { let url = ""; try { const parsed = new URL(item.url || ""); if (["https:", "http:"].includes(parsed.protocol)) url = parsed.toString(); } catch { /* Hide invalid external destinations. */ } return <article key={item.id}><span>{item.kind || tx(locale, "INSPIRATION", "영감의 원천")}</span><h2>{item.title}</h2>{item.creator && <p>{item.creator}</p>}{item.note && <p>{item.note}</p>}{url && <a href={url} target="_blank" rel="noreferrer">{tx(locale, "Visit source", "원본 보러가기")} <ArrowUpRight size={13}/></a>}</article>; })}</div></section>;
}

function AboutSection({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <section id="about" className="public-artist-section public-about"><div className="public-section-label">{tx(locale, "About", "소개")}</div><div><h2>{profile.bio || tx(locale, "A practice with a door left open.", "문을 열어둔 실천입니다.")}</h2><PublicLinks profile={profile} locale={locale} /></div></section>;
}

function PublicSiteSections({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <>{getArtistSiteSections(profile).map((section) => section === "works" ? <WorksSection key={section} profile={profile} locale={locale} /> : section === "exhibitions" ? <ExhibitionsSection key={section} profile={profile} locale={locale} /> : section === "cv" ? <CvSection key={section} profile={profile} locale={locale} /> : section === "studioArchive" ? <StudioArchiveSection key={section} profile={profile} locale={locale}/> : section === "inspiration" ? <InspirationSection key={section} profile={profile} locale={locale}/> : <AboutSection key={section} profile={profile} locale={locale} />)}{profile.contactPurposes?.length || profile.collaborationOpen ? <div id="contact"><ArtistContact profile={profile} locale={locale}/></div> : null}</>;
}

function GalleryTemplate({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const cover = profile.siteCoverImageUrl || profile.siteWorks?.find((work) => work.imageUrl)?.imageUrl;
  return <div className="public-template public-template-gallery"><section className="public-gallery-hero"><div className="public-gallery-hero-art">{cover ? <img src={cover} alt={tx(locale, "Featured artwork", "대표 작품")} loading="eager" decoding="async" /> : <div className="public-work-image-missing">{tx(locale, "Cover image not added", "커버 이미지 미등록")}</div>}</div><div className="public-gallery-hero-copy"><span>{profile.practice || tx(locale, "Artist", "아티스트")}</span><h1>{profile.artistName || profile.displayName}</h1><p>{profile.basedInCity} · {profile.country}</p>{profile.artistStatement && <p className="public-artist-statement">{profile.artistStatement}</p>}<PublicLinks profile={profile} locale={locale} />{profile.artistAudioUrl && <audio className="artist-audio-guide" controls preload="none" src={profile.artistAudioUrl} aria-label={tx(locale, "Artist audio introduction", "작가 오디오 소개")}/>}</div></section><PublicSiteSections profile={profile} locale={locale} /></div>;
}

function EditorialTemplate({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  const cover = profile.siteCoverImageUrl || profile.siteWorks?.find((work) => work.imageUrl)?.imageUrl;
  return <div className="public-template public-template-editorial"><section className="public-personal-hero" id="hero"><div className="public-personal-identity"><span>{profile.practice || tx(locale, "Artist", "아티스트")}</span><h1>{profile.artistName || profile.displayName}</h1><p>{[profile.basedInCity, profile.country].filter(Boolean).join(" · ")}</p><div className="public-artist-id"><strong>{profile.uauArtistId || tx(locale, "Artist profile", "작가 프로필")}</strong>{profile.verificationStatus === "approved" && <small>{tx(locale, "Verified Artist", "인증 아티스트")}</small>}</div>{profile.bio && <p className="public-personal-bio">{profile.bio}</p>}<PublicLinks profile={profile} locale={locale}/>{profile.artistAudioUrl && <audio className="artist-audio-guide" controls preload="none" src={profile.artistAudioUrl} aria-label={tx(locale, "Artist audio introduction", "작가 오디오 소개")}/>}</div><figure className="public-personal-cover">{cover ? <img src={cover} alt={tx(locale, "Artwork selected by the artist", "작가가 선택한 작품 이미지")} loading="eager" decoding="async"/> : <div className="public-cover-empty"><span>u.a.u</span><p>{tx(locale, "The artist is preparing this space.", "작가가 페이지를 준비하고 있습니다.")}</p></div>}{profile.siteWorks?.find((work) => work.imageUrl)?.title && <figcaption>{profile.siteWorks.find((work) => work.imageUrl)?.title}</figcaption>}</figure></section><PublicSiteSections profile={profile} locale={locale} /></div>;
}

function ArchiveTemplate({ profile, locale }: { profile: PublicProfile; locale: "en" | "ko" }) {
  return <div className="public-template public-template-archive"><section className="public-archive-intro"><ArtistIdentity profile={profile} locale={locale} /><p>{profile.artistStatement || profile.bio || tx(locale, "A living index of works, encounters, and what comes after.", "작품과 만남, 그리고 그 이후를 기록하는 살아 있는 색인.")}</p><PublicLinks profile={profile} locale={locale}/>{profile.artistAudioUrl && <audio className="artist-audio-guide" controls preload="none" src={profile.artistAudioUrl} aria-label={tx(locale, "Artist audio introduction", "작가 오디오 소개")}/>}</section><PublicSiteSections profile={profile} locale={locale} /></div>;
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
      const canView = Boolean(next && (next.published || adminAccess));
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

  return <main className="public-artist-page">{previewOnly && <div className="artist-admin-preview" role="status">{tx(locale, "ADMIN PREVIEW · This profile is not public", "관리자 미리보기 · 아직 공개되지 않은 프로필입니다")} <Link href="/admin/artists">{tx(locale, "Edit profile", "프로필 수정")} <ArrowUpRight size={13}/></Link></div>}{profile.isDemonstration && <div className="artist-demo-banner">{tx(locale, "U.A.U. MASCOT · DEMONSTRATION PROFILE", "U.A.U. 마스코트 · 작가 페이지 예시")}</div>}<SiteHeader profile={profile} locale={locale} /><ArtistSectionIndex profile={profile} locale={locale}/><div className="public-artist-shell" data-site-accent={profile.siteAccent || "blue"}><span id="public-artist-content-start" className="public-artist-top-anchor" aria-hidden="true" />{profile.siteTemplate === "gallery" ? <GalleryTemplate profile={profile} locale={locale} /> : profile.siteTemplate === "archive" ? <ArchiveTemplate profile={profile} locale={locale} /> : <EditorialTemplate profile={profile} locale={locale} />}<footer className="public-artist-footer"><span>u.a.u / UNFRAME ARTIST UNIT</span><span>{profile.uauArtistId || profile.displayName} · {profile.basedInCity}</span><Link href="/">{tx(locale, "Enter u.a.u", "u.a.u 들어가기")} <ArrowUpRight size={13} /></Link></footer></div></main>;
}
