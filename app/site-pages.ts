export type SitePageId = "home" | "artists" | "artist-detail" | "works" | "work-detail" | "projects" | "project-detail" | "connections" | "radar" | "about" | "join";

export type SitePageDefinition = {
  id: SitePageId;
  label: string;
  labelKo: string;
  previewPath: string;
  description: string;
  descriptionKo: string;
};

export const sitePages: SitePageDefinition[] = [
  { id: "home", label: "Home", labelKo: "홈", previewPath: "/", description: "The first room and the main public proposition.", descriptionKo: "첫 번째 방과 공개 홈페이지의 핵심 제안입니다." },
  { id: "artists", label: "Artists index", labelKo: "아티스트 목록", previewPath: "/artists", description: "Directory, search, and discovery rhythm.", descriptionKo: "디렉터리와 검색, 발견의 리듬입니다." },
  { id: "artist-detail", label: "Artist detail", labelKo: "작가 상세", previewPath: "/artist/seo-yujin", description: "The artist profile and work archive.", descriptionKo: "작가 프로필과 작품 아카이브입니다." },
  { id: "works", label: "Works index", labelKo: "작품 목록", previewPath: "/works", description: "Artwork discovery and archive density.", descriptionKo: "작품 발견과 아카이브의 밀도입니다." },
  { id: "work-detail", label: "Work detail", labelKo: "작품 상세", previewPath: "/works/the-distance-between", description: "A single work and its context.", descriptionKo: "하나의 작품과 그 맥락입니다." },
  { id: "projects", label: "Projects index", labelKo: "프로젝트 목록", previewPath: "/projects", description: "Project archive and relationship entry points.", descriptionKo: "프로젝트 아카이브와 관계의 진입점입니다." },
  { id: "project-detail", label: "Project detail", labelKo: "프로젝트 상세", previewPath: "/projects/after-the-salon", description: "Participants, timeline, and project afterlife.", descriptionKo: "참여자와 타임라인, 프로젝트의 이후입니다." },
  { id: "connections", label: "Connections", labelKo: "연결", previewPath: "/connections", description: "The visual relationship map.", descriptionKo: "시각적인 관계 지도입니다." },
  { id: "radar", label: "Radar", labelKo: "Radar", previewPath: "/radar", description: "Signals, people, and opportunities worth following.", descriptionKo: "따라가 볼 만한 신호와 사람, 기회입니다." },
  { id: "about", label: "About", labelKo: "소개", previewPath: "/about", description: "The story-scroll introduction to u.a.u.", descriptionKo: "u.a.u를 소개하는 스토리 스크롤입니다." },
  { id: "join", label: "Join", labelKo: "함께하기", previewPath: "/join", description: "Role selection and the first invitation.", descriptionKo: "역할 선택과 첫 번째 초대입니다." },
];

export const sitePageById = Object.fromEntries(sitePages.map((page) => [page.id, page])) as Record<SitePageId, SitePageDefinition>;

export function getSitePageId(pathname: string): SitePageId {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname === "/artists") return "artists";
  if (pathname.startsWith("/artist/")) return "artist-detail";
  if (pathname === "/works") return "works";
  if (pathname.startsWith("/works/")) return "work-detail";
  if (pathname === "/projects") return "projects";
  if (pathname.startsWith("/projects/")) return "project-detail";
  if (pathname === "/connections") return "connections";
  if (pathname === "/radar") return "radar";
  if (pathname === "/about") return "about";
  if (pathname === "/join") return "join";
  return "home";
}
