import type { MailMessage } from "./inquiry-email";

// RESEND_API_BASE lets local checks point at a mock server.
export async function sendEmail(message: MailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const response = await fetch(`${process.env.RESEND_API_BASE || "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(message),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Resend responded with ${response.status}.`);
  return true;
}
