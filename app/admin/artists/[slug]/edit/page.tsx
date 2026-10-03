import DashboardProfilePage from "../../../../dashboard/profile/profile-editor";

export default function AdminArtistProfileEditor({ params }: { params: { slug: string } }) {
  return <DashboardProfilePage managedSlug={params.slug} />;
}
