"use client";

import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase-client";

export type R2AssetType = "profile" | "cover" | "work" | "font" | "spatial-preview";

export type R2UploadResult = {
  key: string;
  publicUrl: string;
  contentType: string;
  size: number;
  originalName: string;
};

type UploadOptions = {
  assetType: R2AssetType;
  entityId?: string;
  onProgress?: (percent: number) => void;
};

export async function uploadToR2(file: File, options: UploadOptions): Promise<R2UploadResult> {
  if (!auth?.currentUser) throw new Error("Sign in before uploading a file.");
  if (!file.type) throw new Error("This file does not have a readable type.");

  const mediaRef = db && auth.currentUser ? doc(collection(db, "media_assets")) : null;

  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/r2/upload-url", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      assetType: options.assetType,
      entityId: options.entityId,
    }),
  });
  const responseText = await response.text();
  let payload: { error?: string; uploadUrl?: string; key?: string; publicUrl?: string } = {};
  try {
    payload = responseText ? JSON.parse(responseText) as typeof payload : {};
  } catch {
    const fallback = response.status === 401
      ? "Please sign in again before uploading an image."
      : response.status >= 500
        ? "Image uploads are temporarily unavailable. Please try again shortly."
        : "We could not prepare this image upload. Please try again.";
    throw new Error(fallback);
  }
  if (!response.ok || !payload.uploadUrl || !payload.key || !payload.publicUrl) {
    if (response.status === 401) throw new Error("Please sign in again before uploading an image.");
    if (response.status >= 500) throw new Error(payload.error || "Image uploads are temporarily unavailable. Please try again shortly.");
    throw new Error(payload.error || "We could not prepare this image upload. Please try again.");
  }

  if (mediaRef && auth.currentUser) {
    await setDoc(mediaRef, {
      ownerUid: auth.currentUser.uid,
      key: payload.key,
      publicUrl: payload.publicUrl,
      contentType: file.type,
      size: file.size,
      originalName: file.name,
      assetType: options.assetType,
      entityId: options.entityId || null,
      visibility: "public",
      status: "pending",
      createdAt: serverTimestamp(),
    });
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", payload.uploadUrl as string);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onerror = () => reject(new Error("The image could not be uploaded. Check your connection and try again."));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else if (xhr.status === 403) reject(new Error("This upload link expired. Please choose the image again."));
        else reject(new Error("The image could not be uploaded. Please try again."));
      };
      xhr.send(file);
    });
  } catch (uploadError) {
    if (mediaRef) await updateDoc(mediaRef, { status: "failed", failedAt: serverTimestamp() }).catch(() => undefined);
    throw uploadError;
  }

  options.onProgress?.(100);
  if (mediaRef) {
    try {
      await updateDoc(mediaRef, { status: "uploaded", uploadedAt: serverTimestamp() });
    } catch {
      throw new Error("The image uploaded, but the profile could not be updated. Please save again.");
    }
  }
  return { key: payload.key, publicUrl: payload.publicUrl, contentType: file.type, size: file.size, originalName: file.name };
}
