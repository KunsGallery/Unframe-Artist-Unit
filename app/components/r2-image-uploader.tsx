"use client";

import { ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { uploadToR2, type R2AssetType } from "../r2-upload";

type R2ImageUploaderProps = {
  value?: string;
  assetType: Extract<R2AssetType, "profile" | "cover" | "work" | "spatial-preview">;
  entityId?: string;
  label: string;
  description: string;
  onChange: (url: string) => void;
};

export function R2ImageUploader({ value, assetType, entityId, label, description, onChange }: R2ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(value || "");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(value || "");
  }, [value]);

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("Choose a JPG, PNG, WebP, or AVIF image.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("This image must be smaller than 50MB.");
      return;
    }
    setError(null);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setProgress(0);
    try {
      const uploaded = await uploadToR2(file, { assetType, entityId, onProgress: setProgress });
      setPreviewUrl(uploaded.publicUrl);
      onChange(uploaded.publicUrl);
    } catch (uploadError) {
      setPreviewUrl(value || "");
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      URL.revokeObjectURL(localUrl);
      window.setTimeout(() => setProgress(null), 400);
    }
  }

  return <div className="r2-uploader">
    <div className="r2-uploader-heading"><div><strong>{label}</strong><span>{description}</span></div>{previewUrl ? <button type="button" className="r2-uploader-remove" onClick={() => { setPreviewUrl(""); onChange(""); }} aria-label={`Remove ${label}`}><X size={14} /></button> : <ImagePlus size={17} aria-hidden="true" />}</div>
    <button type="button" className={`r2-uploader-dropzone${previewUrl ? " has-preview" : ""}`} onClick={() => inputRef.current?.click()} disabled={progress !== null} aria-busy={progress !== null}>
      {previewUrl ? <img src={previewUrl} alt="" /> : <span><UploadCloud size={20} /><b>Choose an image</b><small>JPG, PNG, WebP, or AVIF · up to 50MB</small></span>}
      {progress !== null && <span className="r2-uploader-progress" role="progressbar" aria-label={`Uploading ${label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /><strong><LoaderCircle size={14} className="spin" /> {progress}%</strong></span>}
    </button>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    {error && <p className="r2-uploader-error" role="alert">{error}</p>}
  </div>;
}
