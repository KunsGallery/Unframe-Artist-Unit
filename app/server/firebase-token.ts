import { createPublicKey, createVerify } from "node:crypto";

type FirebaseTokenPayload = {
  aud?: string;
  auth_time?: number;
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
  user_id?: string;
};

type FirebasePublicKeys = Record<string, string>;

let cachedKeys: FirebasePublicKeys | null = null;
let cacheExpiresAt = 0;

function decodeJson(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
}

async function getFirebasePublicKeys() {
  const now = Date.now();
  if (cachedKeys && now < cacheExpiresAt) return cachedKeys;

  const response = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!response.ok) throw new Error("Firebase signing keys are temporarily unavailable.");
  const keys = await response.json() as FirebasePublicKeys;
  const maxAge = Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1] || 3600);
  cachedKeys = keys;
  cacheExpiresAt = now + Math.max(60, maxAge) * 1000;
  return keys;
}

export async function verifyFirebaseIdToken(idToken: string, projectId: string) {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Invalid Firebase ID token.");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJson(encodedHeader);
  const payload = decodeJson(encodedPayload) as FirebaseTokenPayload;
  const kid = typeof header.kid === "string" ? header.kid : "";
  if (header.alg !== "RS256" || !kid) throw new Error("Invalid Firebase ID token.");

  const publicKeys = await getFirebasePublicKeys();
  const certificate = publicKeys[kid];
  if (!certificate) throw new Error("Firebase signing key was rotated. Please sign in again.");

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();
  if (!verifier.verify(createPublicKey(certificate), Buffer.from(encodedSignature, "base64url"))) {
    throw new Error("Invalid Firebase ID token.");
  }

  const now = Math.floor(Date.now() / 1000);
  const uid = typeof payload.user_id === "string" ? payload.user_id : payload.sub;
  if (
    payload.aud !== projectId ||
    payload.iss !== `https://securetoken.google.com/${projectId}` ||
    !uid ||
    uid.length > 128 ||
    typeof payload.exp !== "number" ||
    payload.exp <= now ||
    typeof payload.iat !== "number" ||
    payload.iat > now + 60
  ) {
    throw new Error("Invalid Firebase ID token.");
  }

  return { uid };
}
