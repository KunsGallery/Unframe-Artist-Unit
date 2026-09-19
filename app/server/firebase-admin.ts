import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdminApp() {
  const existing = getApps()[0];
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
