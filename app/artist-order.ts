// Fair artist ordering: the directory reshuffles three times a day (00:00, 08:00
// and 16:00 Korea time) and stays fixed in between. Kept free of imports for tests.

const windowMs = 8 * 60 * 60 * 1000;
const koreaOffsetMs = 9 * 60 * 60 * 1000;

export function orderWindow(now: Date) {
  const index = Math.floor((now.getTime() + koreaOffsetMs) / windowMs);
  return { seed: `w${index}`, nextChange: new Date((index + 1) * windowMs - koreaOffsetMs) };
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
