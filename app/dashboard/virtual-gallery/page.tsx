"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCw, Check, LockKeyhole, Sparkles } from "lucide-react";
import { DemoNotice, MetaLine } from "../../components";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { useArtistMembership, useUserProfile } from "../../profile";
import { getArtistProgress } from "../../artist-progress";
import "../../gallery-unlock.css";
import { DashboardSidebar } from "../dashboard-sidebar";

export default function VirtualGalleryPage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const { artist } = useArtistMembership(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, router, user]);

  if (authLoading || !user || profileLoading) {
    return <main className="dashboard-page"><DemoNotice /><div className="auth-guard"><RefreshCw className="spin" size={18} /> {tx(locale, "Opening your public space…", "공개 공간을 불러오는 중…")}</div></main>;
  }

  const publicPath = profile?.publicSlug ? `/artist/${profile.publicSlug}` : null;
  const readiness = getArtistProgress(profile);
  const verifiedArtist = artist?.verified === true && artist.applicationStatus === "approved";
  const roomTwoUnlocked = verifiedArtist && readiness.foundationComplete;
  const localPrototypeAvailable = process.env.NODE_ENV !== "production";

  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="space" /><section className="dashboard-main space-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / PUBLIC SPACE", "MY U.A.U / 공개 공간")}</MetaLine><h1>{tx(locale, "Your public space", "나의 공개 공간")}</h1></div></div><div className="space-grid"><section className="space-tool"><div className="space-tool-heading"><div><MetaLine>{tx(locale, "YOUR ARTIST PAGE", "아티스트 페이지")}</MetaLine><h2>{tx(locale, "Shape the page people actually see.", "방문자가 보는 페이지를 직접 가꿔보세요.")}</h2></div></div><p>{tx(locale, "Your profile, selected works and exhibition records appear together on your public page. Edit them in your profile before publishing.", "프로필과 대표 작품, 전시 기록이 공개 페이지에 함께 표시됩니다. 프로필에서 내용을 수정하고 공개해 주세요.")}</p><Link className="button button-blue" href="/dashboard/profile">{tx(locale, "Edit my profile", "프로필 편집")} <ArrowUpRight size={15} /></Link></section><section className="space-tool"><div className="space-tool-heading"><div><MetaLine>{tx(locale, "PUBLIC STATUS", "공개 상태")}</MetaLine><h2>{profile?.sitePublished ? tx(locale, "Your page is live.", "페이지가 공개 중입니다.") : tx(locale, "Your page is not public yet.", "아직 페이지가 공개되지 않았습니다.")}</h2></div></div>{profile?.sitePublished && publicPath ? <Link className="text-link" href={publicPath}>{tx(locale, "Open my public page", "내 공개 페이지 보기")} <ArrowUpRight size={15} /></Link> : <p>{tx(locale, "Publish your profile when your content is ready. Only real, saved work and exhibition records will be shown.", "내용을 확인한 뒤 프로필에서 공개해 주세요. 저장한 실제 작품과 전시 기록만 표시됩니다.")}</p>}</section></div><section className="gallery-unlock-panel"><div className="gallery-unlock-heading"><div><MetaLine>{tx(locale, "VIRTUAL GALLERY / FEATURE PATH", "버츄얼 갤러리 / 기능 해금")}</MetaLine><h2>{tx(locale, "Build the exhibition from your real archive.", "실제 작가 기록으로 전시 공간을 열어요.")}</h2></div><span>{roomTwoUnlocked ? <Check size={17}/> : <LockKeyhole size={16}/>}</span></div><p>{roomTwoUnlocked ? tx(locale, "승인된 U.A.U 아티스트에게 2개 방과 사각 집중 조명 구성이 열렸어요.", "승인된 U.A.U 아티스트에게 2개 방과 사각 집중 조명 구성이 열렸어요.") : tx(locale, "U.A.U 아티스트 승인과 기본 프로필·대표작 3점 등록을 마치면 2번째 방과 사각 집중 조명을 이용할 수 있어요.", "U.A.U 아티스트 승인과 기본 프로필·대표작 3점 등록을 마치면 2번째 방과 사각 집중 조명을 이용할 수 있어요.")}</p><div className="gallery-feature-list"><span className={verifiedArtist ? "is-ready" : ""}>{verifiedArtist ? <Check size={14}/> : <LockKeyhole size={14}/>} {tx(locale, "U.A.U Approved Artist", "U.A.U 승인 아티스트")}</span><span className={readiness.foundationComplete ? "is-ready" : ""}>{readiness.foundationComplete ? <Check size={14}/> : <LockKeyhole size={14}/>} {tx(locale, `Profile & selected works ${readiness.foundationProgress}%`, `프로필·대표 작품 ${readiness.foundationProgress}%`)}</span><span className={roomTwoUnlocked ? "is-ready" : ""}>{roomTwoUnlocked ? <Check size={14}/> : <LockKeyhole size={14}/>} {tx(locale, "Room 02 + square focused beam", "2번째 방 + 사각 집중 조명")}</span></div><div className="gallery-unlock-actions"><Link className="text-link" href="/dashboard/progress"><Sparkles size={14}/>{tx(locale, "View all unlocks", "전체 해금 조건 보기")} <ArrowUpRight size={14}/></Link>{localPrototypeAvailable && <a className="text-link" href="http://127.0.0.1:5174/" target="_blank" rel="noreferrer">{tx(locale, "Open the local 3D prototype (separate sample data)", "로컬 3D 갤러리 시제품 열기 · 별도 샘플 데이터")} <ArrowUpRight size={14}/></a>}</div></section></section></div></main>;
}
