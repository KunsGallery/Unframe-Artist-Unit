import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "../../../server/firebase-admin";

export const runtime = "nodejs";

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

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 credentials are not configured.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const payload = await request.json() as {
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
      return NextResponse.json({ error: "This file type is not supported." }, { status: 415 });
    }
    if (!allowedAssetTypes.has(assetType)) {
      return NextResponse.json({ error: "This upload destination is not supported." }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0 || size > maxBytes) {
      return NextResponse.json({ error: `This file must be smaller than ${Math.round(maxBytes / 1024 / 1024)}MB.` }, { status: 413 });
    }

    const bucket = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
    if (!bucket || !publicBaseUrl) {
      return NextResponse.json({ error: "R2 bucket or public URL is not configured." }, { status: 503 });
    }

    const folder = cleanSegment(assetType, "work");
    const entity = cleanSegment(payload.entityId || "unassigned", "unassigned");
    const filenameBase = cleanSegment(filename.replace(/\.[^.]+$/, ""), "asset");
    const key = `uau/${decodedToken.uid}/${folder}/${entity}/${crypto.randomUUID()}-${filenameBase}.${extensionFor(contentType, filename)}`;
    const client = getR2Client();
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: 900 },
    );

    return NextResponse.json({
      key,
      uploadUrl,
      publicUrl: `${publicBaseUrl}/${key}`,
      expiresIn: 900,
      maxBytes,
    });
  } catch (error) {
    console.error("R2 upload URL error", error);
    const message = error instanceof Error ? error.message : "Could not prepare the upload.";
    const status = message.includes("credentials are not configured") || message.includes("not configured") ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? "Media upload is not configured yet." : "Could not prepare the upload." }, { status });
  }
}
