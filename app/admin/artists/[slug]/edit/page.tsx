import DashboardProfilePage from "../../../../dashboard/profile/page";

export default function AdminArtistProfileEditor({ params }: { params: { slug: string } }) {
  return <DashboardProfilePage managedSlug={params.slug} />;
}
