import { randomBytes } from "node:crypto";
import { documentsUrl } from "./public-firestore";

const idAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function newDocumentId() {
  return Array.from(randomBytes(20), (byte) => idAlphabet[byte % idAlphabet.length]).join("");
}

// Writes with the requester's own ID token, so the existing work_inquiries
// rules validate the document exactly as they did for browser writes.
export async function saveInquiry(idToken: string, data: Record<string, unknown>): Promise<{ id: string } | { status: 403 }> {
  const base = documentsUrl();
  if (!base) throw new Error("Firestore is not configured.");
  const id = newDocumentId();
  const name = `${base.slice(base.indexOf("projects/"))}/work_inquiries/${id}`;
  const fields = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, { stringValue: String(value ?? "") }]));
  const response = await fetch(`${base}:commit`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ writes: [{ update: { name, fields }, updateTransforms: [{ fieldPath: "createdAt", setToServerValue: "REQUEST_TIME" }], currentDocument: { exists: false } }] }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 403) return { status: 403 };
  if (!response.ok) throw new Error(`Firestore commit failed with ${response.status}.`);
  return { id };
}
