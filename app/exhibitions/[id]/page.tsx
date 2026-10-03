import Detail from "./detail";
import { organizationMetadata } from "../../server/public-metadata";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return organizationMetadata("exhibitions", params.id);
}

export default function DetailPage() { return <Detail />; }
