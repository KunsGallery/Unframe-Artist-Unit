"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { useAuth } from "../../auth-provider";
import { DemoNotice, MetaLine } from "../../components";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { usePublishedArtists, usePublishedExhibitions } from "../../organizations";
import { saveUserProfile, useUserProfile, type RecommendationDigest } from "../../profile";
import { DashboardSidebar } from "../dashboard-sidebar";

export default function RecommendationsPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const { artists, error: artistError } = usePublishedArtists();
  const { exhibitions } = usePublishedExhibitions();
  const [digest, setDigest] = useState<RecommendationDigest>("realtime");
  const [optIn, setOptIn] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (profile) { setDigest(profile.recommendationDigest ?? "realtime"); setOptIn(profile.recommendationOptIn !== false); } }, [profile]);

  const preferences = useMemo(() => Array.from(new Set([...Object.values(profile?.collectorPreferences ?? {}).flat(), ...(profile?.intentWords ?? [])].map((item) => item.toLocaleLowerCase().trim()).filter(Boolean))), [profile?.collectorPreferences, profile?.intentWords]);
  const recommendations = useMemo(() => artists.map((artist) => {
    const text = [artist.practice, artist.bio, artist.basedInCity, artist.country, ...(artist.siteWorks || []).map((work) => work.medium || "")].join(" ").toLocaleLowerCase();
    const reasons = preferences.filter((preference) => text.includes(preference));
    return { artist, reasons };
  }).filter((item) => item.reasons.length).sort((a, b) => b.reasons.length - a.reasons.length).slice(0, 6), [artists, preferences]);

  async function saveSettings() {
    if (!user) return;
    setError(null);
    try { await saveUserProfile(user.uid, { recommendationDigest: digest, recommendationOptIn: optIn }); setSaved(true); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : tx(locale, "Settings could not be saved.", "설정을 저장하지 못했습니다.")); }
  }

  if (loading || profileLoading || !user || !profile?.onboardingCompleted) return <main className="dashboard-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking your account…", "계정을 확인하고 있습니다…")}</div></main>;
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="recommendations" /><section className="dashboard-main recommendations-page"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / FOR YOU", "MY U.A.U / 당신을 위한 추천")}</MetaLine><h1>{tx(locale, "From your interests", "관심사에서 이어지는 발견")}</h1></div></div><section className="recommendation-intro"><MetaLine>{tx(locale, "HOW THESE MATCHES WORK", "추천 기준")}</MetaLine><p>{tx(locale, "Published artists are matched against the interests you chose in your profile. Each suggestion shows its matching words.", "프로필에서 선택한 관심사와 공개된 아티스트의 작업 정보를 비교합니다. 일치한 단어를 함께 보여드립니다.")}</p></section>{artistError && <p role="alert">{tx(locale, "Artists could not be loaded.", "아티스트를 불러오지 못했습니다.")}</p>}<section className="recommendation-list"><div className="dashboard-section-head"><div><MetaLine>{tx(locale, "MATCHING PRACTICES", "일치하는 작업")}</MetaLine><h2>{tx(locale, "Artists to explore", "살펴볼 아티스트")}</h2></div><Link className="text-link" href="/artists">{tx(locale, "All artists", "모든 아티스트")} <ArrowUpRight size={14} /></Link></div>{recommendations.map(({ artist, reasons }) => <Link href={`/artist/${artist.slug}`} className="recommendation-row" key={artist.slug}><span className="recommendation-mark">{(artist.artistName || artist.displayName).slice(0, 2)}</span><div><MetaLine>{artist.practice || tx(locale, "Artist", "아티스트")} · {artist.basedInCity || "—"}</MetaLine><h3>{artist.artistName || artist.displayName}</h3><p>{artist.bio || ""}</p><small>{tx(locale, "Matches: ", "일치한 관심사: ")}{reasons.join(", ")}</small></div><ArrowUpRight size={17} /></Link>)}{!artistError && recommendations.length === 0 && <div className="empty-state"><h3>{tx(locale, "No close matches yet.", "아직 일치하는 추천이 없습니다.")}</h3><p>{preferences.length ? tx(locale, "Explore all artists while the archive grows.", "아카이브가 채워지는 동안 전체 아티스트를 둘러보세요.") : tx(locale, "Add interests to your profile to see explainable suggestions.", "프로필에 관심사를 추가하면 근거가 있는 추천을 볼 수 있습니다.")}</p><Link href={preferences.length ? "/artists" : "/dashboard/profile"} className="text-link">{tx(locale, "Continue", "계속하기")}</Link></div>}</section><section className="recommendation-lower"><div><MetaLine>{tx(locale, "PUBLISHED EXHIBITIONS", "공개 전시")}</MetaLine>{exhibitions.slice(0, 4).map((exhibition) => <Link className="recommendation-project" href={`/exhibitions/${exhibition.id}`} key={exhibition.id}><span>{exhibition.year}</span><strong>{exhibition.title}</strong><ArrowUpRight size={14} /></Link>)}</div><div className="recommendation-settings"><MetaLine>{tx(locale, "NOTIFICATION PREFERENCES", "알림 설정")}</MetaLine><h2>{tx(locale, "Your rhythm", "나의 알림 리듬")}</h2><label className="recommendation-toggle"><input type="checkbox" checked={optIn} onChange={(event) => { setOptIn(event.target.checked); setSaved(false); }} /><span><strong>{tx(locale, "Allow recommendation notifications", "추천 알림 받기")}</strong><small>{tx(locale, "Save your preference for future notices.", "향후 알림을 위한 설정을 저장합니다.")}</small></span></label><div className="digest-options">{(["realtime", "weekly", "monthly", "off"] as RecommendationDigest[]).map((option) => <button type="button" className={digest === option ? "is-active" : ""} key={option} onClick={() => { setDigest(option); setSaved(false); }}>{option}</button>)}</div><button type="button" className="button button-blue" onClick={() => void saveSettings()}>{saved ? <><Check size={15} /> {tx(locale, "Saved", "저장됨")}</> : tx(locale, "Save preference", "설정 저장")}</button>{error && <p role="alert">{error}</p>}</div></section></section></div></main>;
}
