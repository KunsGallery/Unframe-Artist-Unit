import type { NextApiRequest, NextApiResponse } from "next";
import { verifyFirebaseIdToken } from "../../app/server/firebase-token";
import { readPublicDocument } from "../../app/server/public-firestore";
import { saveInquiry } from "../../app/server/inquiry-store";
import { getUserEmail } from "../../app/server/firebase-admin";
import { sendEmail } from "../../app/server/resend";
import { buildArtistMail, buildRequesterMail } from "../../app/server/inquiry-email";
import { handleInquiry, type InquiryResult } from "../../app/server/inquiry-handler";
import { inquiryPurposes } from "../../app/inquiry-purposes";
import { siteUrl } from "../../app/site-url";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unframe-uau";

export default async function handler(request: NextApiRequest, response: NextApiResponse<InquiryResult["body"]>) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "This action is not available." });
  }
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  try {
    const result = await handleInquiry(token, request.body, {
      verifyToken: (idToken) => verifyFirebaseIdToken(idToken, projectId),
      readProfile: (slug) => readPublicDocument("public_profiles", slug),
      saveInquiry,
      lookupEmail: getUserEmail,
      send: sendEmail,
      buildArtistMail,
      buildRequesterMail,
      purposes: inquiryPurposes,
      config: { from: process.env.INQUIRY_EMAIL_FROM, copyTo: process.env.INQUIRY_COPY_EMAIL || undefined, siteUrl, mailEnabled: Boolean(process.env.RESEND_API_KEY && process.env.INQUIRY_EMAIL_FROM) },
    });
    return response.status(result.status).json(result.body);
  } catch (error) {
    console.error("Inquiry could not be saved:", error instanceof Error ? error.message : "unknown error");
    return response.status(503).json({ error: "The inquiry could not be sent. Please try again shortly." });
  }
}
