"use client";

import { LoaderCircle, UploadCloud, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { uploadToR2 } from "../r2-upload";

export function R2VideoUploader({ value, entityId, onChange }: { value?: string; entityId: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(value || "");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  useEffect(() => setUrl(value || ""), [value]);
  async function upload(file?: File) {
    if (!file) return;
    if (!(file.type === "video/mp4" || file.type === "video/webm") || file.size > 50 * 1024 * 1024) {
      setError("MP4 또는 WebM 영상 파일을 선택해 주세요. 최대 50MB입니다.");
      return;
    }
    setError(""); setProgress(0);
    try {
      const result = await uploadToR2(file, { assetType: "studio-process", entityId, onProgress: setProgress });
      setUrl(result.publicUrl); onChange(result.publicUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "영상 업로드에 실패했습니다.");
    } finally { setProgress(null); }
  }
  return <div className="profile-audio-uploader studio-video-uploader"><div><Video size={16}/><span><strong>In the Studio · 짧은 영상</strong><small>MP4 / WebM · 최대 50MB · 공개 페이지에서 재생됩니다</small></span>{url && <button type="button" onClick={() => { setUrl(""); onChange(""); }} aria-label="영상 삭제"><X size={14}/></button>}</div>{url ? <video controls preload="metadata" src={url}/> : <button type="button" className="audio-upload-button" disabled={progress !== null} onClick={() => input.current?.click()}>{progress !== null ? <><LoaderCircle className="spin" size={15}/> {progress}%</> : <><UploadCloud size={16}/> 영상 파일 선택</>}</button>}<input ref={input} type="file" accept="video/mp4,video/webm,.mp4,.webm" hidden onChange={(event) => { void upload(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}/>{error && <p role="alert">{error}</p>}</div>;
}
