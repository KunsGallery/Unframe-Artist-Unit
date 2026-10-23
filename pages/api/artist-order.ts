import type { NextApiRequest, NextApiResponse } from "next";
import { listPublicDocuments } from "../../app/server/public-firestore";
import { orderSlugs, orderWindow } from "../../app/artist-order";

// Published artist addresses in this window's order. Only ids are listed, so the
// directory can page through the archive fairly without downloading it.
export default async function handler(request: NextApiRequest, response: NextApiResponse<{ order: string[]; nextChange: string } | { error: string }>) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "This action is not available." });
  }
  const profiles = await listPublicDocuments("public_profiles", ["accountType"]);
  const window = orderWindow(new Date());
  const slugs = profiles.filter((profile) => !profile.accountType || profile.accountType === "artist").map((profile) => profile.id);
  // Short cache so newly published artists appear soon; the order itself only changes per window.
  response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return response.status(200).json({ order: orderSlugs(slugs, window.seed), nextChange: window.nextChange.toISOString() });
}
