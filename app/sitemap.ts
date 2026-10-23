import type { MetadataRoute } from "next";
import { listPublicDocuments, type PublicRecord } from "./server/public-firestore";
import { siteUrl } from "./site-url";

export const revalidate = 3600;

const staticPaths = ["", "/artists", "/works", "/projects", "/galleries", "/radar", "/connections", "/recap", "/about", "/join"];

function lastModified(record: PublicRecord) {
  const value = String(record.updatedAt || record.updateTime || "");
  return value && !Number.isNaN(Date.parse(value)) ? new Date(value) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profiles, galleries, exhibitions] = await Promise.all([
    listPublicDocuments("public_profiles", ["accountType", "updatedAt", "siteWorks"]),
    listPublicDocuments("galleries", ["updatedAt"]),
    listPublicDocuments("exhibitions", ["updatedAt"]),
  ]);
  const artists = profiles.filter((profile) => !profile.accountType || profile.accountType === "artist");
  return [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "daily" as const, priority: path ? 0.6 : 1 })),
    ...artists.map((profile) => ({ url: `${siteUrl}/artist/${encodeURIComponent(profile.id)}`, lastModified: lastModified(profile), changeFrequency: "weekly" as const, priority: 0.9 })),
    ...artists.flatMap((profile) => (profile.siteWorks as Array<Record<string, unknown>> | undefined || [])
      .filter((work) => work.id && work.title && work.imageUrl)
      .map((work) => ({ url: `${siteUrl}/works/${encodeURIComponent(`${profile.id}~${String(work.id)}`)}`, lastModified: lastModified(profile), changeFrequency: "monthly" as const, priority: 0.7 }))),
    ...galleries.map((record) => ({ url: `${siteUrl}/galleries/${encodeURIComponent(record.id)}`, lastModified: lastModified(record), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...exhibitions.map((record) => ({ url: `${siteUrl}/exhibitions/${encodeURIComponent(record.id)}`, lastModified: lastModified(record), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
