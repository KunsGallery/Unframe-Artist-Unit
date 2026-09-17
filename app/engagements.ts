"use client";

import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase-client";

export type EngagementAction = "view" | "like" | "save" | "follow" | "share";
export type EngagementTarget = "artist" | "work" | "project" | "event" | "opportunity" | "thread";

export async function recordEngagement(input: {
  actorUid: string;
  action: Exclude<EngagementAction, "save">;
  targetType: EngagementTarget;
  targetId: string;
  source?: string;
}) {
  if (!db) return;
  await addDoc(collection(db, "engagement_events"), { ...input, createdAt: serverTimestamp() });
}

export async function setSavedEngagement(input: {
  actorUid: string;
  targetType: EngagementTarget;
  targetId: string;
  active: boolean;
}) {
  if (!db) return;
  const id = `${input.actorUid}_${input.targetType}_${input.targetId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  await setDoc(doc(db, "engagement_events", id), { ...input, action: "save", updatedAt: serverTimestamp() }, { merge: true });
}
