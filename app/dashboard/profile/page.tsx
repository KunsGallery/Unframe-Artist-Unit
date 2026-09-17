"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Check, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../../components";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { accountTypes, saveUserProfile, useArtistMembership, useMembership, useUserProfile, type UauAccountType } from "../../profile";
import { DashboardSidebar } from "../dashboard-sidebar";

export default function DashboardProfilePage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const { artist } = useArtistMembership(user?.uid);
  const { membership } = useMembership(user?.uid);
  const router = useRouter();
  const [form, setForm] = useState({ displayName: "", accountType: "artist" as UauAccountType, basedInCity: "", country: "", practice: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!profile && !user) return;
    setForm({
      displayName: profile?.displayName || user?.displayName || "",
      accountType: profile?.accountType || "artist",
      basedInCity: profile?.basedInCity || "",
      country: profile?.country || "",
      practice: profile?.practice || "",
      bio: profile?.bio || "",
    });
  }, [profile, user]);

  const roleLabel = useMemo(() => accountTypes.find((role) => role.value === form.accountType), [form.accountType]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await saveUserProfile(user.uid, form);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : tx(locale, "Profile could not be saved.", "프로필을 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user || profileLoading) {
    return <main className="dashboard-page"><DemoNotice /><div className="auth-guard"><RefreshCw className="spin" size={18} /> {tx(locale, "Opening your profile…", "프로필을 여는 중…")}</div></main>;
  }

  const hasArtistAccess = artist?.verified === true && artist.applicationStatus === "approved" || membership?.active === true || membership?.status === "active";
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="profile" /><section className="dashboard-main profile-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / PROFILE", "MY U.A.U / 프로필")}</MetaLine><h1>{tx(locale, <>Make your place<br /><em>legible.</em></>, <>당신의 자리를<br /><em>선명하게.</em></>)}</h1></div><div className="profile-role-stamp"><span>{roleLabel?.en}</span><strong>{form.displayName || "u.a.u"}</strong></div></div><div className="profile-layout"><form className="profile-form" onSubmit={handleSubmit}><div className="profile-form-intro"><MetaLine>{tx(locale, "YOUR IDENTITY", "당신의 정체성")}</MetaLine><p>{tx(locale, "Choose the role that best describes how you enter the unit. You can change it as your practice moves.", "유닛에 들어오는 방식을 가장 잘 설명하는 역할을 선택하세요. 실천의 방향에 따라 언제든 바꿀 수 있습니다.")}</p></div><label>{tx(locale, "Display name", "표시 이름")}<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder={tx(locale, "Your name", "이름")} /></label><label>{tx(locale, "I enter as", "나는 이렇게 들어옵니다")}<select value={form.accountType} onChange={(event) => setForm({ ...form, accountType: event.target.value as UauAccountType })}>{accountTypes.map((role) => <option value={role.value} key={role.value}>{tx(locale, role.en, role.ko)}</option>)}</select></label><div className="profile-two-up"><label>{tx(locale, "Based in", "활동 지역")}<input value={form.basedInCity} onChange={(event) => setForm({ ...form, basedInCity: event.target.value })} placeholder={tx(locale, "Seoul", "서울")} /></label><label>{tx(locale, "Country", "국가")}<input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} placeholder={tx(locale, "Korea", "한국")} /></label></div><label>{tx(locale, "Practice / field", "실천 / 분야")}<input value={form.practice} onChange={(event) => setForm({ ...form, practice: event.target.value })} placeholder={tx(locale, "Painting, sound, research…", "회화, 사운드, 리서치…")} /></label><label>{tx(locale, "Short note", "짧은 소개")}<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder={tx(locale, "What are you keeping open?", "무엇을 열어두고 있나요?")} rows={5} /></label><div className="profile-submit-row"><button className="button button-blue" type="submit" disabled={saving}>{saving ? tx(locale, "Saving…", "저장 중…") : tx(locale, "Save profile", "프로필 저장")} <ArrowUpRight size={15} /></button>{saved && <span className="save-confirm"><Check size={14} /> {tx(locale, "Saved", "저장됨")}</span>}{error && <span className="form-error">{error}</span>}</div></form><aside className="profile-side"><div className={hasArtistAccess ? "membership-status is-verified" : "membership-status"}><MetaLine>{tx(locale, "ARTIST ACCESS", "아티스트 이용 권한")}</MetaLine><h2>{hasArtistAccess ? tx(locale, "Your gallery is open.", "당신의 갤러리가 열려 있습니다.") : tx(locale, "Your practice can begin here.", "당신의 실천은 여기서 시작할 수 있습니다.")}</h2><p>{hasArtistAccess ? tx(locale, "Your membership or approved artist status unlocks a small virtual gallery and a public artist page.", "멤버십 또는 승인된 아티스트 상태로 작은 버츄얼 갤러리와 공개 아티스트 페이지를 사용할 수 있습니다.") : tx(locale, "Every artist can compose an AI spatial preview. Membership or UNFRAME verification opens the full virtual gallery.", "모든 아티스트는 AI 공간 프리뷰를 만들 수 있습니다. 멤버십 또는 UNFRAME 인증을 받으면 전체 버츄얼 갤러리가 열립니다.")}</p><div className="membership-meta"><span>{tx(locale, "Account role", "계정 역할")}<strong>{tx(locale, roleLabel?.en || "Artist", roleLabel?.ko || "아티스트")}</strong></span><span>{tx(locale, "Membership", "멤버십")}<strong>{hasArtistAccess ? tx(locale, membership?.active ? "Active membership" : "Verified artist", membership?.active ? "활성 멤버십" : "인증 아티스트") : tx(locale, "Open / review", "신청 / 검토")}</strong></span></div><a className="text-link" href="/dashboard/virtual-gallery">{tx(locale, "Open your space", "나의 공간 열기")} <ArrowUpRight size={14} /></a></div><div className="profile-note"><span>u.a.u</span><p>{tx(locale, "A profile is not a finished statement. It is a door left open for the next connection.", "프로필은 완성된 선언이 아닙니다. 다음 연결을 위해 열어둔 문입니다.")}</p></div></aside></div></section></div></main>;
}
