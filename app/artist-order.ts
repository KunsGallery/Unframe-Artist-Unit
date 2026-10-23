// Fair artist ordering: the directory reshuffles twice a day, at 10:00 and
// 18:00 Korea time, and stays fixed in between (the evening order runs
// overnight). Kept free of imports for tests.

const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;
const koreaOffsetMs = 9 * hourMs;
const morningChangeMs = 10 * hourMs;
const dayWindowMs = 8 * hourMs; // 10:00–18:00

export function orderWindow(now: Date) {
  // Count days from 10:00 Korea time so each day holds one day and one evening window.
  const sinceMorning = now.getTime() + koreaOffsetMs - morningChangeMs;
  const day = Math.floor(sinceMorning / dayMs);
  const dayStart = day * dayMs - koreaOffsetMs + morningChangeMs;
  const isDay = sinceMorning - day * dayMs < dayWindowMs;
  return { seed: `d${day}${isDay ? "a" : "b"}`, nextChange: new Date(dayStart + (isDay ? dayWindowMs : dayMs)) };
}

// FNV-1a: a stable per-artist rank, so a newly published artist slots in
// without moving everyone else.
function rank(seed: string, slug: string) {
  let hash = 0x811c9dc5;
  for (const char of `${seed}:${slug}`) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function orderSlugs(slugs: string[], seed: string) {
  return [...slugs].sort((a, b) => rank(seed, a) - rank(seed, b) || a.localeCompare(b));
}
