"use client";

import Link from "next/link";
import { ArrowUpRight, Bell, Bookmark, FolderKanban, LogOut, Plus, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "../components";
import { useLanguage } from "../i18n-provider";
import { useAuth } from "../auth-provider";
import { tx } from "../i18n-shared";

type DashboardSection = "overview" | "notifications";

export function DashboardSidebar({ active }: { active: DashboardSection }) {
  const { locale } = useLanguage();
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const displayName = user?.displayName || user?.email?.split("@")[0] || tx(locale, "My u.a.u", "My u.a.u");

  return (
    <aside className="dashboard-nav">
      <Logo compact />
      <span className="dash-label">{tx(locale, "My u.a.u", "My u.a.u")}</span>
      <Link className={active === "overview" ? "active" : ""} href="/dashboard">
        <FolderKanban size={16} /> {tx(locale, "Overview", "개요")}
      </Link>
      <Link href="/artists">
        <UserRound size={16} /> {tx(locale, "Profile", "프로필")}
      </Link>
      <Link href="/works">
        <Bookmark size={16} /> {tx(locale, "Saved works", "저장한 작품")}
      </Link>
      <Link href="/projects">
        <Plus size={16} /> {tx(locale, "Projects", "프로젝트")}
      </Link>
      <Link className={active === "notifications" ? "active" : ""} href="/dashboard/notifications">
        <Bell size={16} /> {tx(locale, "Notifications", "알림")} <b>2</b>
      </Link>
      <div className="dash-bottom">
        <span>{displayName}</span>
        {user?.email && <small>{user.email}</small>}
        <button className="dashboard-signout" type="button" onClick={handleLogout}>
          <LogOut size={14} /> {tx(locale, "Sign out", "로그아웃")}
        </button>
        <Link href="/">
          {tx(locale, "Back to public site", "공개 사이트로 돌아가기")} <ArrowUpRight size={14} />
        </Link>
      </div>
    </aside>
  );
}
