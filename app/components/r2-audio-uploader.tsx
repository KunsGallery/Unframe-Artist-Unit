"use client";

import { LoaderCircle, Mic2, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { uploadToR2 } from "../r2-upload";

export function R2AudioUploader({ value, entityId, onChange }: { value?: string; entityId: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(value || "");
  useEffect(() => setPreview(value || ""), [value]);
  async function upload(file?: File) {
    if (!file) return;
    if (!/\.(mp3|m4a|aac|wav)$/i.test(file.name) || file.size > 30 * 1024 * 1024) {
      setError("MP3, M4A, AAC 또는 WAV 파일을 선택해 주세요. 최대 30MB입니다.");
      return;
    }
    setError(""); setProgress(0);
    try {
      const result = await uploadToR2(file, { assetType: "audio-guide", entityId, onProgress: setProgress });
      setPreview(result.publicUrl); onChange(result.publicUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "오디오 업로드에 실패했습니다.");
    } finally { setProgress(null); }
  }
  return <div className="profile-audio-uploader"><div><Mic2 size={16}/><span><strong>작가 음성 소개</strong><small>선택형 오디오 · 자동 재생하지 않아요 · 최대 30MB</small></span>{preview && <button type="button" onClick={() => { setPreview(""); onChange(""); }} aria-label="오디오 삭제"><X size={14}/></button>}</div>{preview ? <audio controls preload="none" src={preview}/> : <button type="button" className="audio-upload-button" disabled={progress !== null} onClick={() => input.current?.click()}>{progress !== null ? <><LoaderCircle className="spin" size={15}/> {progress}%</> : <><UploadCloud size={16}/> 녹음 파일 선택</>}</button>}<input ref={input} type="file" accept=".mp3,.m4a,.aac,.wav,audio/mpeg,audio/mp4,audio/aac,audio/wav" hidden onChange={(event) => { void upload(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}/>{error && <p role="alert">{error}</p>}</div>;
}
