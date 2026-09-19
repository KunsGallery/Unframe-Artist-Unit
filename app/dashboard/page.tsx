"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../components";
import { DashboardSidebar } from "./dashboard-sidebar";
import { useAuth } from "../auth-provider";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { useUserProfile } from "../profile";

function getInitials(value: string) {
  return value.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

export default function DashboardPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && !profileLoading && user && !profile?.onboardingCompleted) router.replace("/onboarding");
  }, [loading, profile, profileLoading, router, user]);

  if (loading || profileLoading || !user || !profile?.onboardingCompleted) {
    return <main className="dashboard-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking your account…", "계정을 확인하고 있습니다…")}</div></main>;
  }

  const displayName = profile.displayName || user.displayName || user.email?.split("@")[0] || tx(locale, "My u.a.u", "My u.a.u");
  const initials = getInitials(user.displayName || user.email || "u.a.u");
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="overview" /><section className="dashboard-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / OVERVIEW", "MY U.A.U / 개요")}</MetaLine><h1>{tx(locale, <>Good to see you<br /><em>back.</em></>, <>다시 만나서<br /><em>반갑습니다.</em></>)}</h1></div><div className="profile-chip"><span className="artist-avatar tone-blue">{initials}</span><span>{displayName}</span></div></div><div className="dashboard-notice"><span><i /> {tx(locale, "Signed in with Google", "Google 계정으로 로그인됨")}</span>{user.email && <span className="dashboard-account-email">{user.email}</span>}</div><div className="dashboard-grid"><div className="dash-card wide"><MetaLine>{tx(locale, "RECENT ACTIVITY", "최근 활동")}</MetaLine><h2>{tx(locale, "Your live activity will appear here.", "실시간 활동이 이곳에 나타납니다.")}</h2><p>{tx(locale, "There is no activity to show yet.", "아직 표시할 활동이 없습니다.")}</p></div><div className="dash-card"><MetaLine>{tx(locale, "PROFILE VIEWS", "프로필 조회")}</MetaLine><strong className="dash-number">—</strong><span className="dash-trend">{tx(locale, "Live metrics will appear after publishing.", "공개 후 실시간 지표가 표시됩니다.")}</span></div><div className="dash-card"><MetaLine>{tx(locale, "SAVED WORKS", "저장한 작품")}</MetaLine><strong className="dash-number">—</strong><Link className="dash-card-link" href="/works">{tx(locale, "Browse published works", "공개된 작품 둘러보기")} <ArrowUpRight size={14} /></Link></div><div className="dash-card wide invite-card"><div><MetaLine>{tx(locale, "FIND YOUR UNIT", "당신의 유닛 찾기")}</MetaLine><h2>{tx(locale, "Build your public archive.", "공개 아카이브를 만들어보세요.")}</h2><p>{tx(locale, "Publish your profile and works to start making real connections.", "프로필과 작품을 공개하면 실제 연결이 시작됩니다.")}</p></div><Link className="button button-blue" href="/dashboard/profile">{tx(locale, "Open your profile", "프로필 열기")} <ArrowRight size={16} /></Link></div></div></section></div></main>;
}
