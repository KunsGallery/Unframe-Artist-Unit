"use client";

import type { User } from "firebase/auth";
import type { InquiryRequest } from "./server/inquiry-handler";

// Inquiries go through the server so the artist and requester can be emailed.
export async function submitInquiry(user: User, payload: InquiryRequest): Promise<{ id: string; emailed: boolean }> {
  const response = await fetch("/api/inquiries", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as { id?: string; emailed?: boolean; error?: string };
  if (!response.ok || !body.id) throw new Error(body.error || "The inquiry could not be sent.");
  return { id: body.id, emailed: Boolean(body.emailed) };
}
