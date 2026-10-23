"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MetaLine } from "../components";
import { DashboardSidebar } from "./dashboard-sidebar";
import { useAuth } from "../auth-provider";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { useArtistMembership, useUserProfile } from "../profile";
import { getReviewStatus, getStartChecklist, type ReviewState, type StartChecklistItem } from "../artist-progress";
import "../artist-growth.css";

// Names the sign-in method actually used instead of assuming Google.
function signInLabel(providers: string[], locale: "en" | "ko") {
  if (providers.includes("google.com")) return tx(locale, "Signed in with Google", "Google 계정으로 로그인됨");
  if (providers.includes("password")) return tx(locale, "Signed in with email", "이메일로 로그인됨");
  return tx(locale, "Signed in", "로그인됨");
}

function getInitials(value: string) {
  return value.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

export default function DashboardPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const { artist: application } = useArtistMembership(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && !profileLoading && user && !profile?.onboardingCompleted) router.replace("/onboarding");
  }, [loading, profile, profileLoading, router, user]);

  if (loading || profileLoading || !user || !profile?.onboardingCompleted) {
    return <main className="dashboard-page"><div className="auth-guard">{tx(locale, "Checking your account…", "계정을 확인하고 있습니다…")}</div></main>;
  }

  const displayName = profile.displayName || user.displayName || user.email?.split("@")[0] || tx(locale, "My u.a.u", "My u.a.u");
  const initials = getInitials(user.displayName || user.email || "u.a.u");
  return <main className="dashboard-page"><div className="dashboard-wrap"><DashboardSidebar active="overview" /><section className="dashboard-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / OVERVIEW", "MY U.A.U / 개요")}</MetaLine><h1>{tx(locale, <>Good to see you<br /><em>back.</em></>, <>다시 만나서<br /><em>반갑습니다.</em></>)}</h1></div><div className="profile-chip"><span className="artist-avatar tone-blue">{initials}</span><span>{displayName}</span></div></div><div className="dashboard-notice"><span><i /> {signInLabel(user.providerData.map((item) => item.providerId), locale)}</span>{user.email && <span className="dashboard-account-email">{user.email}</span>}</div><div className="dashboard-grid">{profile.accountType === "artist" ? <><StartChecklist profile={profile} locale={locale} /><ReviewCard application={application} profile={profile} locale={locale} /></> : <div className="dash-card wide"><MetaLine>{tx(locale, "RECENT ACTIVITY", "최근 활동")}</MetaLine><h2>{tx(locale, "Your live activity will appear here.", "실시간 활동이 이곳에 나타납니다.")}</h2><p>{tx(locale, "There is no activity to show yet.", "아직 표시할 활동이 없습니다.")}</p></div>}<div className="dash-card"><MetaLine>{tx(locale, "PROFILE VIEWS", "프로필 조회")}</MetaLine><strong className="dash-number">—</strong><span className="dash-trend">{tx(locale, "Live metrics will appear after publishing.", "공개 후 실시간 지표가 표시됩니다.")}</span></div><div className="dash-card"><MetaLine>{tx(locale, "SAVED WORKS", "저장한 작품")}</MetaLine><strong className="dash-number">—</strong><Link className="dash-card-link" href="/works">{tx(locale, "Browse published works", "공개된 작품 둘러보기")} <ArrowUpRight size={14} /></Link></div><div className="dash-card wide invite-card"><div><MetaLine>{tx(locale, "FIND YOUR UNIT", "당신의 유닛 찾기")}</MetaLine><h2>{tx(locale, "Build your public archive.", "공개 아카이브를 만들어보세요.")}</h2><p>{tx(locale, "Publish your profile and works to start making real connections.", "프로필과 작품을 공개하면 실제 연결이 시작됩니다.")}</p></div><Link className="button button-blue" href="/dashboard/profile">{tx(locale, "Open your profile", "프로필 열기")} <ArrowRight size={16} /></Link></div></div></section></div></main>;
}

const checklistCopy: Record<StartChecklistItem["id"], { en: string; ko: string; hintEn: string; hintKo: string }> = {
  basics: { en: "Artist details", ko: "작가 정보", hintEn: "Name, practice, city and a short bio of 40+ characters", hintKo: "이름, 활동 분야, 도시, 40자 이상의 소개" },
  works: { en: "Three selected works", ko: "대표작 3점", hintEn: "Each with a title and an image", hintKo: "제목과 이미지를 함께 올려 주세요" },
  inquiries: { en: "Accept inquiries", ko: "문의 받기 켜기", hintEn: "New inquiries reach you by email", hintKo: "새 문의를 이메일로 받아볼 수 있어요" },
  publish: { en: "Publish your page", ko: "작가 페이지 공개", hintEn: "Open your page to visitors and search", hintKo: "방문자와 검색에 페이지를 엽니다" },
};

const reviewCopy: Record<Exclude<ReviewState, "none">, { en: string; ko: string; bodyEn: string; bodyKo: string }> = {
  preparing: { en: "Your review starts with your details.", ko: "검토는 작가 정보부터 시작됩니다.", bodyEn: "Reviewers look at your artist details and three selected works together. Fill these in first; you can publish and receive inquiries in the meantime.", bodyKo: "검토자는 작가 정보와 대표작 3점을 함께 봅니다. 먼저 채워 주세요. 검토 중에도 페이지 공개와 문의 받기는 그대로 할 수 있습니다." },
  "in-review": { en: "U.A.U is reviewing your page.", ko: "U.A.U가 페이지를 검토하고 있어요.", bodyEn: "Everything reviewers need is in place. You can keep editing, publishing and receiving inquiries while you wait.", bodyKo: "검토에 필요한 내용이 모두 준비됐습니다. 기다리는 동안에도 편집, 공개, 문의 받기는 그대로 할 수 있습니다." },
  approved: { en: "You are a verified U.A.U artist.", ko: "U.A.U 인증 작가입니다.", bodyEn: "Your number is on your page, and the second gallery room and square beam are open in Growth.", bodyKo: "작가 번호가 페이지에 표시되고, 성장 탭에서 가상 갤러리 2번째 방과 사각 조명이 열립니다." },
  "on-hold": { en: "Your review is on hold.", ko: "검토가 보류되었습니다.", bodyEn: "Check your notifications for what to add, update your page, then contact U.A.U to be reviewed again.", bodyKo: "알림에서 보완할 내용을 확인하고 페이지를 수정한 뒤, U.A.U에 다시 검토를 요청해 주세요." },
};

// Makes the U.A.U review visible: what is checked, where it stands, and that
// publishing never waits on it.
function ReviewCard({ application, profile, locale }: { application: ReturnType<typeof useArtistMembership>["artist"]; profile: NonNullable<ReturnType<typeof useUserProfile>["profile"]>; locale: "en" | "ko" }) {
  const status = getReviewStatus(application, profile);
  if (status.state === "none") return null;
  const copy = reviewCopy[status.state];
  const label = { preparing: tx(locale, "Preparing", "준비 중"), "in-review": tx(locale, "In review", "검토 중"), approved: status.artistId || tx(locale, "Verified", "인증 완료"), "on-hold": tx(locale, "On hold", "보류") }[status.state];
  return <div className={`dash-card wide review-card is-${status.state}`}><MetaLine>{tx(locale, "U.A.U REVIEW", "U.A.U 검토")} · {label}</MetaLine><h2>{tx(locale, copy.en, copy.ko)}</h2><p>{tx(locale, copy.bodyEn, copy.bodyKo)}</p>{status.state === "approved" ? <Link className="dash-card-link" href="/dashboard/progress">{tx(locale, "Open Growth", "성장 탭 열기")} <ArrowRight size={13} /></Link> : status.state === "on-hold" ? <Link className="dash-card-link" href="/dashboard/notifications">{tx(locale, "Open notifications", "알림 보기")} <ArrowRight size={13} /></Link> : status.state === "preparing" ? <Link className="dash-card-link" href="/dashboard/profile">{tx(locale, "Edit profile", "프로필 편집")} <ArrowRight size={13} /></Link> : null}</div>;
}

// Replaces the empty activity card until the artist page is ready to share.
function StartChecklist({ profile, locale }: { profile: NonNullable<ReturnType<typeof useUserProfile>["profile"]>; locale: "en" | "ko" }) {
  const checklist = getStartChecklist(profile);
  if (checklist.complete) {
    return <div className="dash-card wide start-checklist is-complete"><MetaLine>{tx(locale, "GETTING STARTED", "시작하기")} · {checklist.doneCount}/{checklist.total}</MetaLine><h2>{tx(locale, "Your artist page is ready.", "작가 페이지가 준비됐어요.")}</h2>{profile.publicSlug && <Link className="dash-card-link" href={`/artist/${encodeURIComponent(profile.publicSlug)}`}>{tx(locale, "View my page", "내 페이지 보기")} <ArrowUpRight size={13} /></Link>}</div>;
  }
  return <div className="dash-card wide start-checklist"><MetaLine>{tx(locale, "GETTING STARTED", "시작하기")} · {checklist.doneCount}/{checklist.total}</MetaLine><h2>{tx(locale, "Four steps to open your page.", "네 단계면 작가 페이지가 열립니다.")}</h2><div className="start-progress" role="progressbar" aria-valuemin={0} aria-valuemax={checklist.total} aria-valuenow={checklist.doneCount} aria-label={tx(locale, "Getting started progress", "시작하기 진행률")}><i style={{ width: `${checklist.doneCount / checklist.total * 100}%` }} /></div><ol>{checklist.items.map((item) => { const copy = checklistCopy[item.id]; return <li key={item.id} className={item.done ? "is-done" : ""}><span className="start-mark" aria-hidden="true">{item.done ? <Check size={13} /> : null}</span><div><strong>{tx(locale, copy.en, copy.ko)}</strong><small>{tx(locale, copy.hintEn, copy.hintKo)}</small></div>{item.done ? <span className="start-status">{tx(locale, "Done", "완료")}</span> : <Link className="dash-card-link" href="/dashboard/profile">{tx(locale, "Edit profile", "프로필 편집")} <ArrowRight size={13} /></Link>}</li>; })}</ol></div>;
}
