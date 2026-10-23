import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdminApp() {
  const existing = getApps().find((app) => app.name === "[DEFAULT]");
  if (existing) return existing;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unframe-uau";

  if (!projectId) {
    throw new Error("Firebase project ID is not configured.");
  }

  // ID-token verification only needs the project ID and Firebase's public signing keys.
  // Do not read service-account credentials here: a malformed legacy key must not
  // prevent a signed-in person from uploading an image.
  return initializeApp({ projectId });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

// Reading another user's email needs real credentials, so it uses its own app.
// Without credentials (or with a malformed key) the lookup quietly returns null.
function getCredentialedApp() {
  const existing = getApps().find((app) => app.name === "uau-credentialed");
  if (existing) return existing;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unframe-uau";
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) return initializeApp({ projectId }, "uau-credentialed");
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;
  return initializeApp({ projectId, credential: cert({ projectId, clientEmail, privateKey }) }, "uau-credentialed");
}

export async function getUserEmail(uid: string): Promise<string | null> {
  try {
    const app = getCredentialedApp();
    if (!app) return null;
    return (await getAuth(app).getUser(uid)).email || null;
  } catch (error) {
    console.error("Artist email lookup failed:", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}
