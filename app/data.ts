// Public archive data is sourced from Firestore. These empty collections
// intentionally prevent demo records from appearing in production pages.

export type Artist = {
  slug: string;
  name: string;
  city: string;
  country: string;
  discipline: string;
  stage: string;
  tags: string[];
  initials: string;
  tone: string;
  bio: string;
  verified: boolean;
  connectedThrough: string;
  connections: number;
  projectCount: number;
  since: string;
};

export type Artwork = {
  id: string;
  title: string;
  artist: string;
  artistSlug: string;
  year: string;
  medium: string;
  status: string;
  price: string;
  imagePosition: string;
  accent: string;
};

export type UauOpportunity = {
  slug: string;
  title: string;
  organiser: string;
  kind: "Open call" | "Residency" | "Collaboration";
  location: string;
  deadline: string;
  description: string;
  tags: string[];
};

export type UauEvent = {
  slug: string;
  title: string;
  kind: "Exhibition" | "Salon" | "Talk";
  venue: string;
  city: string;
  date: string;
  status: "Open" | "Opening soon" | "Closing soon";
  description: string;
  participants: string[];
};

export type UauThread = {
  id: string;
  title: string;
  type: "Project room" | "Research room" | "Studio note";
  updated: string;
  members: string[];
  description: string;
  visibility: "Private" | "By invite" | "Open";
};

export const artists: Artist[] = [];
export const artworks: Artwork[] = [];
export const projects: Array<{
  slug: string;
  title: string;
  meta: string;
  description: string;
  artists: string[];
  participantSlugs: string[];
  status: string;
}> = [];
export const journal: Array<{ category: string; title: string; date: string; author: string }> = [];
export const opportunities: UauOpportunity[] = [];
export const events: UauEvent[] = [];
export const threads: UauThread[] = [];

export const annualRecap: {
  title: string;
  subtitle: string;
  intro: string;
  stats: Array<[string, string]>;
  awards: Array<[string, string, string]>;
} = {
  title: "",
  subtitle: "",
  intro: "",
  stats: [],
  awards: [],
};
