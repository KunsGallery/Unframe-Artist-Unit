import { readPublicDocument } from "../../server/public-firestore";
import { ogSize, renderOgCard } from "../../server/og-card";
import { siteUrl } from "../../site-url";

export const alt = "u.a.u artist page";
export const size = ogSize;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function ArtistOpenGraphImage({ params }: { params: { slug: string } }) {
  const profile = await readPublicDocument("public_profiles", params.slug);
  const host = new URL(siteUrl).host;
  if (!profile) return renderOgCard({ label: "u.a.u / UNFRAME ARTIST UNIT", title: "UNFRAME ARTIST UNIT", detail: "A gallery that stays connected.", footer: host });
  const works = (profile.siteWorks as Array<Record<string, unknown>> | undefined) || [];
  return renderOgCard({
    label: "u.a.u / UNFRAME ARTIST UNIT",
    title: String(profile.artistName || profile.displayName || "UNFRAME ARTIST UNIT"),
    detail: [profile.practice, [profile.basedInCity, profile.country].filter(Boolean).join(", ")].filter(Boolean).join(" · "),
    footer: `${host}/artist/${params.slug}`,
    imageCandidates: [profile.siteCoverImageUrl, ...works.filter((work) => work.title).map((work) => work.imageUrl), profile.profileImageUrl],
  });
}
