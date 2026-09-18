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

export const artists: Artist[] = [
  { slug: "seo-yujin", name: "Seo Yujin", city: "Seoul", country: "Korea", discipline: "Painting", stage: "Emerging", tags: ["Body", "Memory", "Color"], initials: "SY", tone: "tone-blue", bio: "Seo Yujin works with the body as a soft archive — painting the distance between what is held and what can be said.", verified: true, connectedThrough: "UNFRAME Salon 04", connections: 12, projectCount: 3, since: "2026" },
  { slug: "han-mira", name: "Han Mira", city: "Berlin", country: "Germany", discipline: "Textile / Installation", stage: "Mid-career", tags: ["Material", "Ritual", "Space"], initials: "HM", tone: "tone-ink", bio: "Han Mira builds quiet architectures from textile, repetition, and the remembered gestures of a room.", verified: true, connectedThrough: "UNFRAME Salon 04", connections: 9, projectCount: 2, since: "2026" },
  { slug: "yoon-doyun", name: "Yoon Doyun", city: "Busan", country: "Korea", discipline: "Sound", stage: "Emerging", tags: ["Time", "Archive", "Sound"], initials: "YD", tone: "tone-clay", bio: "Yoon Doyun composes with field recordings, fragments, and the acoustic residue of places in transition.", verified: true, connectedThrough: "After the Salon", connections: 7, projectCount: 2, since: "2026" },
  { slug: "maria-novak", name: "Maria Novak", city: "Prague", country: "Czechia", discipline: "Sculpture", stage: "Emerging", tags: ["Material", "Body", "Narrative"], initials: "MN", tone: "tone-sand", bio: "Maria Novak makes small monuments for the intimate and unresolved, balancing weight with a sense of play.", verified: true, connectedThrough: "Soft Violence", connections: 6, projectCount: 1, since: "2025" },
  { slug: "kento-arai", name: "Kento Arai", city: "Tokyo", country: "Japan", discipline: "Moving image", stage: "Mid-career", tags: ["Urban", "Memory", "Technology"], initials: "KA", tone: "tone-blue", bio: "Kento Arai traces how cities remember through moving image, light, and the intervals between public and private.", verified: true, connectedThrough: "UNFRAME Scout", connections: 5, projectCount: 1, since: "2026" },
  { slug: "lee-eunchae", name: "Lee Eunchae", city: "Jeju", country: "Korea", discipline: "Ceramics", stage: "Emerging", tags: ["Nature", "Material", "Delicate"], initials: "LE", tone: "tone-olive", bio: "Lee Eunchae listens to clay as a living material, making vessels that hold weather, touch, and pause.", verified: true, connectedThrough: "UNFRAME Open Call 003", connections: 4, projectCount: 1, since: "2026" },
];

export const artworks: Artwork[] = [
  { id: "the-distance-between", title: "The Distance Between", artist: "Seo Yujin", artistSlug: "seo-yujin", year: "2026", medium: "Oil and graphite on linen", status: "Available", price: "₩2,400,000", imagePosition: "center", accent: "work-blue" },
  { id: "soft-architecture-03", title: "Soft Architecture 03", artist: "Han Mira", artistSlug: "han-mira", year: "2025", medium: "Dyed cotton, thread", status: "Price on request", price: "—", imagePosition: "62% center", accent: "work-ink" },
  { id: "a-room-listening", title: "A Room Listening", artist: "Yoon Doyun", artistSlug: "yoon-doyun", year: "2026", medium: "4-channel sound installation", status: "Available", price: "$3,200", imagePosition: "28% center", accent: "work-clay" },
  { id: "small-weather", title: "Small Weather", artist: "Lee Eunchae", artistSlug: "lee-eunchae", year: "2025", medium: "Stoneware, ash glaze", status: "Available", price: "₩780,000", imagePosition: "78% center", accent: "work-sand" },
];

export const projects = [
  { slug: "after-the-salon", title: "After the Salon", meta: "UNFRAME Salon 04 · 2026", description: "A conversation that kept moving after the exhibition closed.", artists: ["Seo Yujin", "Han Mira", "Yoon Doyun"], participantSlugs: ["seo-yujin", "han-mira", "yoon-doyun"], status: "In process" },
  { slug: "soft-violence", title: "Soft Violence", meta: "Research unit · 2025—26", description: "Three practices looking at how a surface can hold both care and resistance.", artists: ["Han Mira", "Maria Novak"], participantSlugs: ["han-mira", "maria-novak"], status: "Archive" },
];

export const journal = [
  { category: "After Exhibition", title: "What remains when the room is empty?", date: "07.18.2026", author: "u.a.u editorial" },
  { category: "Studio Visit", title: "Seo Yujin keeps a record of the almost-said", date: "06.02.2026", author: "Eunji Park" },
  { category: "Artist Radar", title: "5 artists working with the spaces between", date: "05.14.2026", author: "u.a.u editorial" },
];

export const annualRecap = {
  title: "CONNECTED 2027",
  subtitle: "u.a.u annual connection recap",
  intro: "A year in which relationships moved across rooms, cities, and practices — and left something to return to.",
  stats: [
    ["48", "artists in the unit"],
    ["17", "projects in motion"],
    ["32", "new connections"],
    ["06", "cities connected"],
  ],
  awards: [
    ["Connection of the Year", "After the Salon", "A conversation that chose to continue."],
    ["Unexpected Unit", "Soft Violence", "Two materials, one patient rhythm."],
    ["Crossing Borders", "Seoul → Berlin → Busan", "Distance became part of the practice."],
  ],
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

export const opportunities: UauOpportunity[] = [
  {
    slug: "unframe-residency-2027",
    title: "UNFRAME Residency 2027",
    organiser: "UNFRAME Artist Unit",
    kind: "Residency",
    location: "Seoul · hybrid",
    deadline: "12.04.2026",
    description: "A quiet period for a practice to change direction, with room for exchange after the stay.",
    tags: ["All practices", "Exchange", "4 weeks"],
  },
  {
    slug: "material-afterlife",
    title: "Material Afterlife",
    organiser: "Glasshouse Gallery",
    kind: "Open call",
    location: "Berlin",
    deadline: "10.18.2026",
    description: "Seeking artists working with the memory, reuse, and future life of materials.",
    tags: ["Material", "Group exhibition", "EU based"],
  },
  {
    slug: "sound-in-the-room",
    title: "Sound in the Room",
    organiser: "After the Salon unit",
    kind: "Collaboration",
    location: "Busan · online",
    deadline: "Rolling",
    description: "A developing collaboration between sound, moving image, and artists who work with space.",
    tags: ["Sound", "Moving image", "Collaboration"],
  },
];

export const events: UauEvent[] = [
  {
    slug: "unframe-salon-05",
    title: "UNFRAME Salon 05",
    kind: "Salon",
    venue: "Seongsu Practice Room",
    city: "Seoul",
    date: "09.26.2026",
    status: "Opening soon",
    description: "A room for unfinished work, new questions, and the people who stay after the first conversation.",
    participants: ["Seo Yujin", "Han Mira", "Mina Choi"],
  },
  {
    slug: "soft-violence-opening",
    title: "Soft Violence",
    kind: "Exhibition",
    venue: "Kunstverein Mitte",
    city: "Berlin",
    date: "10.11.2026",
    status: "Open",
    description: "Three practices looking at how a surface can hold both care and resistance.",
    participants: ["Han Mira", "Maria Novak"],
  },
  {
    slug: "what-comes-after",
    title: "What Comes After?",
    kind: "Talk",
    venue: "u.a.u online room",
    city: "Online",
    date: "10.28.2026",
    status: "Open",
    description: "Artists, curators, and collectors talk about what an exhibition leaves behind.",
    participants: ["Yoon Doyun", "Eunji Park", "Jun Lee"],
  },
];

export const threads: UauThread[] = [
  {
    id: "after-the-salon-room",
    title: "After the Salon / working room",
    type: "Project room",
    updated: "2 hours ago",
    members: ["SY", "HM", "YD"],
    description: "Notes, sound fragments, and the next meeting after UNFRAME Salon 04.",
    visibility: "By invite",
  },
  {
    id: "body-as-archive",
    title: "Body as archive",
    type: "Research room",
    updated: "Yesterday",
    members: ["SY", "MC", "EP"],
    description: "References and questions around the body as a soft, shared record.",
    visibility: "Private",
  },
  {
    id: "small-weather-notes",
    title: "Small weather / studio notes",
    type: "Studio note",
    updated: "Sep 12",
    members: ["LE", "KA"],
    description: "A slow exchange of clay tests, city weather, and images that keep returning.",
    visibility: "Open",
  },
];
