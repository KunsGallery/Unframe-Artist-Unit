import { readPublicDocument } from "../../server/public-firestore";
import { ogSize, renderOgCard } from "../../server/og-card";
import { siteUrl } from "../../site-url";

export const alt = "u.a.u artwork";
export const size = ogSize;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function WorkOpenGraphImage({ params }: { params: { id: string } }) {
  const split = params.id.indexOf("~");
  const profile = split > 0 ? await readPublicDocument("public_profiles", params.id.slice(0, split)) : null;
  const work = ((profile?.siteWorks as Array<Record<string, unknown>> | undefined) || []).find((item) => item.id === params.id.slice(split + 1) && item.title && item.imageUrl);
  const host = new URL(siteUrl).host;
  if (!profile || !work) return renderOgCard({ label: "u.a.u / UNFRAME ARTIST UNIT", title: "UNFRAME ARTIST UNIT", detail: "A gallery that stays connected.", footer: host });
  return renderOgCard({
    label: String(profile.artistName || profile.displayName || "u.a.u"),
    title: String(work.title),
    detail: [work.year, work.medium].filter(Boolean).join(" · "),
    footer: `${host}/artist/${params.id.slice(0, split)}`,
    imageCandidates: [work.imageUrl],
  });
}
