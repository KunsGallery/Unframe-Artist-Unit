import Detail from "./detail";
import { organizationMetadata } from "../../server/public-metadata";
import { readPublicDocument } from "../../server/public-firestore";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return organizationMetadata("exhibitions", params.id);
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  return <Detail initialData={await readPublicDocument("exhibitions", params.id)} />;
}
