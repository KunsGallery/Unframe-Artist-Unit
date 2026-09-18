"use client";

import Link from "next/link";
import { ArrowUpRight, Check, LockKeyhole, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { DemoNotice, MetaLine } from "../../components";
import { artists } from "../../data";
import { db } from "../../firebase-client";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { useUserProfile } from "../../profile";
import { DashboardSidebar } from "../dashboard-sidebar";

type PublicCandidate = { slug: string; displayName?: string; artistName?: string; practice?: string; basedInCity?: string; sitePublished?: boolean; siteWorks?: Array<{ medium?: string }> };

export default function CuratorialBriefPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const [liveProfiles, setLiveProfiles] = useState<PublicCandidate[]>([]);
  const [keywords, setKeywords] = useState("");
  const [brief, setBrief] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  useEffect(() => { if (!db) return; return onSnapshot(collection(db, "public_profiles"), (snapshot) => setLiveProfiles(snapshot.docs.map((item) => ({ slug: item.id, ...item.data() } as PublicCandidate)).filter((item) => item.sitePublished !== false))); }, []);
  const roleAllowed = profile?.accountType === "curator" || profile?.accountType === "gallery" || profile?.accountType === "director" || profile?.accountType === "institution";
  const approved = profile?.accessStatus === "approved";
  const candidates = useMemo(() => {
    const live = liveProfiles.map((item) => ({ slug: item.slug, name: item.artistName || item.displayName || item.slug, practice: item.practice || "Artist practice", city: item.basedInCity || "—" }));
    const fallback = artists.map((item) => ({ slug: item.slug, name: item.name, practice: item.discipline, city: item.city }));
    const source = live.length ? live : fallback;
    const terms = keywords.toLowerCase().split(",").map((term) => term.trim()).filter(Boolean);
    return source.map((item) => ({ ...item, score: terms.reduce((score, term) => score + ([item.name, item.practice, item.city].join(" ").toLowerCase().includes(term) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score);
  }, [keywords, liveProfiles]);
  async function saveBrief() { if (!user || !db || !keywords.trim()) return; await addDoc(collection(db, "curatorial_briefs"), { ownerUid: user.uid, role: profile?.accountType, keywords: keywords.split(",").map((item) => item.trim()).filter(Boolean), brief: brief.trim(), status: "active", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); setSent("brief"); }
  async function propose(slug: string) { if (!user || !db || !brief.trim()) return; await addDoc(collection(db, "curatorial_proposals"), { senderUid: user.uid, recipientSlug: slug, title: keywords.trim(), message: brief.trim(), status: "pending", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); setSent(slug); }
  if (loading || profileLoading || !user || !profile?.onboardingCompleted) return <main className="dashboard-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking your account…", "계정을 확인하고 있습니다…")}</div></main>;
  if (!roleAllowed || !approved) return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="brief" /><section className="dashboard-main access-page"><LockKeyhole size={25} /><MetaLine>{tx(locale, "ROLE ACCESS / U.A.U REVIEW", "역할 권한 / U.A.U 검토")}</MetaLine><h1>{tx(locale, <>This room opens<br /><em>after review.</em></>, <>이 공간은<br /><em>검토 후 열립니다.</em></>)}</h1><p>{roleAllowed ? tx(locale, "Your request is in the unit's review queue. You can keep exploring the public archive while we prepare your access.", "신청이 검토 대기열에 들어갔습니다. 권한이 열리는 동안 공개 아카이브를 둘러볼 수 있습니다.") : tx(locale, "Curatorial briefs are prepared for curators, galleries, and project directors.", "기획 브리프는 큐레이터, 갤러리, 프로젝트 디렉터를 위한 공간입니다.")}</p><Link className="button button-blue" href="/artists">{tx(locale, "Continue exploring", "계속 둘러보기")} <ArrowUpRight size={16} /></Link></section></div></main>;
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="brief" /><section className="dashboard-main brief-page"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / CURATORIAL BRIEF", "MY U.A.U / 기획 브리프")}</MetaLine><h1>{tx(locale, <>Find a practice<br /><em>for the room.</em></>, <>그 공간에 맞는<br /><em>실천을 찾기.</em></>)}</h1></div></div><section className="brief-form"><MetaLine>{tx(locale, "START WITH A DIRECTION", "방향에서 시작하기")}</MetaLine><label>{tx(locale, "Keywords / media / place", "키워드 / 매체 / 장소")}<input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder={tx(locale, "material, sound, Seoul, body…", "물질, 사운드, 서울, 몸…")} /></label><label>{tx(locale, "What are you trying to make?", "무엇을 만들고 있나요?")}<textarea value={brief} onChange={(event) => setBrief(event.target.value)} rows={4} placeholder={tx(locale, "Leave enough context for an artist to understand the invitation.", "아티스트가 초대의 맥락을 이해할 수 있도록 적어주세요.")} /></label><button className="button button-blue" type="button" onClick={() => void saveBrief()}>{sent === "brief" ? <><Check size={15} /> {tx(locale, "Brief saved", "브리프 저장됨")}</> : tx(locale, "Save the brief", "브리프 저장하기")} <ArrowUpRight size={15} /></button></section><section className="candidate-section"><div className="dashboard-section-head"><div><MetaLine>{tx(locale, "UNIT MATCHES", "유닛 매칭")}</MetaLine><h2>{tx(locale, "People already in the archive.", "이미 아카이브 안에 있는 사람들.")}</h2></div><span>{candidates.length} {tx(locale, "candidates", "명의 후보")}</span></div>{candidates.map((candidate) => <div className="candidate-row" key={candidate.slug}><Link href={`/artist/${candidate.slug}`} className="candidate-main"><span>{candidate.name.slice(0, 2).toUpperCase()}</span><div><strong>{candidate.name}</strong><small>{candidate.practice} · {candidate.city}</small></div></Link><button type="button" onClick={() => void propose(candidate.slug)} disabled={!brief.trim()}>{sent === candidate.slug ? <Check size={14} /> : <Send size={14} />} {sent === candidate.slug ? tx(locale, "Sent", "보냄") : tx(locale, "Propose", "제안하기")}</button></div>)}</section></section></div></main>;
}
