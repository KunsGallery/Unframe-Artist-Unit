"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, Check, ChevronRight, CircleUserRound, Menu, Search, X } from "lucide-react";
import { useState } from "react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className={compact ? "brand brand-compact" : "brand"} aria-label="u.a.u home"><img className="logo-image" src={compact ? "/assets/uau-logo-mark.png" : "/assets/uau-logo-lockup.png"} alt="u.a.u" /></Link>;
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const items = [["Artists", "/artists"], ["Works", "/works"], ["Projects", "/projects"], ["Journal", "/#journal"], ["Connections", "/connections"]];
  return <header className="site-header"><div className="nav-shell"><Logo /><nav className={open ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">{items.map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link className="nav-accent" href="/join" onClick={() => setOpen(false)}>Join u.a.u <ArrowUpRight size={14} /></Link></nav><div className="nav-actions"><Link className="icon-button" href="/works" aria-label="Search works"><Search size={17} /></Link><Link className="account-link" href="/login"><CircleUserRound size={17} /><span>Sign in</span></Link><button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={20} /> : <Menu size={20} />}</button></div></div></header>;
}

export function Footer() {
  return <footer className="site-footer"><div><Logo compact /><p>전시에서 시작된 관계가<br />그 이후에도 이어집니다.</p></div><div className="footer-links"><div><span>Explore</span><Link href="/artists">Artists</Link><Link href="/works">Works</Link><Link href="/connections">Connections</Link><Link href="/recap">Connected 2027</Link></div><div><span>About</span><Link href="/about">Philosophy</Link><Link href="/projects">Projects</Link><Link href="/join">Join</Link></div><div><span>Stay close</span><a href="mailto:hello@uau.unframe.kr">hello@uau.unframe.kr</a><a href="#newsletter">U.A.U Radar ↗</a></div></div><small>© 2026 u.a.u / UNFRAME ARTIST UNIT <em>Demonstration archive</em></small></footer>;
}

export function SectionHeading({ title, action, href = "#" }: { title: string; action?: string; href?: string }) {
  return <div className="section-heading"><h2>{title}</h2>{action && <Link href={href} className="text-link">{action} <ArrowUpRight size={14} /></Link>}</div>;
}

export function BookmarkButton({ label = "Save" }: { label?: string }) {
  const [saved, setSaved] = useState(false);
  return <button className={saved ? "save-button saved" : "save-button"} onClick={() => setSaved(!saved)} aria-pressed={saved} aria-label={saved ? "Remove from saved" : label || "Save work"}><Bookmark size={15} fill={saved ? "currentColor" : "none"} />{saved ? "Saved" : label}</button>;
}

export function ArtImage({ className = "", position = "center", label = "Artwork image" }: { className?: string; position?: string; label?: string }) {
  return <div className={`art-image ${className}`}><img src="/assets/uau-hero.png" alt={label} style={{ objectPosition: position }} /><span className="art-image-glow" /></div>;
}

export function MetaLine({ children }: { children: React.ReactNode }) { return <span className="meta-line">{children}</span>; }
export function StatusDot({ children }: { children: React.ReactNode }) { return <span className="status-dot"><i />{children}</span>; }
export function Breadcrumb({ current }: { current: string }) { return <div className="breadcrumb"><Link href="/">u.a.u</Link><ChevronRight size={14} /><span>{current}</span></div>; }
export function DemoNotice() { return <div className="demo-notice"><span><i /> Demonstration archive</span><span>Sample content · production data will connect here</span></div>; }
export function VerifiedMark({ compact = false }: { compact?: boolean }) { return <span className={compact ? "verified-mark verified-compact" : "verified-mark"} title="Verified u.a.u Artist"><img className="verified-mark-image" src="/assets/uau-logo-mark.png" alt="" />{!compact && <small>verified</small>}</span>; }
