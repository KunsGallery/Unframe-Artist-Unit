"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../components";
import { DashboardSidebar } from "./dashboard-sidebar";
import { useAuth } from "../auth-provider";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { useUserProfile } from "../profile";
import { getStartChecklist, type StartChecklistItem } from "../artist-progress";
import "../artist-growth.css";

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
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="overview" /><section className="dashboard-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / OVERVIEW", "MY U.A.U / 개요")}</MetaLine><h1>{tx(locale, <>Good to see you<br /><em>back.</em></>, <>다시 만나서<br /><em>반갑습니다.</em></>)}</h1></div><div className="profile-chip"><span className="artist-avatar tone-blue">{initials}</span><span>{displayName}</span></div></div><div className="dashboard-notice"><span><i /> {tx(locale, "Signed in with Google", "Google 계정으로 로그인됨")}</span>{user.email && <span className="dashboard-account-email">{user.email}</span>}</div><div className="dashboard-grid">{profile.accountType === "artist" ? <StartChecklist profile={profile} locale={locale} /> : <div className="dash-card wide"><MetaLine>{tx(locale, "RECENT ACTIVITY", "최근 활동")}</MetaLine><h2>{tx(locale, "Your live activity will appear here.", "실시간 활동이 이곳에 나타납니다.")}</h2><p>{tx(locale, "There is no activity to show yet.", "아직 표시할 활동이 없습니다.")}</p></div>}<div className="dash-card"><MetaLine>{tx(locale, "PROFILE VIEWS", "프로필 조회")}</MetaLine><strong className="dash-number">—</strong><span className="dash-trend">{tx(locale, "Live metrics will appear after publishing.", "공개 후 실시간 지표가 표시됩니다.")}</span></div><div className="dash-card"><MetaLine>{tx(locale, "SAVED WORKS", "저장한 작품")}</MetaLine><strong className="dash-number">—</strong><Link className="dash-card-link" href="/works">{tx(locale, "Browse published works", "공개된 작품 둘러보기")} <ArrowUpRight size={14} /></Link></div><div className="dash-card wide invite-card"><div><MetaLine>{tx(locale, "FIND YOUR UNIT", "당신의 유닛 찾기")}</MetaLine><h2>{tx(locale, "Build your public archive.", "공개 아카이브를 만들어보세요.")}</h2><p>{tx(locale, "Publish your profile and works to start making real connections.", "프로필과 작품을 공개하면 실제 연결이 시작됩니다.")}</p></div><Link className="button button-blue" href="/dashboard/profile">{tx(locale, "Open your profile", "프로필 열기")} <ArrowRight size={16} /></Link></div></div></section></div></main>;
}

const checklistCopy: Record<StartChecklistItem["id"], { en: string; ko: string; hintEn: string; hintKo: string }> = {
  basics: { en: "Artist details", ko: "작가 정보", hintEn: "Name, practice, city and a short bio of 40+ characters", hintKo: "이름, 활동 분야, 도시, 40자 이상의 소개" },
  works: { en: "Three selected works", ko: "대표작 3점", hintEn: "Each with a title and an image", hintKo: "제목과 이미지를 함께 올려 주세요" },
  inquiries: { en: "Accept inquiries", ko: "문의 받기 켜기", hintEn: "New inquiries reach you by email", hintKo: "새 문의를 이메일로 받아볼 수 있어요" },
  publish: { en: "Publish your page", ko: "작가 페이지 공개", hintEn: "Open your page to visitors and search", hintKo: "방문자와 검색에 페이지를 엽니다" },
};

// Replaces the empty activity card until the artist page is ready to share.
function StartChecklist({ profile, locale }: { profile: NonNullable<ReturnType<typeof useUserProfile>["profile"]>; locale: "en" | "ko" }) {
  const checklist = getStartChecklist(profile);
  if (checklist.complete) {
    return <div className="dash-card wide start-checklist is-complete"><MetaLine>{tx(locale, "GETTING STARTED", "시작하기")} · {checklist.doneCount}/{checklist.total}</MetaLine><h2>{tx(locale, "Your artist page is ready.", "작가 페이지가 준비됐어요.")}</h2>{profile.publicSlug && <Link className="dash-card-link" href={`/artist/${encodeURIComponent(profile.publicSlug)}`}>{tx(locale, "View my page", "내 페이지 보기")} <ArrowUpRight size={13} /></Link>}</div>;
  }
  return <div className="dash-card wide start-checklist"><MetaLine>{tx(locale, "GETTING STARTED", "시작하기")} · {checklist.doneCount}/{checklist.total}</MetaLine><h2>{tx(locale, "Four steps to open your page.", "네 단계면 작가 페이지가 열립니다.")}</h2><div className="start-progress" role="progressbar" aria-valuemin={0} aria-valuemax={checklist.total} aria-valuenow={checklist.doneCount} aria-label={tx(locale, "Getting started progress", "시작하기 진행률")}><i style={{ width: `${checklist.doneCount / checklist.total * 100}%` }} /></div><ol>{checklist.items.map((item) => { const copy = checklistCopy[item.id]; return <li key={item.id} className={item.done ? "is-done" : ""}><span className="start-mark" aria-hidden="true">{item.done ? <Check size={13} /> : null}</span><div><strong>{tx(locale, copy.en, copy.ko)}</strong><small>{tx(locale, copy.hintEn, copy.hintKo)}</small></div>{item.done ? <span className="start-status">{tx(locale, "Done", "완료")}</span> : <Link className="dash-card-link" href="/dashboard/profile">{tx(locale, "Edit profile", "프로필 편집")} <ArrowRight size={13} /></Link>}</li>; })}</ol></div>;
}
