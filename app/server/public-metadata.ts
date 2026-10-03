import type { Metadata } from "next";

type Value = { stringValue?: string; booleanValue?: boolean; mapValue?: { fields?: Record<string, Value> }; arrayValue?: { values?: Value[] } };
function decode(value: Value): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.arrayValue) return (value.arrayValue.values || []).map(decode);
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decode(item)]));
  return null;
}

// Anonymous REST reads respect published-only Firestore rules. Never use admin
// credentials to generate metadata for private drafts.
export async function readPublicDocument(collection: "public_profiles" | "galleries" | "exhibitions", id: string): Promise<Record<string, unknown> | null> {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!project) return null;
  try {
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const json = await response.json() as { fields?: Record<string, Value> };
    const data = Object.fromEntries(Object.entries(json.fields || {}).map(([key, value]) => [key, decode(value)]));
    return data.published === true && data.isDemonstration !== true ? data : null;
  } catch { return null; }
}

export async function artistMetadata(slug: string): Promise<Metadata> {
  const profile = await readPublicDocument("public_profiles", slug);
  if (!profile) return { title: "U.A.U", robots: { index: false, follow: false }, openGraph: { title: "U.A.U", images: [] } };
  const name = String(profile.artistName || profile.displayName || "U.A.U artist");
  const description = String(profile.bio || profile.practice || "UNFRAME ARTIST UNIT").slice(0, 160);
  const works = profile.siteWorks as Array<{ displayImageUrl?: string; imageUrl?: string }> | undefined;
  const image = String(profile.siteCoverImageUrl || works?.[0]?.displayImageUrl || works?.[0]?.imageUrl || "");
  const images = /^https:\/\//.test(image) ? [{ url: image, alt: name }] : [];
  const url = `https://uau.unframe.kr/artist/${encodeURIComponent(slug)}`;
  return { title: name, description, alternates: { canonical: url }, openGraph: { title: name, description, url, type: "profile", images }, twitter: { card: images.length ? "summary_large_image" : "summary", title: name, description, images: images.map((item) => item.url) } };
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
  const url = `https://uau.unframe.kr/works/${encodeURIComponent(id)}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: /^https:\/\//.test(image) ? [{ url: image, alt: String(work.title || "") }] : [] } };
}

export async function organizationMetadata(collection: "galleries" | "exhibitions", id: string): Promise<Metadata> {
  const record = await readPublicDocument(collection, id);
  if (!record) return { title: "U.A.U", robots: { index: false, follow: false } };
  const title = String(record.title || record.name || "U.A.U");
  const description = String(record.description || record.bio || "UNFRAME ARTIST UNIT").slice(0, 160);
  const image = String(record.coverImageUrl || record.imageUrl || "");
  const url = `https://uau.unframe.kr/${collection}/${encodeURIComponent(id)}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: /^https:\/\//.test(image) ? [{ url: image, alt: title }] : [] } };
}
