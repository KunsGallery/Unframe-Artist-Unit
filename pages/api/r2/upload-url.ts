import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";
import { getFirebaseAdminAuth } from "../../../app/server/firebase-admin";

type UploadResponse = {
  error?: string;
  key?: string;
  uploadUrl?: string;
  publicUrl?: string;
  expiresIn?: number;
  maxBytes?: number;
};

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "font/woff",
  "font/woff2",
  "font/ttf",
  "font/otf",
  "application/font-woff",
  "application/font-woff2",
]);

const allowedAssetTypes = new Set(["profile", "cover", "work", "font", "spatial-preview"]);

function cleanSegment(value: string, fallback: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return cleaned || fallback;
}

function extensionFor(contentType: string, filename: string) {
  const known: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "font/woff": "woff",
    "font/woff2": "woff2",
    "font/ttf": "ttf",
    "font/otf": "otf",
    "application/font-woff": "woff",
    "application/font-woff2": "woff2",
  };
  return known[contentType] || filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

function messageForError(error: unknown, stage: "identity" | "upload") {
  const message = error instanceof Error ? error.message : "";
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (message.includes("credentials are not configured") || message.includes("not configured")) {
    return { status: 503, error: "Image uploads are not configured yet." };
  }
  if (stage === "identity") {
    if (code.startsWith("auth/") || message.includes("auth/id-token") || message.includes("verifyIdToken")) {
      return { status: 401, error: "Please sign in again before uploading an image." };
    }
    return { status: 503, error: "Account verification is temporarily unavailable. Please try again shortly." };
  }
  console.error("Image upload URL error", error);
  return { status: 500, error: "Image uploads are temporarily unavailable. Please try again shortly." };
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

export default async function handler(request: NextApiRequest, response: NextApiResponse<UploadResponse>) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "This action is not available." });
  }

  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return response.status(401).json({ error: "Please sign in before uploading an image." });
    }

    let decodedToken;
    try {
      decodedToken = await getFirebaseAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    } catch (error) {
      console.error("Image upload identity verification error", error);
      const result = messageForError(error, "identity");
      return response.status(result.status).json({ error: result.error });
    }
    const payload = (request.body && typeof request.body === "object" ? request.body : {}) as {
      filename?: string;
      contentType?: string;
      size?: number;
      assetType?: string;
      entityId?: string;
    };
    const filename = typeof payload.filename === "string" ? payload.filename : "upload";
    const contentType = typeof payload.contentType === "string" ? payload.contentType.toLowerCase() : "";
    const size = typeof payload.size === "number" ? payload.size : 0;
    const assetType = typeof payload.assetType === "string" ? payload.assetType : "work";
    const maxBytes = Number(process.env.R2_MAX_UPLOAD_BYTES || 50 * 1024 * 1024);

    if (!allowedContentTypes.has(contentType)) {
      return response.status(415).json({ error: "This file type is not supported." });
    }
    if (!allowedAssetTypes.has(assetType)) {
      return response.status(400).json({ error: "This upload destination is not supported." });
    }
    if (!Number.isFinite(size) || size <= 0 || size > maxBytes) {
      return response.status(413).json({ error: `This file must be smaller than ${Math.round(maxBytes / 1024 / 1024)}MB.` });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
      return response.status(503).json({ error: "Image uploads are not configured yet." });
    }

    const folder = cleanSegment(assetType, "work");
    const entity = cleanSegment(payload.entityId || "unassigned", "unassigned");
    const filenameBase = cleanSegment(filename.replace(/\.[^.]+$/, ""), "asset");
    const key = `uau/${decodedToken.uid}/${folder}/${entity}/${randomUUID()}-${filenameBase}.${extensionFor(contentType, filename)}`;
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    let uploadUrl: string;
    try {
      uploadUrl = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
        { expiresIn: 900 },
      );
    } catch (error) {
      console.error("Image upload URL signing error", error);
      const result = messageForError(error, "upload");
      return response.status(result.status).json({ error: result.error });
    }

    return response.status(200).json({
      key,
      uploadUrl,
      publicUrl: `${publicBaseUrl}/${key}`,
      expiresIn: 900,
      maxBytes,
    });
  } catch (error) {
    const result = messageForError(error, "upload");
    return response.status(result.status).json({ error: result.error });
  }
}
