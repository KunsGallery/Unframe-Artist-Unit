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
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
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

  const displayName = profile?.displayName || user.displayName || user.email?.split("@")[0] || tx(locale, "My u.a.u", "My u.a.u");
  const initials = getInitials(user.displayName || user.email || "u.a.u");

  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="overview" /><section className="dashboard-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / OVERVIEW", "MY U.A.U / 개요")}</MetaLine><h1>{tx(locale, <>Good to see you<br /><em>back.</em></>, <>다시 만나서<br /><em>반갑습니다.</em></>)}</h1></div><div className="profile-chip"><span className="artist-avatar tone-blue">{initials}</span><span>{displayName}</span></div></div><div className="dashboard-notice"><span><i /> {tx(locale, "Signed in with Google", "Google 계정으로 로그인됨")}</span>{user.email && <span className="dashboard-account-email">{user.email}</span>}</div><div className="dashboard-grid"><div className="dash-card wide"><MetaLine>{tx(locale, "RECENT ACTIVITY", "최근 활동")}</MetaLine><h2>{tx(locale, "The thread continues.", "실마리는 계속됩니다.")}</h2><div className="activity"><div><span className="activity-mark tone-blue">HM</span><p><strong>Han Mira</strong> {tx(locale, "added a new work to", "님이 다음 프로젝트에 새 작품을 추가했습니다:")} <b>After the Salon</b><small>{tx(locale, "2 hours ago", "2시간 전")}</small></p></div><div><span className="activity-mark tone-clay">YD</span><p><strong>Yoon Doyun</strong> {tx(locale, "accepted your project invite", "님이 프로젝트 초대를 수락했습니다")}<small>{tx(locale, "Yesterday", "어제")}</small></p></div></div></div><div className="dash-card"><MetaLine>{tx(locale, "PROFILE VIEWS", "프로필 조회")}</MetaLine><strong className="dash-number">284</strong><span className="dash-trend">{tx(locale, "+18% this month", "이번 달 +18%")}</span><div className="bar-chart"><i /><i /><i /><i /><i /><i /><i /></div></div><div className="dash-card"><MetaLine>{tx(locale, "SAVED WORKS", "저장한 작품")}</MetaLine><strong className="dash-number">12</strong><Link className="dash-card-link" href="/works">{tx(locale, "Return to your saved works", "저장한 작품으로 돌아가기")} <ArrowUpRight size={14} /></Link></div><div className="dash-card wide invite-card"><div><MetaLine>{tx(locale, "FIND YOUR UNIT", "당신의 유닛 찾기")}</MetaLine><h2>{tx(locale, "Looking for a sound artist?", "사운드 아티스트를 찾고 있나요?")}</h2><p>{tx(locale, "Tell us what you are trying to make. We'll help you find a thread to follow.", "무엇을 만들고 있는지 알려주세요. 따라갈 실마리를 함께 찾아드리겠습니다.")}</p></div><Link className="button button-blue" href="/artists">{tx(locale, "Start exploring", "탐색 시작하기")} <ArrowRight size={16} /></Link></div></div></section></div></main>;
}
