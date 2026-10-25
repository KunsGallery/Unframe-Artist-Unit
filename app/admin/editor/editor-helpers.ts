// Labels and helpers for the site editor.
export const adminRoles = ["super_admin", "editor"];
const sectionLabels: Record<string, { en: string; ko: string }> = {
  intro: { en: "Introduction", ko: "소개" },
  spatial: { en: "Spatial archive", ko: "공간 아카이브" },
  radar: { en: "Radar", ko: "Radar" },
  connection: { en: "Current connection", ko: "현재 연결" },
  recap: { en: "Annual recap", ko: "연간 리캡" },
  selection: { en: "Selection", ko: "셀렉션" },
  artists: { en: "Artists", ko: "아티스트" },
  works: { en: "Works", ko: "작품" },
  journal: { en: "Journal", ko: "저널" },
  faq: { en: "FAQ", ko: "FAQ" },
  join: { en: "Join", ko: "함께하기" },
  directory: { en: "Artist directory", ko: "아티스트 디렉터리" },
  filters: { en: "Filters", ko: "필터" },
  archive: { en: "Archive", ko: "아카이브" },
  list: { en: "Project list", ko: "프로젝트 목록" },
  manifesto: { en: "Moving text", ko: "흐르는 문구" },
  map: { en: "Connection map", ko: "연결 지도" },
  call: { en: "Open call", ko: "오픈 콜" },
  calendar: { en: "Calendar", ko: "캘린더" },
  opportunities: { en: "Opportunities", ko: "기회" },
  note: { en: "Editorial note", ko: "에디토리얼 노트" },
  story: { en: "Story", ko: "스토리" },
  options: { en: "Entry options", ko: "참여 방법" },
  context: { en: "Context", ko: "맥락" },
  participants: { en: "Participants", ko: "참여자" },
  timeline: { en: "Timeline", ko: "타임라인" },
  work: { en: "Work", ko: "작품" },
};

export function getSectionLabel(sectionId: string | null, locale: "en" | "ko") {
  if (!sectionId) return locale === "ko" ? "전체 페이지" : "Whole page";
  return sectionLabels[sectionId]?.[locale] || sectionId.replace(/[-_]/g, " ");
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
