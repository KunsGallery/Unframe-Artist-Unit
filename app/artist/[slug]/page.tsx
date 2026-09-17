import { PublicArtistPage } from "../../public-artist-page";

export default async function PublicArtistRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicArtistPage slug={slug} />;
}
