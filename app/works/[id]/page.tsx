import Detail from "./detail";
import { workMetadata } from "../../server/public-metadata";
import { readPublicDocument } from "../../server/public-firestore";
import type { PublicProfile } from "../../profile";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return workMetadata(params.id);
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  const split = params.id.indexOf("~");
  const record = split > 0 ? await readPublicDocument("public_profiles", params.id.slice(0, split)) : null;
  return <Detail initialProfile={record ? ({ ...record, slug: record.id } as unknown as PublicProfile) : null} />;
}
