"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowUpRight, Check, ExternalLink, LockKeyhole, RotateCcw, SlidersHorizontal } from "lucide-react";
import { DemoNotice, MetaLine } from "../../components";
import { useAuth } from "../../auth-provider";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { defaultSiteSettings, useSiteSettings, type SiteSettings } from "../../site-settings";

const adminRoles = ["super_admin", "editor", "curator", "support", "finance", "moderator"];

export default function AdminEditorPage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<SiteSettings>(defaultSiteSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!user || !db) {
      setAllowed(false);
      return;
    }
    return onSnapshot(doc(db, "admins", user.uid), (snapshot) => {
      const data = snapshot.data();
      setAllowed(snapshot.exists() && data?.active === true && adminRoles.includes(String(data.role)));
    }, () => setAllowed(false));
  }, [user]);

  useEffect(() => {
    if (!settingsLoading) setDraft(settings);
  }, [settings, settingsLoading]);

  useEffect(() => {
    previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-settings", settings: draft }, window.location.origin);
  }, [draft]);

  function updateSetting<Key extends keyof SiteSettings>(key: Key, value: SiteSettings[Key]) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings() {
    if (!db) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await setDoc(doc(db, "site_settings", "public"), { ...draft, updatedAt: serverTimestamp() }, { merge: true });
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : tx(locale, "The site settings could not be saved.", "사이트 설정을 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  function resetDraft() {
    setSaved(false);
    setError(null);
    setDraft(settings);
  }

  if (authLoading || allowed === null) return <main className="admin-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking admin access…", "관리자 권한을 확인하고 있습니다…")}</div></main>;
  if (!allowed) return <main className="admin-page"><DemoNotice /><section className="access-page page-wrap"><LockKeyhole size={25} /><MetaLine>{tx(locale, "ADMIN / PRIVATE", "관리자 / 비공개")}</MetaLine><h1>{tx(locale, <>This room is<br /><em>private.</em></>, <>이 공간은<br /><em>비공개입니다.</em></>)}</h1><p>{tx(locale, "Your account does not have an active u.a.u admin role.", "계정에 활성화된 u.a.u 관리자 권한이 없습니다.")}</p></section></main>;

  return <main className="admin-editor-page"><DemoNotice /><div className="admin-editor-shell">
    <header className="admin-editor-top"><div><a className="admin-editor-back" href="/admin">← {tx(locale, "Admin overview", "관리자 개요")}</a><MetaLine>{tx(locale, "ADMIN / SITE EDITOR", "관리자 / 사이트 편집기")}</MetaLine><h1>{tx(locale, <>Shape the<br /><em>public room.</em></>, <>공개된 공간을<br /><em>다듬으세요.</em></>)}</h1></div><div className="admin-editor-actions"><a className="button button-quiet" href="/" target="_blank" rel="noreferrer">{tx(locale, "Open public site", "공개 사이트 열기")} <ExternalLink size={14} /></a><button className="button button-blue" type="button" onClick={() => void saveSettings()} disabled={saving}>{saved ? <Check size={14} /> : <ArrowUpRight size={14} />} {saving ? tx(locale, "Publishing…", "발행 중…") : saved ? tx(locale, "Published", "발행됨") : tx(locale, "Publish changes", "변경사항 발행")}</button></div></header>
    <div className="admin-editor-layout"><aside className="admin-editor-controls"><div className="admin-editor-control-head"><div><MetaLine>{tx(locale, "LIVE CONTROLS", "실시간 컨트롤")}</MetaLine><h2>{tx(locale, "Tune the rhythm.", "리듬을 조절하세요.")}</h2></div><SlidersHorizontal size={18} /></div><p className="admin-editor-copy">{tx(locale, "Move a control and the public preview updates immediately. Publish when the page feels right.", "컨트롤을 움직이면 공개 미리보기가 즉시 바뀝니다. 페이지가 마음에 들면 발행하세요.")}</p>
      <label className="editor-range"><span>{tx(locale, "Display scale", "디스플레이 크기")}<output>{Math.round(draft.displayScale * 100)}%</output></span><input type="range" min="0.82" max="1.2" step="0.01" value={draft.displayScale} onChange={(event) => updateSetting("displayScale", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Body scale", "본문 크기")}<output>{Math.round(draft.bodyScale * 100)}%</output></span><input type="range" min="0.9" max="1.16" step="0.01" value={draft.bodyScale} onChange={(event) => updateSetting("bodyScale", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Content width", "콘텐츠 폭")}<output>{draft.contentWidth}px</output></span><input type="range" min="960" max="1440" step="10" value={draft.contentWidth} onChange={(event) => updateSetting("contentWidth", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Section rhythm", "섹션 간격")}<output>{Math.round(draft.sectionSpace * 100)}%</output></span><input type="range" min="0.7" max="1.35" step="0.01" value={draft.sectionSpace} onChange={(event) => updateSetting("sectionSpace", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Heading line break", "제목 줄 간격")}<output>{draft.headingLeading.toFixed(2)}</output></span><input type="range" min="0.7" max="1.05" step="0.01" value={draft.headingLeading} onChange={(event) => updateSetting("headingLeading", Number(event.target.value))} /></label>
      <button className="editor-reset" type="button" onClick={resetDraft}><RotateCcw size={13} /> {tx(locale, "Discard unsaved changes", "저장하지 않은 변경사항 버리기")}</button>
      {error && <p className="admin-editor-error" role="alert">{error}</p>}
      <div className="admin-editor-note"><strong>{tx(locale, "Next edit layer", "다음 편집 레이어")}</strong><span>{tx(locale, "Copy, images, and section visibility can be added here without changing the public layout.", "공개 레이아웃을 건드리지 않고 문구, 이미지, 섹션 노출도 이곳에서 추가로 편집할 수 있습니다.")}</span></div>
    </aside><section className="admin-editor-preview"><div className="admin-editor-preview-bar"><span><i /> {tx(locale, "Live preview", "실시간 미리보기")}</span><small>{tx(locale, "Changes are local until published", "발행 전까지는 미리보기에만 적용")}</small></div><iframe ref={previewRef} title={tx(locale, "u.a.u public site live preview", "u.a.u 공개 사이트 실시간 미리보기")} src="/?uauSitePreview=1" onLoad={() => previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-settings", settings: draft }, window.location.origin)} /></section></div>
  </div></main>;
}
