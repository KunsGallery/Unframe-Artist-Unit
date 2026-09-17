"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, Check, ChevronRight, CircleUserRound, Globe2, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "./i18n-provider";
import { tx } from "./i18n-shared";
import { useAuth } from "./auth-provider";
import { setSavedEngagement } from "./engagements";

export function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className={compact ? "brand brand-compact" : "brand"} aria-label="u.a.u home"><img className="logo-image" src={compact ? "/assets/uau-logo-mark.png" : "/assets/uau-logo-lockup.png"} alt="u.a.u" /></Link>;
}

export function Nav() {
  const { locale, setLocale } = useLanguage();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const items = [[tx(locale, "Artists", "아티스트"), "/artists"], [tx(locale, "Works", "작품"), "/works"], [tx(locale, "Projects", "프로젝트"), "/projects"], [tx(locale, "Radar", "Radar"), "/radar"], [tx(locale, "Connections", "연결"), "/connections"]];
  const changeLocale = (nextLocale: "en" | "ko") => {
    setLocale(nextLocale);
    document.cookie = `uau-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  };
  const accountLabel = user?.displayName || user?.email?.split("@")[0] || tx(locale, "My u.a.u", "My u.a.u");
  return <header className="site-header"><div className="nav-shell"><Logo /><nav className={open ? "nav-links nav-open" : "nav-links"} aria-label={tx(locale, "Main navigation", "주 메뉴")}>{items.map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link className="nav-accent" href="/join" onClick={() => setOpen(false)}>{tx(locale, "Join u.a.u", "u.a.u 함께하기")} <ArrowUpRight size={14} /></Link></nav><div className="nav-actions"><div className="language-switcher" aria-label={tx(locale, "Language", "언어") }><Globe2 size={15} aria-hidden="true" /><button type="button" className={locale === "en" ? "is-active" : ""} aria-pressed={locale === "en"} onClick={() => changeLocale("en")}>EN</button><span>/</span><button type="button" className={locale === "ko" ? "is-active" : ""} aria-pressed={locale === "ko"} onClick={() => changeLocale("ko")}>KR</button></div><Link className="icon-button" href="/works" aria-label={tx(locale, "Search works", "작품 검색")}><Search size={17} /></Link><Link className="account-link" href={user ? "/dashboard" : "/login"} aria-label={user ? tx(locale, "Open your dashboard", "대시보드 열기") : tx(locale, "Sign in", "로그인")}><CircleUserRound size={17} /><span>{loading ? tx(locale, "Checking", "확인 중") : user ? accountLabel : tx(locale, "Sign in", "로그인")}</span></Link><button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? tx(locale, "Close menu", "메뉴 닫기") : tx(locale, "Open menu", "메뉴 열기")}>{open ? <X size={20} /> : <Menu size={20} />}</button></div></div></header>;
}

export function Footer() {
  const { locale } = useLanguage();
  return <footer className="site-footer"><div><p>{tx(locale, <>A relationship that starts in an exhibition<br />and keeps going after.</>, <>전시에서 시작된 관계가<br />그 이후에도 이어집니다.</>)}</p></div><div className="footer-links"><div><span>{tx(locale, "Explore", "둘러보기")}</span><Link href="/artists">{tx(locale, "Artists", "아티스트")}</Link><Link href="/works">{tx(locale, "Works", "작품")}</Link><Link href="/connections">{tx(locale, "Connections", "연결")}</Link><Link href="/recap">Connected 2027</Link></div><div><span>{tx(locale, "About", "소개")}</span><Link href="/about">{tx(locale, "Philosophy", "철학")}</Link><Link href="/projects">{tx(locale, "Projects", "프로젝트")}</Link><Link href="/join">{tx(locale, "Join", "함께하기")}</Link></div><div><span>{tx(locale, "Stay close", "가까이 머물기")}</span><a href="mailto:hello@uau.unframe.kr">hello@uau.unframe.kr</a><a href="#newsletter">U.A.U Radar ↗</a></div></div><small>© 2026 u.a.u / UNFRAME ARTIST UNIT <em>{tx(locale, "Demonstration archive", "데모 아카이브")}</em></small></footer>;
}

export function SectionHeading({ title, action, href = "#" }: { title: string; action?: string; href?: string }) {
  return <div className="section-heading"><h2>{title}</h2>{action && <Link href={href} className="text-link">{action} <ArrowUpRight size={14} /></Link>}</div>;
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
export function DemoNotice() { const { locale } = useLanguage(); return <div className="demo-notice"><span><i /> {tx(locale, "Demonstration archive", "데모 아카이브")}</span><span>{tx(locale, "Sample content · production data will connect here", "샘플 콘텐츠 · 운영 데이터가 연결될 예정입니다")}</span></div>; }
export function VerifiedMark({ compact = false }: { compact?: boolean }) { const { locale } = useLanguage(); return <span className={compact ? "verified-mark verified-compact" : "verified-mark"} title={tx(locale, "Verified u.a.u Artist", "u.a.u 인증 아티스트")}><Check size={compact ? 12 : 13} aria-hidden="true" />{!compact && <small>{tx(locale, "verified", "인증")}</small>}</span>; }
