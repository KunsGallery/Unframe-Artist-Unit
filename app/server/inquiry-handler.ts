// Inquiry orchestration. Dependencies are injected so every path can be tested
// without Firebase or Resend; pages/api/inquiries.ts wires in the real ones.
import type { InquiryMailInput, MailMessage } from "./inquiry-email";

export type InquiryRequest = { artistSlug: string; message: string; workId?: string; purpose?: string; locale?: "en" | "ko" };

type Purpose = { readonly id: string; readonly en: string; readonly ko: string };
type Work = { id?: string; title?: string; imageUrl?: string; year?: string; medium?: string; dimensions?: string };

export type InquiryDeps = {
  verifyToken(token: string): Promise<{ uid: string; email?: string; name?: string }>;
  readProfile(slug: string): Promise<Record<string, unknown> | null>;
  saveInquiry(token: string, data: Record<string, unknown>): Promise<{ id: string } | { status: 403 }>;
  lookupEmail(uid: string): Promise<string | null>;
  send(message: MailMessage): Promise<boolean>;
  buildArtistMail(input: InquiryMailInput, opts: { from: string; to: string; copyTo?: string; siteUrl: string }): MailMessage;
  buildRequesterMail(input: InquiryMailInput, opts: { from: string; siteUrl: string }): MailMessage;
  purposes: readonly Purpose[];
  config: { from?: string; copyTo?: string; siteUrl: string; mailEnabled: boolean };
};

export type InquiryResult = { status: number; body: { ok?: true; id?: string; emailed?: boolean; error?: string } };

const fail = (status: number, error: string): InquiryResult => ({ status, body: { error } });

function parse(body: unknown): InquiryRequest | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if (typeof value.artistSlug !== "string" || !value.artistSlug || value.artistSlug.length > 200 || typeof value.message !== "string") return null;
  return {
    artistSlug: value.artistSlug,
    message: value.message.trim(),
    workId: typeof value.workId === "string" && value.workId ? value.workId : undefined,
    purpose: typeof value.purpose === "string" ? value.purpose : undefined,
    locale: value.locale === "en" ? "en" : "ko",
  };
}

export async function handleInquiry(token: string | undefined, body: unknown, deps: InquiryDeps): Promise<InquiryResult> {
  if (!token) return fail(401, "Please sign in before sending an inquiry.");
  let requester: Awaited<ReturnType<InquiryDeps["verifyToken"]>>;
  try { requester = await deps.verifyToken(token); } catch { return fail(401, "Please sign in again before sending an inquiry."); }
  if (!requester.email) return fail(400, "Sign in with an account that has an email address.");

  const request = parse(body);
  if (!request) return fail(400, "The inquiry is incomplete.");
  if (request.message.length < 10 || request.message.length > 2000) return fail(400, "The message must be between 10 and 2000 characters.");

  const profile = await deps.readProfile(request.artistSlug);
  if (!profile || typeof profile.ownerUid !== "string") return fail(404, "This artist page is not open.");
  const artistName = String(profile.artistName || profile.displayName || "U.A.U");

  let fields: { workId: string; workTitle: string; artworkImageUrl?: string; artworkYear?: string; artworkMedium?: string; artworkDimensions?: string };
  let mailWork: Pick<InquiryMailInput, "workTitle" | "workMeta" | "imageUrl">;
  if (request.workId) {
    const work = ((profile.siteWorks as Work[] | undefined) || []).find((item) => item.id === request.workId);
    if (!work || !work.title?.trim() || !work.imageUrl?.trim()) return fail(404, "This work is no longer available.");
    fields = { workId: request.workId, workTitle: work.title, artworkImageUrl: work.imageUrl, artworkYear: work.year || "", artworkMedium: work.medium || "", artworkDimensions: work.dimensions || "" };
    mailWork = { workTitle: work.title, workMeta: [work.year, work.medium, work.dimensions].filter(Boolean).join(" · "), imageUrl: work.imageUrl };
  } else {
    const purpose = deps.purposes.find((item) => item.id === (request.purpose || deps.purposes[0]?.id));
    if (!purpose) return fail(400, "Choose a purpose for this inquiry.");
    fields = { workId: "artist-profile", workTitle: request.locale === "en" ? purpose.en : purpose.ko };
    mailWork = { workTitle: fields.workTitle };
  }

  const requesterName = requester.name || requester.email;
  const saved = await deps.saveInquiry(token, { requesterUid: requester.uid, requesterName, requesterEmail: requester.email, recipientUid: profile.ownerUid, artistSlug: request.artistSlug, ...fields, message: request.message, status: "new" });
  if (!("id" in saved)) return fail(403, "This inquiry could not be sent.");

  // Mail is best-effort: the inquiry is already in the artist's dashboard.
  let emailed = false;
  const { from, copyTo, siteUrl, mailEnabled } = deps.config;
  if (mailEnabled && from) {
    const input: InquiryMailInput = { artistName, artistSlug: request.artistSlug, subjectLabel: fields.workTitle, ...mailWork, message: request.message, requesterName, requesterEmail: requester.email };
    let artistSent = false;
    let requesterSent = false;
    try {
      const artistEmail = await deps.lookupEmail(profile.ownerUid);
      if (artistEmail) artistSent = await deps.send(deps.buildArtistMail(input, { from, to: artistEmail, copyTo, siteUrl }));
    } catch (error) { console.error("Inquiry artist email failed:", error instanceof Error ? error.message : "unknown error"); }
    try {
      requesterSent = await deps.send(deps.buildRequesterMail(input, { from, siteUrl }));
    } catch (error) { console.error("Inquiry receipt email failed:", error instanceof Error ? error.message : "unknown error"); }
    emailed = artistSent && requesterSent;
  }
  return { status: 200, body: { ok: true, id: saved.id, emailed } };
}
