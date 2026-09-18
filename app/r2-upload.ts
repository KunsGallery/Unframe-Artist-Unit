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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      assetType: options.assetType,
      entityId: options.entityId,
    }),
  });
  const payload = await response.json() as { error?: string; uploadUrl?: string; key?: string; publicUrl?: string };
  if (!response.ok || !payload.uploadUrl || !payload.key || !payload.publicUrl) {
    throw new Error(payload.error || "Could not prepare the upload.");
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
      xhr.onerror = () => reject(new Error("The file could not reach Cloudflare R2."));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Cloudflare R2 rejected the upload (${xhr.status}).`));
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
      throw new Error("The file uploaded, but its media record could not be saved. Please try again.");
    }
  }
  return { key: payload.key, publicUrl: payload.publicUrl, contentType: file.type, size: file.size, originalName: file.name };
}
