import type { ArtistSiteWork, UauUserProfile } from "./profile";

export type ArtistProgressEvent = {
  action?: string;
  targetType?: string;
  targetId?: string;
  active?: boolean;
};

export type ProgressMilestone = {
  id: string;
  title: string;
  detail: string;
  unlocked: boolean;
  progress: number;
  target: number;
  kind: "tool" | "opportunity";
};

function completeWorks(works: ArtistSiteWork[] = []) {
  return works.filter((work) => Boolean(work.title?.trim() && work.imageUrl?.trim()));
}

export function getArtistProgress(profile: UauUserProfile | null | undefined, events: ArtistProgressEvent[] = []) {
  const works = completeWorks(profile?.siteWorks);
  const exhibitionCount = (profile?.siteExhibitions || []).filter((item) => (!item.category || ["solo", "group", "art-fair"].includes(item.category)) && item.title?.trim() && item.venue?.trim() && (item.eventDate?.trim() || item.year?.trim())).length;
  const meaningfulEvents = events.filter((event) => ["like", "save", "share", "follow"].includes(event.action || "") && (event.action !== "save" || event.active !== false));
  const uniqueInteractions = new Set(meaningfulEvents.map((event) => `${event.targetType || ""}:${event.targetId || ""}`)).size;
  const basics = [Boolean((profile?.artistName || profile?.displayName)?.trim()), Boolean(profile?.practice?.trim()), Boolean(profile?.basedInCity?.trim() && profile?.country?.trim()), Boolean(profile?.bio?.trim() && profile.bio.trim().length >= 40)];
  const foundations = basics.filter(Boolean).length + (works.length >= 3 ? 1 : 0);
  const foundationComplete = foundations === 5;
  const cvComplete = (profile?.siteExhibitions || []).some((item) => Boolean(item.category && item.title?.trim() && item.venue?.trim() && item.eventDate?.trim()));
  const archiveCount = (profile?.siteArchive || []).filter((entry) => entry.title?.trim() && entry.note?.trim()).length;
  const socialReady = uniqueInteractions >= 3;
  const milestones: ProgressMilestone[] = [
    { id: "gallery-room-two", title: "가상 갤러리 2번째 방", detail: "U.A.U 승인 아티스트 + 작가 소개와 대표작 3점 완성", unlocked: profile?.verificationStatus === "approved" && foundationComplete, progress: Math.min(foundations, 5), target: 5, kind: "tool" },
    { id: "square-beam", title: "사각 집중 조명", detail: "U.A.U 승인 아티스트 + 작가 소개와 대표작 3점 완성", unlocked: profile?.verificationStatus === "approved" && foundationComplete, progress: Math.min(foundations, 5), target: 5, kind: "tool" },
    { id: "moving-cover", title: "무빙 커버 슬롯", detail: "활동 이력과 전시 기록을 정리하면 영상 커버를 신청할 수 있어요", unlocked: cvComplete && exhibitionCount >= 2, progress: Math.min(exhibitionCount, 2), target: 2, kind: "tool" },
    { id: "artist-audio", title: "작가 오디오 도슨트", detail: "작가 노트 500자 이상 작성", unlocked: (profile?.artistStatement?.trim().length || 0) >= 500, progress: Math.min(profile?.artistStatement?.trim().length || 0, 500), target: 500, kind: "tool" },
    { id: "studio-archive", title: "Studio Archive 공개", detail: "작업 과정 기록 1개와 동료와의 첫 연결 활동", unlocked: archiveCount >= 1 && uniqueInteractions >= 1, progress: Math.min(archiveCount, 1) + (uniqueInteractions >= 1 ? 1 : 0), target: 2, kind: "tool" },
    { id: "inspiration", title: "Influence & Inspiration", detail: "동료 작가의 작업과 의미 있는 교류 3회", unlocked: uniqueInteractions >= 3, progress: Math.min(uniqueInteractions, 3), target: 3, kind: "tool" },
    { id: "contact-form", title: "목적별 작품·협업 문의", detail: "프로필·대표작·활동 이력을 완성해 주세요", unlocked: foundationComplete && cvComplete, progress: foundations + (cvComplete ? 1 : 0), target: 6, kind: "tool" },
    { id: "portfolio-pdf", title: "포트폴리오 PDF 내보내기", detail: "작가 정보, CV, 대표작 3점과 전시 기록 1개", unlocked: foundationComplete && cvComplete, progress: foundations + (cvComplete ? 1 : 0), target: 6, kind: "tool" },
    { id: "editorial-spotlight", title: "Editorial Spotlight 후보", detail: "최근 아카이브·작가 노트 업데이트 후 편집팀 검토", unlocked: foundationComplete && cvComplete && archiveCount >= 2, progress: Math.min(archiveCount, 2), target: 2, kind: "opportunity" },
    { id: "offline-showcase", title: "오프라인 디지털 사이니지 후보", detail: "프로필 완성 및 공개 동의 후 프로그램별 큐레이션", unlocked: foundationComplete && profile?.sitePublished === true, progress: foundations + (profile?.sitePublished ? 1 : 0), target: 6, kind: "opportunity" },
    { id: "annual-archive-book", title: "연간 실물 아카이브 북 편집 검토 후보", detail: "프로필·CV·대표작과 과정 기록을 완성하면, 제작 시 편집팀 검토 후보가 됩니다. 최종 수록은 별도 선정과 동의가 필요합니다.", unlocked: foundationComplete && cvComplete && archiveCount >= 2, progress: Math.min(archiveCount, 2), target: 2, kind: "opportunity" },
  ];
  return { milestones, foundationComplete, foundationProgress: Math.round(foundations / 5 * 100), completeWorkCount: works.length, exhibitionCount, interactionCount: uniqueInteractions, archiveCount };
}
