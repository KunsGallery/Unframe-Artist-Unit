import type { ArtistSiteAccent, ArtistSiteSection, PublicProfile } from "../profile";

export const defaultArtistSiteSections: ArtistSiteSection[] = ["works", "exhibitions", "cv", "about"];

export const artistSiteSectionLabels: Record<ArtistSiteSection, { en: string; ko: string }> = {
  works: { en: "Artworks", ko: "작품" },
  exhibitions: { en: "Exhibitions", ko: "전시" },
  cv: { en: "CV", ko: "CV" },
  about: { en: "About", ko: "소개" },
};

export const artistSiteAccentLabels: Record<ArtistSiteAccent, { en: string; ko: string }> = {
  blue: { en: "U.A.U blue", ko: "U.A.U 블루" },
  ink: { en: "Ink", ko: "잉크" },
  clay: { en: "Clay", ko: "클레이" },
};

export function normalizeArtistSiteSections(value: unknown): ArtistSiteSection[] {
  if (!Array.isArray(value)) return [...defaultArtistSiteSections];
  const sections = value.filter((section): section is ArtistSiteSection =>
    section === "works" || section === "exhibitions" || section === "cv" || section === "about",
  );
  return sections.length ? Array.from(new Set(sections)) : [...defaultArtistSiteSections];
}

export function getArtistSiteSections(profile: Pick<PublicProfile, "siteSections">) {
  return normalizeArtistSiteSections(profile.siteSections);
}
