import { PublicArtistPage } from "../../public-artist-page";
import { artistMetadata } from "../../server/public-metadata";
import { readPublicDocument, type PublicRecord } from "../../server/public-firestore";
import { siteUrl } from "../../site-url";
import type { PublicProfile } from "../../profile";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return artistMetadata((await params).slug);
}

function artistJsonLd(profile: PublicRecord, slug: string) {
  const url = `${siteUrl}/artist/${encodeURIComponent(slug)}`;
  const works = (profile.siteWorks as Array<Record<string, unknown>> | undefined || []).filter((work) => work.title && work.imageUrl);
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.artistName || profile.displayName,
    url,
    jobTitle: profile.practice || undefined,
    description: profile.bio || undefined,
    image: profile.profileImageUrl || undefined,
    homeLocation: profile.basedInCity ? { "@type": "Place", name: [profile.basedInCity, profile.country].filter(Boolean).join(", ") } : undefined,
    sameAs: profile.websiteUrl ? [profile.websiteUrl] : undefined,
    subjectOf: works.slice(0, 12).map((work) => ({ "@type": "VisualArtwork", name: work.title, image: work.displayImageUrl || work.imageUrl, dateCreated: work.year || undefined, artMedium: work.medium || undefined, url: `${siteUrl}/works/${encodeURIComponent(`${slug}~${String(work.id)}`)}` })),
  };
  // Escape "<" so profile text can never close the script element.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function PublicArtistRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Published profiles render on the server; drafts stay client-only for admin preview.
  const record = await readPublicDocument("public_profiles", slug);
  const initialProfile = record ? ({ ...record, slug } as unknown as PublicProfile) : null;
  return <>
    {record && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: artistJsonLd(record, slug) }} />}
    <PublicArtistPage slug={slug} initialProfile={initialProfile} />
  </>;
}
