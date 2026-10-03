"use client";

import { makeImageVariants } from "../image-variants";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { uploadToR2, type R2AssetType } from "../r2-upload";

type R2ImageUploaderProps = {
  value?: string;
  assetType: Extract<R2AssetType, "profile" | "cover" | "work" | "spatial-preview">;
  entityId?: string;
  label: string;
  description: string;
  onChange: (url: string, variants?: { displayImageUrl: string; thumbnailImageUrl: string; displayImageWidth: number; thumbnailImageWidth: number }) => void;
};

export function R2ImageUploader({ value, assetType, entityId, label, description, onChange }: R2ImageUploaderProps) {
  const { locale } = useLanguage();
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
      setError(tx(locale, "Choose a JPG, PNG, WebP, or AVIF image.", "JPG, PNG, WebP 또는 AVIF 이미지를 선택해 주세요."));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError(tx(locale, "This image must be smaller than 50MB.", "50MB 이하 이미지를 선택해 주세요."));
      return;
    }
    setError(null);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setProgress(0);
    try {
      const uploaded = await uploadToR2(file, { assetType, entityId, onProgress: setProgress });
      if (assetType === "work") {
        // Original succeeded: always retain it even if an optional derivative fails.
        try {
          const files = await makeImageVariants(file);
          const display = await uploadToR2(files.display.file, { assetType, entityId });
          const thumbnail = await uploadToR2(files.thumbnail.file, { assetType, entityId });
          setPreviewUrl(display.publicUrl);
          onChange(uploaded.publicUrl, { displayImageUrl: display.publicUrl, thumbnailImageUrl: thumbnail.publicUrl, displayImageWidth: files.display.width, thumbnailImageWidth: files.thumbnail.width });
        } catch { setPreviewUrl(uploaded.publicUrl); onChange(uploaded.publicUrl, { displayImageUrl: "", thumbnailImageUrl: "", displayImageWidth: 0, thumbnailImageWidth: 0 }); setError(tx(locale, "Original uploaded, but smaller images could not be generated. Re-upload to retry.", "원본은 업로드됐지만 표시용 이미지를 만들지 못했습니다. 다시 업로드하면 재시도할 수 있습니다.")); }
      } else { setPreviewUrl(uploaded.publicUrl); onChange(uploaded.publicUrl); }
    } catch (uploadError) {
      setPreviewUrl(value || "");
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      URL.revokeObjectURL(localUrl);
      window.setTimeout(() => setProgress(null), 400);
    }
  }

  return <div className="r2-uploader">
    <div className="r2-uploader-heading"><div><strong>{label}</strong><span>{description}</span></div>{previewUrl ? <button type="button" className="r2-uploader-remove" onClick={() => { setPreviewUrl(""); onChange(""); }} disabled={progress !== null} aria-label={tx(locale, `Remove ${label}`, `${label} 삭제`)}><X size={14} /></button> : <ImagePlus size={17} aria-hidden="true" />}</div>
    <button type="button" className={`r2-uploader-dropzone${previewUrl ? " has-preview" : ""}`} onClick={() => inputRef.current?.click()} disabled={progress !== null} aria-busy={progress !== null} aria-label={tx(locale, `${previewUrl ? "Replace" : "Upload"} ${label}`, `${label} ${previewUrl ? "교체" : "업로드"}`)}>
      {previewUrl ? <img src={previewUrl} alt="" /> : <span><UploadCloud size={20} /><b>{tx(locale, "Choose an image", "이미지 선택")}</b><small>{tx(locale, "JPG, PNG, WebP, or AVIF · up to 50MB", "JPG, PNG, WebP, AVIF · 최대 50MB")}</small></span>}
      {progress !== null && <span className="r2-uploader-progress" role="progressbar" aria-label={tx(locale, `Uploading ${label}`, `${label} 업로드 중`)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /><strong><LoaderCircle size={14} className="spin" /> {progress}%</strong></span>}
    </button>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    {error && <p className="r2-uploader-error" role="alert">{error}</p>}
  </div>;
}
