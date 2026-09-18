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
import { defaultSiteContent, useSiteContent, type SiteContentRecord } from "../../site-content";

const adminRoles = ["super_admin", "editor", "curator", "support", "finance", "moderator"];

export default function AdminEditorPage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { content, loading: contentLoading } = useSiteContent();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<SiteSettings>(defaultSiteSettings);
  const [contentDraft, setContentDraft] = useState<SiteContentRecord>(defaultSiteContent);
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
    if (!contentLoading) setContentDraft(content);
  }, [content, contentLoading]);

  useEffect(() => {
    previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-settings", settings: draft }, window.location.origin);
  }, [draft]);

  useEffect(() => {
    previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-content", content: contentDraft }, window.location.origin);
  }, [contentDraft]);

  function updateSetting<Key extends keyof SiteSettings>(key: Key, value: SiteSettings[Key]) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateContent(key: string, value: string | boolean) {
    setSaved(false);
    setContentDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings() {
    if (!db) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await Promise.all([
        setDoc(doc(db, "site_settings", "public"), { ...draft, updatedAt: serverTimestamp() }, { merge: true }),
        setDoc(doc(db, "site_content", "home"), { ...contentDraft, updatedAt: serverTimestamp() }, { merge: true }),
      ]);
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
    setContentDraft(content);
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
      <div className="editor-subhead"><MetaLine>{tx(locale, "HOMEPAGE COPY", "홈페이지 문구")}</MetaLine><span>{tx(locale, "Edit the key lines in both languages.", "주요 문구를 두 언어로 편집하세요.")}</span></div>
      {["line1", "emphasis", "line3"].map((part) => <div className="editor-copy-row" key={part}><span>{part === "line1" ? tx(locale, "Hero line 1", "히어로 1행") : part === "emphasis" ? tx(locale, "Hero emphasis", "히어로 강조") : tx(locale, "Hero line 3", "히어로 3행")}</span><input value={String(contentDraft[`home.hero.${part}.en`])} onChange={(event) => updateContent(`home.hero.${part}.en`, event.target.value)} placeholder="English" /><input value={String(contentDraft[`home.hero.${part}.ko`])} onChange={(event) => updateContent(`home.hero.${part}.ko`, event.target.value)} placeholder="한국어" /></div>)}
      <label className="editor-copy-field"><span>{tx(locale, "Hero lede", "히어로 설명")}</span><textarea value={String(contentDraft[`home.hero.lede.${locale}`])} onChange={(event) => updateContent(`home.hero.lede.${locale}`, event.target.value)} /></label>
      <label className="editor-copy-field"><span>{tx(locale, "Intro title", "소개 제목")}</span><textarea value={String(contentDraft[`home.intro.title.${locale}`])} onChange={(event) => updateContent(`home.intro.title.${locale}`, event.target.value)} /></label>
      <label className="editor-copy-field"><span>{tx(locale, "Intro body", "소개 본문")}</span><textarea value={String(contentDraft[`home.intro.body.${locale}`])} onChange={(event) => updateContent(`home.intro.body.${locale}`, event.target.value)} /></label>
      <label className="editor-copy-field"><span>{tx(locale, "Join title", "참여 제목")}</span><textarea value={String(contentDraft[`home.join.title.${locale}`])} onChange={(event) => updateContent(`home.join.title.${locale}`, event.target.value)} /></label>
      <div className="editor-subhead"><MetaLine>{tx(locale, "SECTION VISIBILITY", "섹션 노출")}</MetaLine><span>{tx(locale, "Hide a section without changing its content.", "내용을 지우지 않고 섹션을 숨길 수 있습니다.")}</span></div>
      <div className="editor-toggle-list">{[["radar", "Radar"], ["connection", "Current connection"], ["recap", "Annual recap"], ["selection", "Selection"], ["artists", "Artists"], ["works", "Works"], ["journal", "Journal"], ["faq", "FAQ"], ["join", "Join"]].map(([key, label]) => { const contentKey = `home.section.${key}`; return <label key={key}><input type="checkbox" checked={contentDraft[contentKey] !== false} onChange={(event) => updateContent(contentKey, event.target.checked)} /><span>{label}</span></label>; })}</div>
      <button className="editor-reset" type="button" onClick={resetDraft}><RotateCcw size={13} /> {tx(locale, "Discard unsaved changes", "저장하지 않은 변경사항 버리기")}</button>
      {error && <p className="admin-editor-error" role="alert">{error}</p>}
      <div className="admin-editor-note"><strong>{tx(locale, "Structured editing", "구조화된 편집")}</strong><span>{tx(locale, "This first layer keeps the editorial layout intact while giving you live control over rhythm, copy, and visibility.", "첫 편집 레이어는 에디토리얼 레이아웃을 지키면서 리듬, 문구, 섹션 노출을 실시간으로 제어합니다.")}</span></div>
    </aside><section className="admin-editor-preview"><div className="admin-editor-preview-bar"><span><i /> {tx(locale, "Live preview", "실시간 미리보기")}</span><small>{tx(locale, "Changes are local until published", "발행 전까지는 미리보기에만 적용")}</small></div><iframe ref={previewRef} title={tx(locale, "u.a.u public site live preview", "u.a.u 공개 사이트 실시간 미리보기")} src="/?uauSitePreview=1" onLoad={() => { previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-settings", settings: draft }, window.location.origin); previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-content", content: contentDraft }, window.location.origin); }} /></section></div>
  </div></main>;
}
