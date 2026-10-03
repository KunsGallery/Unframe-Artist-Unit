import Detail from "./detail";
import { workMetadata } from "../../server/public-metadata";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return workMetadata(params.id);
}

export default function DetailPage() { return <Detail />; }
