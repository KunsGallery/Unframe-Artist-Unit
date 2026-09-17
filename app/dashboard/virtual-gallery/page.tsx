"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ImagePlus, LockKeyhole, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { ArtImage, DemoNotice, MetaLine } from "../../components";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { useArtistMembership, useMembership, useUserProfile } from "../../profile";
import { DashboardSidebar } from "../dashboard-sidebar";

export default function VirtualGalleryPage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const { artist, loading: artistLoading } = useArtistMembership(user?.uid);
  const { membership } = useMembership(user?.uid);
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, router, user]);

  if (authLoading || !user || profileLoading || artistLoading) return <main className="dashboard-page"><DemoNotice /><div className="auth-guard"><RefreshCw className="spin" size={18} /> {tx(locale, "Preparing your space…", "공간을 준비하는 중…")}</div></main>;

  const isArtist = profile?.accountType === "artist";
  const isVerified = (artist?.verified === true && artist.applicationStatus === "approved") || membership?.active === true || membership?.status === "active";

  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="space" /><section className="dashboard-main space-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / YOUR SPACE", "MY U.A.U / 나의 공간")}</MetaLine><h1>{tx(locale, <>Give your work<br /><em>a room.</em></>, <>당신의 작업에<br /><em>방을 주세요.</em></>)}</h1></div><span className="space-status"><i /> {isVerified ? tx(locale, "Virtual gallery unlocked", "버츄얼 갤러리 사용 가능") : tx(locale, "Preview mode", "프리뷰 모드")}</span></div><div className="space-grid"><section className="space-tool"><div className="space-tool-heading"><div><MetaLine>{tx(locale, "01 / AI SPATIAL PREVIEW", "01 / AI 공간 프리뷰")}</MetaLine><h2>{tx(locale, "See the work in a possible place.", "작품이 놓일 수 있는 공간을 미리 보세요.")}</h2></div><Sparkles size={20} /></div><p>{tx(locale, "Every artist account can explore how a work might live in a room. Describe the atmosphere, wall, light, or distance you are looking for.", "모든 아티스트 계정은 작품이 공간에 놓이는 방식을 탐색할 수 있습니다. 원하는 분위기와 벽, 빛, 거리를 설명해보세요.")}</p><label>{tx(locale, "Describe the room", "공간을 설명하세요")}<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={tx(locale, "A quiet concrete room, late afternoon light…", "늦은 오후 빛이 머무는 조용한 콘크리트 공간…")} rows={3} /></label><button className="button button-blue" type="button" onClick={() => setPreviewReady(true)} disabled={!isArtist || !prompt.trim()}><ImagePlus size={15} /> {tx(locale, "Compose a preview", "프리뷰 만들기")} <ArrowUpRight size={15} /></button>{!isArtist && <small className="space-hint">{tx(locale, "Choose Artist in your profile to open the spatial preview.", "프로필에서 Artist를 선택하면 공간 프리뷰를 사용할 수 있습니다.")}</small>}</section><section className={`space-canvas ${previewReady ? "is-ready" : ""}`}><div className="canvas-label"><span>{previewReady ? tx(locale, "GENERATED SPATIAL STUDY", "생성된 공간 스터디") : tx(locale, "SPATIAL STUDY / 01", "공간 스터디 / 01")}</span><span>{previewReady ? "AI / DRAFT" : "u.a.u"}</span></div><div className="room-wall"><div className="room-frame"><ArtImage label={tx(locale, "Spatial preview based on the selected work", "선택한 작품을 공간에 배치한 프리뷰")} /></div><span className="room-shadow" /><span className="room-caption">{previewReady ? (prompt || "A room for the work") : tx(locale, "Your work, in context.", "맥락 속의 당신의 작업.")}</span></div><div className="canvas-footer"><span>{tx(locale, "Base work", "기준 작품")}<strong>The Distance Between</strong></span><span>{tx(locale, "Status", "상태")}<strong>{previewReady ? tx(locale, "Draft ready", "초안 준비됨") : tx(locale, "Waiting for a direction", "방향을 기다리는 중")}</strong></span></div></section><section className={`space-tool gallery-access ${isVerified ? "is-open" : "is-locked"}`}><div className="space-tool-heading"><div><MetaLine>{tx(locale, "02 / INDIVIDUAL VIRTUAL GALLERY", "02 / 개별 버츄얼 갤러리")}</MetaLine><h2>{isVerified ? tx(locale, "Your small gallery is open.", "당신의 작은 갤러리가 열렸습니다.") : tx(locale, "A room you earn through trust.", "신뢰를 통해 열리는 방입니다.")}</h2></div>{isVerified ? <Sparkles size={20} /> : <LockKeyhole size={20} />}</div><p>{isVerified ? tx(locale, "Arrange works, write your own notes, and leave a door open for the people who find your practice.", "작품을 배치하고, 직접 노트를 쓰고, 당신의 실천을 발견한 사람을 위한 문을 열어두세요.") : tx(locale, "Artist membership or UNFRAME verification opens an individual virtual gallery with a public artist page and editable sections.", "아티스트 멤버십 가입 또는 UNFRAME 인증을 통해 공개 아티스트 페이지와 편집 가능한 섹션을 갖춘 개별 버츄얼 갤러리를 열 수 있습니다.")}</p>{isVerified ? <a className="text-link" href="/artists">{tx(locale, "Open public artist page", "공개 아티스트 페이지 열기")} <ArrowUpRight size={14} /></a> : <a className="text-link" href="/join">{tx(locale, "Learn about artist membership", "아티스트 멤버십 알아보기")} <ArrowUpRight size={14} /></a>}</section></div><div className="artist-page-note"><MetaLine>{tx(locale, "THE PUBLIC PAGE / ARTSY × ARTSPOON, IN A u.a.u WAY", "공개 아티스트 페이지 / ARTSY × ARTSPOON, u.a.u의 방식으로")}</MetaLine><p>{tx(locale, "A public artist page will gather your practice, selected works, exhibitions, connections, and the notes that explain what keeps moving.", "공개 아티스트 페이지에는 당신의 실천, 대표 작품, 전시, 연결, 그리고 계속 움직이는 것을 설명하는 노트가 모입니다.")}</p></div></section></div></main>;
}
