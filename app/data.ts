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
  { slug: "after-the-salon", title: "After the Salon", meta: "UNFRAME Salon 04 · 2026", description: "A conversation that kept moving after the exhibition closed.", artists: ["Seo Yujin", "Han Mira", "Yoon Doyun"], status: "In process" },
  { slug: "soft-violence", title: "Soft Violence", meta: "Research unit · 2025—26", description: "Three practices looking at how a surface can hold both care and resistance.", artists: ["Han Mira", "Maria Novak"], status: "Archive" },
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
