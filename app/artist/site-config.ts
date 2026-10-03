import type { ArtistSiteAccent, ArtistSiteSection, PublicProfile } from "../profile";

// Lead with the work, then the artist's own words, before formal records.
export const defaultArtistSiteSections: ArtistSiteSection[] = ["works", "about", "exhibitions", "cv", "studioArchive", "inspiration"];
export const commonArtistSiteSections: ArtistSiteSection[] = ["works", "about", "cv"];
export const optionalArtistSiteSections: ArtistSiteSection[] = ["exhibitions", "studioArchive", "inspiration"];

export const artistSiteSectionLabels: Record<ArtistSiteSection, { en: string; ko: string }> = {
  works: { en: "Artworks", ko: "작품" },
  exhibitions: { en: "Exhibitions", ko: "전시" },
  cv: { en: "CV", ko: "CV" },
  about: { en: "About", ko: "소개" },
  studioArchive: { en: "Studio Archive", ko: "작업 아카이브" },
  inspiration: { en: "Influences", ko: "영감의 서재" },
};

export const artistSiteAccentLabels: Record<ArtistSiteAccent, { en: string; ko: string }> = {
  blue: { en: "U.A.U blue", ko: "U.A.U 블루" },
  ink: { en: "Ink", ko: "잉크" },
  clay: { en: "Clay", ko: "클레이" },
};

export function normalizeArtistSiteSections(value: unknown): ArtistSiteSection[] {
  if (!Array.isArray(value)) return [...defaultArtistSiteSections];
  const sections = value.filter((section): section is ArtistSiteSection =>
    section === "works" || section === "exhibitions" || section === "cv" || section === "about" || section === "studioArchive" || section === "inspiration",
  );
  return Array.from(new Set([...sections, ...commonArtistSiteSections]));
}

export function getArtistSiteSections(profile: PublicProfile) {
  return normalizeArtistSiteSections(profile.siteSections).filter((section) => {
    if (section === "exhibitions") return Boolean(profile.siteExhibitions?.some((entry) => (!entry.category || entry.category === "solo" || entry.category === "group") && entry.eventDate && entry.eventDate >= new Date().toISOString().slice(0, 10)));
    if (section === "cv") return Boolean(profile.siteExhibitions?.length || profile.artistCv?.trim());
    if (section === "studioArchive") return Boolean(profile.siteArchive?.length);
    if (section === "inspiration") return Boolean(profile.siteInspirations?.length);
    if (section === "about") return Boolean(profile.bio?.trim() || profile.artistStatement?.trim());
    return true;
  });
}
