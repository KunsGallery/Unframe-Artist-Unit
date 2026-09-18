"use client";

import Link from "next/link";
import { ArrowUpRight, Bell, Check, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DemoNotice, MetaLine } from "../../components";
import { artists, artworks, projects } from "../../data";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { saveUserProfile, useUserProfile, type RecommendationDigest } from "../../profile";
import { DashboardSidebar } from "../dashboard-sidebar";

export default function RecommendationsPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const [digest, setDigest] = useState<RecommendationDigest>("realtime");
  const [optIn, setOptIn] = useState(true);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (profile) { setDigest(profile.recommendationDigest ?? "realtime"); setOptIn(profile.recommendationOptIn !== false); } }, [profile]);
  const preferences = Object.values(profile?.collectorPreferences ?? {}).flat();
  const recommendations = useMemo(() => artists.map((artist) => {
    const haystack = [artist.discipline, ...artist.tags, artist.city].join(" ").toLowerCase();
    const score = preferences.reduce((total, preference) => total + (haystack.includes(preference.toLowerCase()) ? 2 : 0), 0);
    return { ...artist, score };
  }).sort((a, b) => b.score - a.score).slice(0, 4), [preferences.join("|")]);
  async function saveSettings() { if (!user) return; await saveUserProfile(user.uid, { recommendationDigest: digest, recommendationOptIn: optIn }); setSaved(true); window.setTimeout(() => setSaved(false), 1800); }
  if (loading || profileLoading || !user || !profile?.onboardingCompleted) return <main className="dashboard-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking your account…", "계정을 확인하고 있습니다…")}</div></main>;
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="recommendations" /><section className="dashboard-main recommendations-page"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / FOR YOU", "MY U.A.U / 당신을 위한 추천")}</MetaLine><h1>{tx(locale, <>A little closer<br /><em>to the work.</em></>, <>작품에 조금 더<br /><em>가까이.</em></>)}</h1></div><span className="recommendation-signal"><Bell size={15} /> {tx(locale, "Live signals", "실시간 신호")}</span></div><section className="recommendation-intro"><MetaLine>{tx(locale, "WHY THIS IS HERE", "이 추천이 있는 이유")}</MetaLine><p>{tx(locale, "Your recommendations begin with what you choose to save and the words you use to describe your attention. Nothing is random.", "추천은 당신이 저장한 것과 주의를 설명하는 단어에서 시작합니다. 무작위로 고르지 않습니다.")}</p></section><section className="recommendation-list"><div className="dashboard-section-head"><div><MetaLine>{tx(locale, "A SIGNAL TO FOLLOW", "따라가 볼 신호")}</MetaLine><h2>{tx(locale, "Because you kept an eye on…", "당신이 오래 바라본 것에서 이어져")}</h2></div><Link className="text-link" href="/artists">{tx(locale, "All artists", "모든 아티스트")} <ArrowUpRight size={14} /></Link></div>{recommendations.map((artist) => <Link href={`/artist/${artist.slug}`} className="recommendation-row" key={artist.slug}><span className="recommendation-mark">{artist.initials}</span><div><MetaLine>{artist.discipline} · {artist.city}</MetaLine><h3>{artist.name}</h3><p>{artist.bio}</p><small>{artist.score > 0 ? tx(locale, "Matches your saved attention", "당신이 저장한 관심사와 연결됩니다") : tx(locale, "A nearby practice from the unit", "유닛 안에서 가까운 실천입니다")}</small></div><ArrowUpRight size={17} /></Link>)}</section><section className="recommendation-lower"><div><MetaLine>{tx(locale, "CONNECTED PROJECTS", "연결된 프로젝트")}</MetaLine>{projects.map((project) => <Link className="recommendation-project" href={`/projects/${project.slug}`} key={project.slug}><span>{project.meta}</span><strong>{project.title}</strong><ArrowUpRight size={14} /></Link>)}</div><div className="recommendation-settings"><MetaLine>{tx(locale, "NOTIFICATION RHYTHM", "알림 리듬")}</MetaLine><h2>{tx(locale, "How should the thread return?", "실마리가 어떻게 돌아오면 좋을까요?")}</h2><label className="recommendation-toggle"><input type="checkbox" checked={optIn} onChange={(event) => setOptIn(event.target.checked)} /><span><strong>{tx(locale, "Keep recommendations open", "추천 알림 열어두기")}</strong><small>{tx(locale, "New work, exhibitions, and related artists.", "새 작품, 전시, 연관 아티스트 알림")}</small></span></label><div className="digest-options"><SlidersHorizontal size={15} />{(["realtime", "weekly", "monthly", "off"] as RecommendationDigest[]).map((option) => <button type="button" className={digest === option ? "is-active" : ""} key={option} onClick={() => setDigest(option)}>{option}</button>)}</div><button type="button" className="button button-blue" onClick={() => void saveSettings()}>{saved ? <><Check size={15} /> {tx(locale, "Saved", "저장됨")}</> : tx(locale, "Save rhythm", "알림 리듬 저장")}</button></div></section></section></div></main>;
}
