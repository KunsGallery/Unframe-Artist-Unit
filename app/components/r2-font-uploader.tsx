"use client";

import { FileText, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { uploadToR2 } from "../r2-upload";

type R2FontUploaderProps = {
  value?: string;
  label: string;
  description: string;
  chooseLabel: string;
  onChange: (url: string) => void;
};

const acceptedExtensions = ["woff2", "woff", "ttf", "otf"];
const acceptedTypes = ["font/woff2", "font/woff", "font/ttf", "font/otf", "font/sfnt", "application/font-woff", "application/font-woff2", "application/x-font-ttf", "application/x-font-opentype", "application/octet-stream"];

function fileNameFromUrl(value: string) {
  try {
    const pathname = new URL(value).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "");
  } catch {
    return "";
  }
}

export function R2FontUploader({ value = "", label, description, chooseLabel, onChange }: R2FontUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState(() => fileNameFromUrl(value));
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFileName(fileNameFromUrl(value));
  }, [value]);

  async function handleFile(file?: File) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!acceptedExtensions.includes(extension) || (file.type && !acceptedTypes.includes(file.type) && file.type !== "application/octet-stream")) {
      setError("WOFF2, WOFF, TTF, or OTF font files only.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("This font must be smaller than 10MB.");
      return;
    }
    setError(null);
    setFileName(file.name);
    setProgress(0);
    try {
      const uploaded = await uploadToR2(file, { assetType: "font", entityId: "site-fonts", onProgress: setProgress });
      setFileName(uploaded.originalName);
      onChange(uploaded.publicUrl);
    } catch (uploadError) {
      setFileName(fileNameFromUrl(value));
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      window.setTimeout(() => setProgress(null), 400);
    }
  }

  return <div className="r2-font-uploader">
    <div className="r2-font-uploader-heading"><div><strong>{label}</strong><span>{description}</span></div>{value ? <button type="button" className="r2-uploader-remove" onClick={() => { setFileName(""); onChange(""); }} aria-label={`Remove ${label}`}><X size={14} /></button> : <FileText size={17} aria-hidden="true" />}</div>
    <button type="button" className={`r2-font-dropzone${value ? " has-file" : ""}`} onClick={() => inputRef.current?.click()} disabled={progress !== null} aria-busy={progress !== null}>
      {value || fileName ? <span className="r2-font-file"><FileText size={21} /><b>{fileName || chooseLabel}</b><small>{value ? "Uploaded · ready for preview" : "Preparing upload…"}</small></span> : <span className="r2-font-file"><UploadCloud size={20} /><b>{chooseLabel}</b><small>WOFF2, WOFF, TTF, or OTF · up to 10MB</small></span>}
      {progress !== null && <span className="r2-uploader-progress" role="progressbar" aria-label={`Uploading ${label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /><strong><LoaderCircle size={14} className="spin" /> {progress}%</strong></span>}
    </button>
    <input ref={inputRef} type="file" accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf" hidden onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    {error && <p className="r2-uploader-error" role="alert">{error}</p>}
  </div>;
}
