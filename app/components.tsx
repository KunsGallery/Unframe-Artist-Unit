"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, Check, ChevronDown, ChevronRight, ChevronUp, CircleUserRound, Globe2, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "./i18n-provider";
import { tx } from "./i18n-shared";
import { useAuth } from "./auth-provider";
import { setSavedEngagement } from "./engagements";
import { RadarNetwork } from "./radar/radar-network";
import { useSitePageContent } from "./site-page-content";

export function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className={compact ? "brand brand-compact" : "brand"} aria-label="u.a.u home"><img className="logo-image" src={compact ? "/assets/uau-logo-mark.png" : "/assets/uau-logo-lockup.png"} alt="u.a.u" /></Link>;
}

function NavMenu({
  id,
  label,
  open,
  onToggle,
  onNavigate,
  children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return <div className={open ? "nav-menu is-open" : "nav-menu"}>
    <button type="button" className="nav-menu-trigger" aria-expanded={open} aria-controls={id} onClick={onToggle}>
      <span>{label}</span>
      {open ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
    </button>
    <div id={id} className="nav-mega" aria-hidden={!open}>
      <div className="nav-mega-inner" onClick={onNavigate}>{children}</div>
    </div>
  </div>;
}

function MegaColumn({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <div className="nav-mega-column">
    <p className="nav-mega-eyebrow">{eyebrow}</p>
    <h2>{title}</h2>
    <div className="nav-mega-links">{children}</div>
  </div>;
}

function MegaLink({ href, label, detail, soon = false }: { href: string; label: string; detail?: string; soon?: boolean }) {
  return <Link href={href} className={soon ? "nav-mega-link is-soon" : "nav-mega-link"}>
    <span>{label}{detail && <small>{detail}</small>}</span>
    {soon ? <em>Soon</em> : <ArrowUpRight size={13} aria-hidden="true" />}
  </Link>;
}

export function Nav() {
  const { locale, setLocale } = useLanguage();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"explore" | "participate" | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const closeMenus = () => {
    setOpen(false);
    setOpenMenu(null);
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  });
  const changeLocale = (nextLocale: "en" | "ko") => {
    setLocale(nextLocale);
    document.cookie = `uau-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  };
  const accountLabel = user?.displayName || user?.email?.split("@")[0] || tx(locale, "My u.a.u", "My u.a.u");
  const toggleMenu = (menu: "explore" | "participate") => setOpenMenu((current) => current === menu ? null : menu);
  return <header ref={headerRef} className="site-header"><div className="nav-shell"><Logo /><nav className={open ? "nav-links nav-open" : "nav-links"} aria-label={tx(locale, "Main navigation", "주 메뉴")}>
    <NavMenu id="nav-explore" label={tx(locale, "Explore", "둘러보기")} open={openMenu === "explore"} onToggle={() => toggleMenu("explore")} onNavigate={closeMenus}>
      <MegaColumn eyebrow={tx(locale, "People & works", "사람과 작품")} title={tx(locale, "Follow the work.", "작품을 따라가세요.")}>
        <MegaLink href="/artists" label={tx(locale, "Artists", "아티스트")} detail={tx(locale, "The people behind the practice", "작업을 만드는 사람들")} />
        <MegaLink href="/works" label={tx(locale, "Works", "작품")} detail={tx(locale, "A living archive of practice", "계속 움직이는 작업의 아카이브")} />
        <MegaLink href="/projects" label={tx(locale, "Projects", "프로젝트")} detail={tx(locale, "Where separate practices meet", "서로 다른 실천이 만나는 곳")} />
      </MegaColumn>
      <MegaColumn eyebrow={tx(locale, "Signals & context", "신호와 맥락")} title={tx(locale, "Stay with the thread.", "실마리를 놓치지 마세요.")}>
        <MegaLink href="/radar" label={tx(locale, "Radar", "Radar")} detail={tx(locale, "Open calls, salons, and next moves", "공모, 살롱, 다음 움직임")} />
        <MegaLink href="/connections" label={tx(locale, "Connections", "연결")} detail={tx(locale, "See what gathers around a work", "작품을 중심으로 모이는 관계")} />
        <MegaLink href="/recap" label={tx(locale, "Annual recap", "연간 리캡")} detail={tx(locale, "A record of what moved us", "우리를 움직인 장면의 기록")} />
      </MegaColumn>
      <aside className="nav-mega-aside">
        <span>{tx(locale, "01 / archive", "01 / 아카이브")}</span>
        <p>{tx(locale, <>The archive grows through what happens <em>after</em> the exhibition.</>, <>아카이브는 전시 <em>이후</em>에 일어나는 일로 자랍니다.</>)}</p>
        <Link href="/connections" onClick={closeMenus}>{tx(locale, "Follow the thread", "실마리 따라가기")} <ArrowUpRight size={14} /></Link>
      </aside>
    </NavMenu>
    <Link href="/artists" onClick={closeMenus}>{tx(locale, "Artists", "아티스트")}</Link>
    <Link href="/works" onClick={closeMenus}>{tx(locale, "Works", "작품")}</Link>
    <Link href="/projects" onClick={closeMenus}>{tx(locale, "Projects", "프로젝트")}</Link>
    <NavMenu id="nav-participate" label={tx(locale, "Make room", "함께 만들기")} open={openMenu === "participate"} onToggle={() => toggleMenu("participate")} onNavigate={closeMenus}>
      <MegaColumn eyebrow={tx(locale, "For artists", "아티스트를 위한 것")} title={tx(locale, "Make your practice visible.", "당신의 작업을 드러내세요.")}>
        <MegaLink href="/dashboard/profile" label={tx(locale, "Artist profile", "아티스트 프로필")} detail={tx(locale, "Build a page that sounds like you", "당신의 언어로 만드는 페이지")} />
        <MegaLink href="/dashboard/virtual-gallery" label={tx(locale, "AI spatial preview", "AI 공간 프리뷰")} detail={tx(locale, "Place a work and imagine the room", "작품을 공간에 놓고 상상하기")} />
        <MegaLink href="/join" label={tx(locale, "Artist membership", "아티스트 멤버십")} detail={tx(locale, "More room for a deeper practice", "더 깊은 실천을 위한 더 넓은 공간")} />
      </MegaColumn>
      <MegaColumn eyebrow={tx(locale, "For collaborators", "함께 만드는 사람들을 위한 것")} title={tx(locale, "Find the people around it.", "작품 주변의 사람을 만나세요.")}>
        <MegaLink href="/dashboard/threads" label={tx(locale, "Thread rooms", "스레드 룸")} detail={tx(locale, "Keep a conversation in motion", "대화를 계속 움직이기")} />
        <MegaLink href="/radar#opportunities" label={tx(locale, "Opportunities", "기회")} detail={tx(locale, "Calls, commissions, and invitations", "공모, 커미션, 초대")} />
        <MegaLink href="/radar#events" label={tx(locale, "Events & salons", "전시와 살롱")} detail={tx(locale, "Show up, meet, continue", "만나고, 이어지고, 다시 시작하기")} />
      </MegaColumn>
      <aside className="nav-mega-aside nav-mega-aside-ink">
        <span>{tx(locale, "02 / participation", "02 / 참여")}</span>
        <p>{tx(locale, "There is more than one way to enter the unit.", "유닛에 들어오는 방법은 하나가 아닙니다.")}</p>
        <Link href="/join" onClick={closeMenus}>{tx(locale, "See how to join", "함께하는 방법 보기")} <ArrowUpRight size={14} /></Link>
      </aside>
    </NavMenu>
    <Link className="nav-accent" href="/join" onClick={closeMenus}>{tx(locale, "Join u.a.u", "u.a.u 함께하기")} <ArrowUpRight size={14} /></Link>
  </nav><div className="nav-actions"><div className="language-switcher" aria-label={tx(locale, "Language", "언어") }><Globe2 size={15} aria-hidden="true" /><button type="button" className={locale === "en" ? "is-active" : ""} aria-pressed={locale === "en"} onClick={() => changeLocale("en")}>EN</button><span>/</span><button type="button" className={locale === "ko" ? "is-active" : ""} aria-pressed={locale === "ko"} onClick={() => changeLocale("ko")}>KR</button></div><Link className="icon-button" href="/works" aria-label={tx(locale, "Search works", "작품 검색")}><Search size={17} /></Link><Link className="account-link" href={user ? "/dashboard" : "/login"} aria-label={user ? tx(locale, "Open your dashboard", "대시보드 열기") : tx(locale, "Sign in", "로그인")}><CircleUserRound size={17} /><span>{loading ? tx(locale, "Checking", "확인 중") : user ? accountLabel : tx(locale, "Sign in", "로그인")}</span></Link><button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? tx(locale, "Close menu", "메뉴 닫기") : tx(locale, "Open menu", "메뉴 열기")}>{open ? <X size={20} /> : <Menu size={20} />}</button></div></div></header>;
}

export function Footer() {
  const { locale } = useLanguage();
  return <footer className="site-footer"><div><p>{tx(locale, <>A relationship that starts in an exhibition<br />and keeps going after.</>, <>전시에서 시작된 관계가<br />그 이후에도 이어집니다.</>)}</p></div><div className="footer-links"><div><span>{tx(locale, "Explore", "둘러보기")}</span><Link href="/artists">{tx(locale, "Artists", "아티스트")}</Link><Link href="/works">{tx(locale, "Works", "작품")}</Link><Link href="/connections">{tx(locale, "Connections", "연결")}</Link><Link href="/recap">Connected 2027</Link></div><div><span>{tx(locale, "About", "소개")}</span><Link href="/about">{tx(locale, "Philosophy", "철학")}</Link><Link href="/projects">{tx(locale, "Projects", "프로젝트")}</Link><Link href="/join">{tx(locale, "Join", "함께하기")}</Link></div><div><span>{tx(locale, "Stay close", "가까이 머물기")}</span><a href="mailto:hello@uau.unframe.kr">hello@uau.unframe.kr</a><a href="#newsletter">U.A.U Radar ↗</a></div></div><small>© 2026 u.a.u / UNFRAME ARTIST UNIT <em>{tx(locale, "Demonstration archive", "데모 아카이브")}</em></small></footer>;
}

export function SectionHeading({ title, action, href = "#" }: { title: string; action?: string; href?: string }) {
  return <div className="section-heading"><h2>{title}</h2>{action && <Link href={href} className="text-link">{action} <ArrowUpRight size={14} /></Link>}</div>;
}

export function PageIntro({ className = "", split = false, bare = false, showActions = true }: { className?: string; split?: boolean; bare?: boolean; showActions?: boolean }) {
  const { locale } = useLanguage();
  const { content } = useSitePageContent();
  const localize = (value: { en: string; ko: string }) => value[locale];
  const rootClassName = [bare ? "" : "page-intro", split ? "split-intro" : "", className].filter(Boolean).join(" ");
  return <div className={rootClassName}><div><MetaLine>{localize(content.eyebrow)}</MetaLine><h1><span className="site-copy-preline">{localize(content.title)}</span><br /><em><span className="site-copy-preline">{localize(content.emphasis)}</span></em></h1></div><p>{localize(content.description)}</p>{showActions && <div className="page-intro-actions"><Link className="text-link" href={content.primaryHref}>{localize(content.primaryLabel)} <ArrowUpRight size={14} /></Link><Link className="text-link" href={content.secondaryHref}>{localize(content.secondaryLabel)} <ArrowUpRight size={14} /></Link></div>}</div>;
}

export function PageSection({ sectionId, children }: { sectionId: string; children: React.ReactNode }) {
  const { content } = useSitePageContent();
  if (content.hiddenSections.includes(sectionId)) return null;
  const order = content.sectionOrder.indexOf(sectionId);
  return <div className="page-editable-section" data-page-section={sectionId} style={{ order: order < 0 ? 999 : order }}>{children}</div>;
}

export function BookmarkButton({ label = "Save", targetType, targetId }: { label?: string; targetType?: "artist" | "work" | "project" | "event" | "opportunity" | "thread"; targetId?: string }) {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const saveText = label === "" ? "" : locale === "ko" ? (label === "Save" ? "저장" : label) : label;
  async function toggleSaved() {
    const next = !saved;
    setSaved(next);
    if (user && targetType && targetId) await setSavedEngagement({ actorUid: user.uid, targetType, targetId, active: next }).catch(() => setSaved(!next));
  }
  return <button className={saved ? "save-button saved" : "save-button"} onClick={() => void toggleSaved()} aria-pressed={saved} aria-label={saved ? tx(locale, "Remove from saved", "저장 목록에서 제거") : saveText}><Bookmark size={15} fill={saved ? "currentColor" : "none"} />{saved ? tx(locale, "Saved", "저장됨") : label === "" ? "" : saveText}</button>;
}

export function ArtImage({ className = "", position = "center", label = "Artwork image" }: { className?: string; position?: string; label?: string }) {
  return <div className={`art-image ${className}`}><img src="/assets/uau-hero.png" alt={label} style={{ objectPosition: position }} /><span className="art-image-glow" /></div>;
}

export function MetaLine({ children }: { children: React.ReactNode }) { return <span className="meta-line">{children}</span>; }
export function StatusDot({ children }: { children: React.ReactNode }) { return <span className="status-dot"><i />{children}</span>; }
export function Breadcrumb({ current }: { current: string }) { return <div className="breadcrumb"><Link href="/">u.a.u</Link><ChevronRight size={14} /><span>{current}</span></div>; }
export function DemoNotice() { const { locale } = useLanguage(); const pathname = usePathname(); return <><div className="demo-notice"><span><i /> {tx(locale, "Demonstration archive", "데모 아카이브")}</span><span>{tx(locale, "Sample content · production data will connect here", "샘플 콘텐츠 · 운영 데이터가 연결될 예정입니다")}</span></div>{pathname === "/radar" && <RadarNetwork />}</>; }
export function VerifiedMark({ compact = false }: { compact?: boolean }) { const { locale } = useLanguage(); return <span className={compact ? "verified-mark verified-compact" : "verified-mark"} title={tx(locale, "Verified u.a.u Artist", "u.a.u 인증 아티스트")}><Check size={compact ? 12 : 13} aria-hidden="true" />{!compact && <small>{tx(locale, "verified", "인증")}</small>}</span>; }
