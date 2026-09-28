import type { ArtistSiteExhibition } from "../profile";

export const artistCvCategories = ["solo", "group", "art-fair", "award"] as const;
export type ArtistCvCategory = (typeof artistCvCategories)[number];

export const artistCvCategoryLabels: Record<ArtistCvCategory, { en: string; ko: string }> = {
  solo: { en: "Solo Exhibitions", ko: "개인전" },
  group: { en: "Group Exhibitions", ko: "단체전" },
  "art-fair": { en: "Art Fairs", ko: "아트페어" },
  award: { en: "Awards", ko: "수상 내역" },
};

export function artistCvDate(entry: ArtistSiteExhibition) {
  return entry.eventDate || (entry.year ? `${entry.year}-01-01` : "");
}

export function sortArtistCvEntries(entries: ArtistSiteExhibition[]) {
  return [...entries].sort((a, b) => artistCvDate(b).localeCompare(artistCvDate(a)) || a.title.localeCompare(b.title));
}

export function safeExternalUrl(value?: string) {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function formatArtistCvDate(entry: ArtistSiteExhibition) {
  if (entry.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(entry.eventDate)) return entry.eventDate.replaceAll("-", ".");
  return entry.year || "";
}
