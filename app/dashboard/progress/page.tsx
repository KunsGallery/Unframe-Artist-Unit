"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, LockKeyhole, Sparkles } from "lucide-react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { DemoNotice, MetaLine } from "../../components";
import { DashboardSidebar } from "../dashboard-sidebar";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { useUserProfile } from "../../profile";
import { db } from "../../firebase-client";
import { getArtistProgress, type ArtistProgressEvent } from "../../artist-progress";
import "../../artist-growth.css";
import "../../artist-growth-motion.css";

export default function ArtistProgressPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const [events, setEvents] = useState<ArtistProgressEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsUnavailable, setEventsUnavailable] = useState(false);

  useEffect(() => {
    if (!user || !db) { setEvents([]); setEventsLoading(false); return; }
    let current = true;
    void getDocs(query(collection(db, "engagement_events"), where("actorUid", "==", user.uid), limit(500)))
      .then((snapshot) => { if (current) setEvents(snapshot.docs.map((item) => item.data() as ArtistProgressEvent)); })
      .catch(() => { if (current) setEventsUnavailable(true); })
      .finally(() => { if (current) setEventsLoading(false); });
    return () => { current = false; };
  }, [user]);

  const progress = useMemo(() => getArtistProgress(profile, events), [profile, events]);
  if (loading || !user) return <main className="dashboard-page"><DemoNotice/><div className="auth-guard">{tx(locale, "Checking your account…", "계정을 확인하고 있습니다…")}</div></main>;

  const unlockedCount = progress.milestones.filter((item) => item.unlocked).length;
  return <main className="dashboard-page"><DemoNotice/><div className="dashboard-wrap"><DashboardSidebar active="progress"/><section className="dashboard-main growth-main">
    <div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / GROWTH", "MY U.A.U / 성장")}</MetaLine><h1>{tx(locale, <>Let your practice<br/><em>open new rooms.</em></>, <>작업의 기록으로<br/><em>새로운 방을 열어요.</em></>)}</h1></div><div className="growth-stage"><span>{tx(locale, "YOUR CURRENT STAGE", "현재 단계")}</span><strong>{progress.foundationComplete ? tx(locale, "전시", "전시") : progress.completeWorkCount > 0 ? tx(locale, "탐구", "탐구") : tx(locale, "기록", "기록")}</strong></div></div>
    <div className="growth-summary"><div><strong>{progress.foundationProgress}%</strong><span>{tx(locale, "작가 프로필 준비도", "작가 프로필 준비도")}</span></div><p>{tx(locale, "활동 점수로 경쟁하지 않아요. 실제로 쌓은 작가 기록과 동료와의 연결을 바탕으로, 다음에 쓸 수 있는 도구를 안내합니다.", "활동 점수로 경쟁하지 않아요. 실제로 쌓은 작가 기록과 동료와의 연결을 바탕으로, 다음에 쓸 수 있는 도구를 안내합니다.")}</p></div>
    <div className="growth-progress-track" aria-label={`${progress.foundationProgress}% complete`}><i style={{width:`${progress.foundationProgress}%`}}/></div>
    <div className="growth-shortcuts"><Link href="/dashboard/profile"><span><strong>{progress.completeWorkCount}/3</strong><small>{tx(locale, "대표작 준비", "대표작 준비")}</small></span><ArrowRight size={16}/></Link><Link href="/dashboard/profile#builder-records"><span><strong>{progress.exhibitionCount}</strong><small>{tx(locale, "전시 기록", "전시 기록")}</small></span><ArrowRight size={16}/></Link><Link href="/dashboard/threads"><span><strong>{progress.interactionCount}/3</strong><small>{tx(locale, "동료 연결 활동", "동료 연결 활동")}</small></span><ArrowRight size={16}/></Link></div>
    <div className="growth-heading"><div><MetaLine>{tx(locale, "TOOLS THAT OPEN WITH YOUR PRACTICE", "작업의 기록에 따라 열리는 도구")}</MetaLine><h2>{tx(locale, "A path, not a leaderboard.", "순위가 아닌, 나만의 다음 단계.")}</h2></div><span>{eventsLoading ? tx(locale, "활동 기록을 확인하는 중…", "활동 기록을 확인하는 중…") : `${unlockedCount} ${tx(locale, "available", "개 이용 가능")}`}</span></div>
    {eventsUnavailable && <p className="growth-data-note" role="status">{tx(locale, "동료 연결 활동을 불러오지 못했어요. 프로필 완성도는 계속 계산됩니다.", "동료 연결 활동을 불러오지 못했어요. 프로필 완성도는 계속 계산됩니다.")}</p>}
    <div className="milestone-list">{progress.milestones.map((item) => <article className={`milestone-row ${item.unlocked ? "is-unlocked" : "is-locked"}`} key={item.id}><span className="milestone-status">{item.unlocked ? <Check size={17}/> : <LockKeyhole size={15}/>}</span><div className="milestone-copy"><div><h3>{item.title}</h3>{item.kind === "opportunity" && <span className="milestone-kind">{tx(locale, "편집 검토 기회", "편집 검토 기회")}</span>}</div><p>{item.detail}</p>{!item.unlocked && item.progress > 0 && <div className="milestone-meter"><i style={{width:`${Math.min(100, item.progress / item.target * 100)}%`}}/></div>}</div><span className="milestone-state">{item.unlocked ? tx(locale, "열림", "열림") : `${Math.min(item.progress, item.target)}/${item.target}`}</span></article>)}</div>
    <aside className="growth-fairness"><Sparkles size={17}/><p>{tx(locale, "기본 프로필·작품 공개와 공유는 계속 사용할 수 있어요. Editorial Spotlight와 오프라인 전시는 자동 보상이 아니라, 동의한 작가 중 편집팀이 작업 맥락에 맞게 검토하는 기회입니다.", "기본 프로필·작품 공개와 공유는 계속 사용할 수 있어요. 에디토리얼 피처와 오프라인 전시는 자동 보상이 아니라, 동의한 작가 중 편집팀이 작업 맥락에 맞게 검토하는 기회입니다.")}</p></aside>
    <Link className="button button-blue growth-profile-link" href="/dashboard/profile">{tx(locale, "Continue your profile", "프로필 이어서 완성하기")} <ArrowRight size={15}/></Link>
  </section></div></main>;
}
