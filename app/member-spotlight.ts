// Home Member Spotlight: a paid benefit. Every active member gets the same
// turn because the order follows the 10:00 / 18:00 KST window seed.
import { orderSlugs } from "./artist-order";
import { activeSealTier } from "./membership-seal";
import type { ArtistSiteWork, PublicProfile } from "./profile";

export type SpotlightItem = { profile: PublicProfile; work: ArtistSiteWork };

export function pickSpotlight(profiles: PublicProfile[], seed: string, now = new Date(), max = 4): SpotlightItem[] {
  const eligible = new Map<string, SpotlightItem>();
  for (const profile of profiles) {
    if (!profile.published || profile.isDemonstration || !activeSealTier(profile.membership, now)) continue;
    // Members without a work image are skipped rather than shown as an empty card.
    const work = profile.siteWorks?.find((item) => item.id && item.title && (item.displayImageUrl || item.imageUrl));
    if (work) eligible.set(profile.slug, { profile, work });
  }
  return orderSlugs(Array.from(eligible.keys()), seed).slice(0, max).map((slug) => eligible.get(slug)!);
}
