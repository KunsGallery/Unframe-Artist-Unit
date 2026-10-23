import type { ArtistMembership, ArtistSiteWork, UauUserProfile } from "./profile";

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

// Name, practice, location and a 40-character bio: shared by growth and the start checklist.
function artistBasics(profile: UauUserProfile | null | undefined) {
  return [Boolean((profile?.artistName || profile?.displayName)?.trim()), Boolean(profile?.practice?.trim()), Boolean(profile?.basedInCity?.trim() && profile?.country?.trim()), Boolean(profile?.bio?.trim() && profile.bio.trim().length >= 40)];
}

export function getArtistProgress(profile: UauUserProfile | null | undefined, events: ArtistProgressEvent[] = []) {
  const works = completeWorks(profile?.siteWorks);
  const exhibitionCount = (profile?.siteExhibitions || []).filter((item) => (!item.category || ["solo", "group", "art-fair"].includes(item.category)) && item.title?.trim() && item.venue?.trim() && (item.eventDate?.trim() || item.year?.trim())).length;
  const meaningfulEvents = events.filter((event) => ["like", "save", "share", "follow"].includes(event.action || "") && (event.action !== "save" || event.active !== false));
  const uniqueInteractions = new Set(meaningfulEvents.map((event) => `${event.targetType || ""}:${event.targetId || ""}`)).size;
  const basics = artistBasics(profile);
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
    { id: "portfolio-pdf", title: "포트폴리오 PDF 내보내기", detail: "작가 정보, CV, 대표작 3점과 전시 기록 1개", unlocked: foundationComplete && cvComplete, progress: foundations + (cvComplete ? 1 : 0), target: 6, kind: "tool" },
    { id: "editorial-spotlight", title: "Editorial Spotlight 후보", detail: "최근 아카이브·작가 노트 업데이트 후 편집팀 검토", unlocked: foundationComplete && cvComplete && archiveCount >= 2, progress: Math.min(archiveCount, 2), target: 2, kind: "opportunity" },
    { id: "offline-showcase", title: "오프라인 디지털 사이니지 후보", detail: "프로필 완성 및 공개 동의 후 프로그램별 큐레이션", unlocked: foundationComplete && profile?.sitePublished === true, progress: foundations + (profile?.sitePublished ? 1 : 0), target: 6, kind: "opportunity" },
    { id: "annual-archive-book", title: "연간 실물 아카이브 북 편집 검토 후보", detail: "프로필·CV·대표작과 과정 기록을 완성하면, 제작 시 편집팀 검토 후보가 됩니다. 최종 수록은 별도 선정과 동의가 필요합니다.", unlocked: foundationComplete && cvComplete && archiveCount >= 2, progress: Math.min(archiveCount, 2), target: 2, kind: "opportunity" },
  ];
  return { milestones, foundationComplete, foundationProgress: Math.round(foundations / 5 * 100), completeWorkCount: works.length, exhibitionCount, interactionCount: uniqueInteractions, archiveCount };
}


export type StartChecklistItem = { id: "basics" | "works" | "inquiries" | "publish"; done: boolean };

// First steps shown on the dashboard overview until the artist page is ready.
export function getStartChecklist(profile: UauUserProfile | null | undefined) {
  const items: StartChecklistItem[] = [
    { id: "basics", done: artistBasics(profile).every(Boolean) },
    { id: "works", done: completeWorks(profile?.siteWorks).length >= 3 },
    { id: "inquiries", done: profile?.collaborationOpen === true },
    { id: "publish", done: profile?.sitePublished === true },
  ];
  const doneCount = items.filter((item) => item.done).length;
  return { items, doneCount, total: items.length, complete: doneCount === items.length };
}

export type ReviewState = "none" | "preparing" | "in-review" | "approved" | "on-hold";

// Where the artist's U.A.U review stands, and what is still missing before
// reviewers have enough to look at. Publishing never waits on this.
export function getReviewStatus(application: Pick<ArtistMembership, "applicationStatus"> | null | undefined, profile: UauUserProfile | null | undefined) {
  const missing = getStartChecklist(profile).items.filter((item) => (item.id === "basics" || item.id === "works") && !item.done).map((item) => item.id);
  const artistId = profile?.uauArtistId;
  if (profile?.verificationStatus === "approved" || application?.applicationStatus === "approved") return { state: "approved" as ReviewState, missing: [], artistId };
  if (!application) return { state: "none" as ReviewState, missing, artistId };
  if (application.applicationStatus === "rejected" || profile?.verificationStatus === "rejected") return { state: "on-hold" as ReviewState, missing, artistId };
  return { state: (missing.length ? "preparing" : "in-review") as ReviewState, missing, artistId };
}

// English copy for the growth milestones; the Korean source lives in getArtistProgress.
export const milestoneCopyEn: Record<string, { title: string; detail: string }> = {
  "gallery-room-two": { title: "Second virtual gallery room", detail: "Approved u.a.u artist, plus an artist introduction and three selected works" },
  "square-beam": { title: "Square spotlight", detail: "Approved u.a.u artist, plus an artist introduction and three selected works" },
  "moving-cover": { title: "Moving cover slot", detail: "Organise your CV and exhibition records to request a video cover" },
  "artist-audio": { title: "Artist audio guide", detail: "Write an artist statement of 500+ characters" },
  "studio-archive": { title: "Publish Studio Archive", detail: "One process note and your first connection with a peer" },
  inspiration: { title: "Influence & Inspiration", detail: "Three meaningful exchanges with peers' work" },
  "portfolio-pdf": { title: "Export portfolio PDF", detail: "Artist details, CV, three selected works and one exhibition record" },
  "editorial-spotlight": { title: "Editorial Spotlight candidate", detail: "Reviewed by the editors after a recent archive or statement update" },
  "offline-showcase": { title: "Offline digital signage candidate", detail: "Curated per programme once your profile is complete and you consent to showing it" },
  "annual-archive-book": { title: "Annual printed archive book candidate", detail: "Complete your profile, CV, selected works and process notes to be considered by the editors. Final inclusion needs separate selection and consent." },
};
