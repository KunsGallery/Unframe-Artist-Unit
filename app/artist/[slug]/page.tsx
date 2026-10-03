import { PublicArtistPage } from "../../public-artist-page";
import { artistMetadata } from "../../server/public-metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return artistMetadata((await params).slug);
}

export default async function PublicArtistRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicArtistPage slug={slug} />;
}
