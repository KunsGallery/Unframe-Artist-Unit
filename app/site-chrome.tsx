"use client";
import Link from "next/link";
import { useLanguage } from "./i18n-provider";
import { tx } from "./i18n-shared";
import { usePathname } from "next/navigation";
import { Nav, Footer } from "./components";
import { GuideLauncher } from "./components/guide-launcher";

export function SiteChrome({ part }: { part: "header" | "footer" }) {
  const { locale } = useLanguage();
  const path = usePathname() || "/";
  const artist = path.startsWith("/artist/") || path === "/dashboard/profile/preview";
  const workspace = path.startsWith("/admin") || path.startsWith("/dashboard");
  if (artist) return null; // Artist pages already have their own navigation.
  return part === "header" ? <><Nav />{path.startsWith("/admin") && <nav className="admin-workspace-nav" aria-label={tx(locale, "Admin navigation", "관리자 메뉴")}>{[["/admin", "Overview", "개요"], ["/admin/access", "Approvals", "승인신청"], ["/admin/artists", "Artists", "작가 관리"], ["/admin/organizations", "Galleries & exhibitions", "갤러리·전시"], ["/admin/editor", "Site editor", "사이트 편집"]].map(([href, en, ko]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{tx(locale, en, ko)}</Link>)}</nav>}</> : <>{!workspace && <Footer />}<GuideLauncher /></>;
}
