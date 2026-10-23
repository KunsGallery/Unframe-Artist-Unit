import { emptyMovingBanner, type MovingBannerConfig } from "../../moving-banner";
import { defaultArtistSiteSections } from "../../artist/site-config";
import type { ArtistInspiration, ArtistSiteAccent, ArtistSiteArchiveEntry, ArtistSiteExhibition, ArtistSiteSection, ArtistSiteTemplate, ArtistSiteWork, UauAccountType } from "../../profile";

// Editor form state shared by the profile editor and its builder sections.
export type ProfileForm = {
  displayName: string;
  artistName: string;
  accountType: UauAccountType;
  basedInCity: string;
  country: string;
  practice: string;
  bio: string;
  artistStatement: string;
  artistCv: string;
  artistAudioUrl: string;
  siteArchive: ArtistSiteArchiveEntry[];
  siteInspirations: ArtistInspiration[];
  collaborationOpen: boolean;
  contactPurposes: string[];
  websiteUrl: string;
  profileImageUrl: string;
  siteCoverImageUrl: string;
  publicSlug: string;
  siteTemplate: ArtistSiteTemplate;
  siteSections: ArtistSiteSection[];
  siteAccent: ArtistSiteAccent;
  movingBanner: MovingBannerConfig;
  siteWorks: ArtistSiteWork[];
  siteExhibitions: ArtistSiteExhibition[];
  sitePublished: boolean;
  showExhibitions: boolean;
  showCV: boolean;
  showAbout: boolean;
};

export const emptyForm: ProfileForm = {
  displayName: "",
  artistName: "",
  accountType: "artist",
  basedInCity: "",
  country: "",
  practice: "",
  bio: "",
  artistStatement: "",
  artistCv: "",
  artistAudioUrl: "",
  siteArchive: [],
  siteInspirations: [],
  // Profiles that were never saved start with inquiries open.
  collaborationOpen: true,
  contactPurposes: [],
  websiteUrl: "",
  profileImageUrl: "",
  siteCoverImageUrl: "",
  publicSlug: "",
  siteTemplate: "editorial",
  siteSections: [...defaultArtistSiteSections],
  siteAccent: "blue",
  movingBanner: emptyMovingBanner,
  siteWorks: [],
  siteExhibitions: [],
  sitePublished: false,
  showExhibitions: true,
  showCV: true,
  showAbout: true,
};

export type SetProfileField = <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => void;

const fiftyChars = 50;

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, fiftyChars);
}

export function getPublicSlug(value: string, uid: string) {
  return toSlug(value) || `artist-${uid.slice(0, 8).toLowerCase()}`;
}
