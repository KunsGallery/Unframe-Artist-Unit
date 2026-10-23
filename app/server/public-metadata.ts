import type { Metadata } from "next";
import { readPublicDocument } from "./public-firestore";
import { siteUrl } from "../site-url";

export async function artistMetadata(slug: string): Promise<Metadata> {
  const profile = await readPublicDocument("public_profiles", slug);
  if (!profile) return { title: "U.A.U", robots: { index: false, follow: false }, openGraph: { title: "U.A.U", images: [] } };
  const name = String(profile.artistName || profile.displayName || "U.A.U artist");
  const description = String(profile.bio || profile.practice || "UNFRAME ARTIST UNIT").slice(0, 160);
  // Share images come from ./opengraph-image beside the artist route.
  const url = `${siteUrl}/artist/${encodeURIComponent(slug)}`;
  return { title: name, description, alternates: { canonical: url }, openGraph: { title: name, description, url, type: "profile" }, twitter: { card: "summary_large_image", title: name, description } };
}

export async function workMetadata(id: string): Promise<Metadata> {
  const split = id.indexOf("~");
  if (split < 0) return { title: "U.A.U", robots: { index: false, follow: false } };
  const profile = await readPublicDocument("public_profiles", id.slice(0, split));
  const works = profile?.siteWorks as Array<Record<string, unknown>> | undefined;
  const work = works?.find((item) => item.id === id.slice(split + 1));
  if (!work) return { title: "U.A.U", robots: { index: false, follow: false } };
  const title = `${String(work.title || "")} · ${String(profile?.artistName || profile?.displayName || "U.A.U")}`;
  const description = [work.year, work.medium, work.dimensions].filter(Boolean).join(" · ");
  const image = String(work.displayImageUrl || work.imageUrl || "");
  const url = `${siteUrl}/works/${encodeURIComponent(id)}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: /^https:\/\//.test(image) ? [{ url: image, alt: String(work.title || "") }] : [] } };
}

export async function organizationMetadata(collection: "galleries" | "exhibitions", id: string): Promise<Metadata> {
  const record = await readPublicDocument(collection, id);
  if (!record) return { title: "U.A.U", robots: { index: false, follow: false } };
  const title = String(record.title || record.name || "U.A.U");
  const description = String(record.description || record.bio || "UNFRAME ARTIST UNIT").slice(0, 160);
  const image = String(record.coverImageUrl || record.imageUrl || "");
  const url = `${siteUrl}/${collection}/${encodeURIComponent(id)}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: /^https:\/\//.test(image) ? [{ url: image, alt: title }] : [] } };
}
