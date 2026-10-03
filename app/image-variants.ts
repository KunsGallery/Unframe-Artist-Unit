"use client";

// Keep originals intact. These WebP files are only for screen rendering.
export async function makeImageVariants(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 60_000_000) throw new Error("Image dimensions are too large.");
    const resize = async (maxEdge: number, suffix: string) => {
      const ratio = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image processing unavailable.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Image processing failed.")), "image/webp", .9));
      if (blob.type !== "image/webp") throw new Error("WebP encoding unavailable.");
      return { width: canvas.width, file: new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-${suffix}.webp`, { type: blob.type }) };
    };
    return { display: await resize(1600, "display"), thumbnail: await resize(640, "thumbnail") };
  } finally { bitmap.close(); }
}
