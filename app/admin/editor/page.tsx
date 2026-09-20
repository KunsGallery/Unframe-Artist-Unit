"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowUpRight, Check, ExternalLink, ImagePlus, LockKeyhole, Monitor, RotateCcw, Smartphone, SlidersHorizontal, Tablet } from "lucide-react";
import { DemoNotice, MetaLine } from "../../components";
import { R2FontUploader } from "../../components/r2-font-uploader";
import { useAuth } from "../../auth-provider";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { defaultSiteSettings, fontPresets, normalizeSiteSettings, useSiteSettings, type SiteSettings } from "../../site-settings";
import { defaultSiteContent, useSiteContent, type SiteContentRecord } from "../../site-content";
import { sitePageById, sitePages, type SitePageId } from "../../site-pages";
import { getDefaultSitePageContent, normalizeSitePageContent, type SitePageContent } from "../../site-page-content";
import { uploadToR2 } from "../../r2-upload";

const adminRoles = ["super_admin", "editor", "curator", "support", "finance", "moderator"];
const sectionLabels: Record<string, { en: string; ko: string }> = {
  radar: { en: "Radar", ko: "Radar" },
  connection: { en: "Current connection", ko: "현재 연결" },
  recap: { en: "Annual recap", ko: "연간 리캡" },
  selection: { en: "Selection", ko: "셀렉션" },
  artists: { en: "Artists", ko: "아티스트" },
  works: { en: "Works", ko: "작품" },
  journal: { en: "Journal", ko: "저널" },
  faq: { en: "FAQ", ko: "FAQ" },
  join: { en: "Join", ko: "함께하기" },
  directory: { en: "Artist directory", ko: "아티스트 디렉터리" },
  filters: { en: "Filters", ko: "필터" },
  archive: { en: "Archive", ko: "아카이브" },
  list: { en: "Project list", ko: "프로젝트 목록" },
  manifesto: { en: "Manifesto", ko: "매니페스토" },
  map: { en: "Connection map", ko: "연결 지도" },
  call: { en: "Open call", ko: "오픈 콜" },
  calendar: { en: "Calendar", ko: "캘린더" },
  opportunities: { en: "Opportunities", ko: "기회" },
  note: { en: "Editorial note", ko: "에디토리얼 노트" },
  story: { en: "Story", ko: "스토리" },
  options: { en: "Entry options", ko: "참여 방법" },
  context: { en: "Context", ko: "맥락" },
  participants: { en: "Participants", ko: "참여자" },
  timeline: { en: "Timeline", ko: "타임라인" },
  work: { en: "Work", ko: "작품" },
};

function getSectionLabel(sectionId: string | null, locale: "en" | "ko") {
  if (!sectionId) return locale === "ko" ? "전체 페이지" : "Whole page";
  return sectionLabels[sectionId]?.[locale] || sectionId.replace(/[-_]/g, " ");
}

export default function AdminEditorPage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { content, loading: contentLoading } = useSiteContent();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [previewPageId, setPreviewPageId] = useState<SitePageId>("home");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<SiteSettings>(defaultSiteSettings);
  const [loadedDraft, setLoadedDraft] = useState<SiteSettings>(defaultSiteSettings);
  const [pageContentDraft, setPageContentDraft] = useState<SitePageContent>(() => getDefaultSitePageContent("home"));
  const [loadedPageContent, setLoadedPageContent] = useState<SitePageContent>(() => getDefaultSitePageContent("home"));
  const [contentDraft, setContentDraft] = useState<SiteContentRecord>(defaultSiteContent);
  const [pageSettingsLoading, setPageSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [imageTarget, setImageTarget] = useState<{ key: string; label: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const currentPage = sitePageById[previewPageId];
  const isHome = previewPageId === "home";

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
    if (!contentLoading) setContentDraft(content);
  }, [content, contentLoading]);

  useEffect(() => {
    if (settingsLoading) return;
    const fallback = settings;
    if (!db) {
      setDraft(fallback);
      setLoadedDraft(fallback);
      const nextContent = getDefaultSitePageContent(previewPageId);
      setPageContentDraft(nextContent);
      setLoadedPageContent(nextContent);
      setPageSettingsLoading(false);
      return;
    }
    setPageSettingsLoading(true);
    return onSnapshot(doc(db, "site_page_settings", previewPageId), (snapshot) => {
      const next = snapshot.exists() ? normalizeSiteSettings(snapshot.data()) : fallback;
      setDraft(next);
      setLoadedDraft(next);
      const nextContent = snapshot.exists() ? normalizeSitePageContent(snapshot.data(), previewPageId) : getDefaultSitePageContent(previewPageId);
      setPageContentDraft(nextContent);
      setLoadedPageContent(nextContent);
      setPageSettingsLoading(false);
    }, () => {
      setDraft(fallback);
      setLoadedDraft(fallback);
      const nextContent = getDefaultSitePageContent(previewPageId);
      setPageContentDraft(nextContent);
      setLoadedPageContent(nextContent);
      setPageSettingsLoading(false);
    });
  }, [previewPageId, settings, settingsLoading]);

  useEffect(() => {
    const handlePreviewRoute = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "uau-editor-route") return;
      const nextPageId = event.data.pageId;
      if (typeof nextPageId === "string" && Object.prototype.hasOwnProperty.call(sitePageById, nextPageId)) {
        setPreviewPageId(nextPageId as SitePageId);
      }
    };
    window.addEventListener("message", handlePreviewRoute);
    return () => window.removeEventListener("message", handlePreviewRoute);
  }, []);

  useEffect(() => {
    const handlePreviewSection = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "uau-editor-section") return;
      if (event.data.pageId === previewPageId && typeof event.data.sectionId === "string") {
        setActiveSection(event.data.sectionId);
      }
    };
    window.addEventListener("message", handlePreviewSection);
    return () => window.removeEventListener("message", handlePreviewSection);
  }, [previewPageId]);

  useEffect(() => {
    const handleInlineText = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== previewRef.current?.contentWindow || event.data?.type !== "uau-editor-inline-text") return;
      if (event.data.pageId !== previewPageId || typeof event.data.value !== "string") return;
      const language = event.data.language === "ko" ? "ko" : event.data.language === "en" ? "en" : null;
      const key = typeof event.data.key === "string" ? event.data.key : "";
      if (!language || !key) return;
      if (event.data.scope === "pageContent" && ["eyebrow", "title", "emphasis", "description", "primaryLabel", "secondaryLabel"].includes(key)) {
        updatePageCopy(key as "eyebrow" | "title" | "emphasis" | "description" | "primaryLabel" | "secondaryLabel", language, event.data.value);
      }
      if (event.data.scope === "siteContent" && isHome && /^home\.[a-z-]+\.[a-z-]+$/i.test(key)) {
        updateContent(`${key}.${language}`, event.data.value);
      }
    };
    const handlePreviewImage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== previewRef.current?.contentWindow || event.data?.type !== "uau-editor-inline-image") return;
      if (typeof event.data.key !== "string" || !event.data.key) return;
      setImageTarget({ key: event.data.key, label: typeof event.data.label === "string" ? event.data.label : tx(locale, "Image", "이미지") });
      window.setTimeout(() => imageInputRef.current?.click(), 0);
    };
    window.addEventListener("message", handleInlineText);
    window.addEventListener("message", handlePreviewImage);
    return () => {
      window.removeEventListener("message", handleInlineText);
      window.removeEventListener("message", handlePreviewImage);
    };
  }, [isHome, locale, previewPageId]);

  useEffect(() => {
    previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-settings", settings: draft, pageId: previewPageId }, window.location.origin);
  }, [draft, previewPageId]);

  useEffect(() => {
    previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-page-content", content: pageContentDraft, pageId: previewPageId }, window.location.origin);
  }, [pageContentDraft, previewPageId]);

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

  function updatePageCopy(key: "eyebrow" | "title" | "emphasis" | "description" | "primaryLabel" | "secondaryLabel", language: "en" | "ko", value: string) {
    setSaved(false);
    setPageContentDraft((current) => ({ ...current, [key]: { ...current[key], [language]: value } }));
  }

  function updatePageField(key: "primaryHref" | "secondaryHref", value: string) {
    setSaved(false);
    setPageContentDraft((current) => ({ ...current, [key]: value }));
  }

  async function handlePreviewImage(file?: File) {
    if (!file || !imageTarget) return;
    const accepted = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!accepted.includes(file.type)) {
      setError(tx(locale, "Choose a JPG, PNG, WebP, or AVIF image.", "JPG, PNG, WebP 또는 AVIF 이미지를 선택해 주세요."));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError(tx(locale, "This image must be smaller than 50MB.", "이미지는 50MB보다 작아야 합니다."));
      return;
    }
    setImageUploading(true);
    setError(null);
    try {
      const uploaded = await uploadToR2(file, { assetType: "cover", entityId: `site-${previewPageId}` });
      setDraft((current) => ({ ...current, imageOverrides: { ...current.imageOverrides, [imageTarget.key]: uploaded.publicUrl } }));
      setSaved(false);
      setImageTarget(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : tx(locale, "The image could not be uploaded.", "이미지를 업로드하지 못했습니다."));
    } finally {
      setImageUploading(false);
    }
  }

  function openPreviewPage(pageId: SitePageId) {
    setSaved(false);
    setActiveSection(null);
    setPreviewPageId(pageId);
    const path = sitePageById[pageId].previewPath;
    const separator = path.includes("?") ? "&" : "?";
    if (previewRef.current) previewRef.current.src = `${path}${separator}uauSitePreview=1`;
  }

  async function saveSettings() {
    if (!db) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const writes = [
        setDoc(doc(db, "site_page_settings", previewPageId), { ...draft, content: pageContentDraft, pageId: previewPageId, updatedAt: serverTimestamp() }, { merge: true }),
      ];
      if (isHome) {
        writes.push(setDoc(doc(db, "site_settings", "public"), { ...draft, updatedAt: serverTimestamp() }, { merge: true }));
        writes.push(setDoc(doc(db, "site_content", "home"), { ...contentDraft, updatedAt: serverTimestamp() }, { merge: true }));
      }
      await Promise.all(writes);
      setLoadedDraft(draft);
      setLoadedPageContent(pageContentDraft);
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
    setDraft(loadedDraft);
    setPageContentDraft(loadedPageContent);
    if (isHome) setContentDraft(content);
  }

  if (authLoading || allowed === null) return <main className="admin-page"><DemoNotice /><div className="auth-guard" role="status" aria-live="polite">{tx(locale, "Checking admin access…", "관리자 권한을 확인하고 있습니다…")}</div></main>;
  if (!allowed) return <main className="admin-page"><DemoNotice /><section className="access-page page-wrap"><LockKeyhole size={25} /><MetaLine>{tx(locale, "ADMIN / PRIVATE", "관리자 / 비공개")}</MetaLine><h1>{tx(locale, <>This room is<br /><em>private.</em></>, <>이 공간은<br /><em>비공개입니다.</em></>)}</h1><p>{tx(locale, "Your account does not have an active u.a.u admin role.", "계정에 활성화된 u.a.u 관리자 권한이 없습니다.")}</p><div className="admin-access-actions"><a className="button button-blue" href="/login">{tx(locale, "Sign in to continue", "로그인하고 계속하기")} <ArrowUpRight size={15} /></a><a className="text-link" href="/">{tx(locale, "Return to public archive", "공개 아카이브로 돌아가기")}</a></div></section></main>;

  return <main className="admin-editor-page"><DemoNotice /><div className="admin-editor-shell">
    <header className="admin-editor-top"><div><a className="admin-editor-back" href="/admin">← {tx(locale, "Admin overview", "관리자 개요")}</a><MetaLine>{tx(locale, "ADMIN / SITE EDITOR", "관리자 / 사이트 편집기")}</MetaLine><h1>{tx(locale, <>Shape the<br /><em>public room.</em></>, <>공개된 공간을<br /><em>다듬으세요.</em></>)}</h1></div><div className="admin-editor-actions"><a className="button button-quiet" href={currentPage.previewPath} target="_blank" rel="noreferrer">{tx(locale, "Open current page", "현재 페이지 열기")} <ExternalLink size={14} /></a><button className="button button-blue" type="button" onClick={() => void saveSettings()} disabled={saving || pageSettingsLoading}>{saved ? <Check size={14} /> : <ArrowUpRight size={14} />} {saving ? tx(locale, "Publishing…", "발행 중…") : saved ? tx(locale, "Published", "발행됨") : tx(locale, "Publish changes", "변경사항 발행")}</button></div></header>
    <div className="admin-editor-layout"><aside className="admin-editor-controls"><div className="admin-editor-control-head"><div><MetaLine>{tx(locale, "LIVE CONTROLS", "실시간 컨트롤")}</MetaLine><h2>{tx(locale, "Tune this room.", "이 공간을 조절하세요.")}</h2></div><SlidersHorizontal size={18} /></div><p className="admin-editor-copy">{tx(locale, "The preview and this control room follow the same page. Change the page in the preview or here, then publish only when it feels right.", "미리보기와 이 컨트롤 룸은 같은 페이지를 바라봅니다. 미리보기나 여기서 페이지를 바꾸고, 마음에 들 때만 발행하세요.")}</p><div className="editor-page-switcher"><label className="editor-select-field"><span>{tx(locale, "Editing page", "편집 중인 페이지")}</span><select value={previewPageId} onChange={(event) => openPreviewPage(event.target.value as SitePageId)}>{sitePages.map((page) => <option key={page.id} value={page.id}>{locale === "ko" ? page.labelKo : page.label}</option>)}</select></label><p>{locale === "ko" ? currentPage.descriptionKo : currentPage.description}</p></div>
      <div className="editor-active-section" aria-live="polite"><span>{tx(locale, "EDITING FOCUS", "현재 편집 초점")}</span><strong>{getSectionLabel(activeSection, locale)}</strong><small>{tx(locale, "Move over a section in the preview to sync its controls.", "미리보기에서 섹션 위에 마우스를 올리면 해당 컨트롤과 동기화됩니다.")}</small></div><label className="editor-range"><span>{tx(locale, "Display scale", "디스플레이 크기")}<output>{Math.round(draft.displayScale * 100)}%</output></span><input type="range" min="0.55" max="1.65" step="0.01" value={draft.displayScale} onChange={(event) => updateSetting("displayScale", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Body scale", "본문 크기")}<output>{Math.round(draft.bodyScale * 100)}%</output></span><input type="range" min="0.55" max="1.6" step="0.01" value={draft.bodyScale} onChange={(event) => updateSetting("bodyScale", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Content width", "콘텐츠 폭")}<output>{draft.contentWidth}px</output></span><input type="range" min="520" max="1900" step="10" value={draft.contentWidth} onChange={(event) => updateSetting("contentWidth", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Section rhythm", "섹션 간격")}<output>{Math.round(draft.sectionSpace * 100)}%</output></span><input type="range" min="0.25" max="2.4" step="0.01" value={draft.sectionSpace} onChange={(event) => updateSetting("sectionSpace", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Heading line break", "제목 줄 간격")}<output>{draft.headingLeading.toFixed(2)}</output></span><input type="range" min="0.5" max="1.4" step="0.01" value={draft.headingLeading} onChange={(event) => updateSetting("headingLeading", Number(event.target.value))} /></label>
      <div className="editor-subhead"><MetaLine>{tx(locale, "LAYOUT & TYPE", "레이아웃과 타이포그래피")}</MetaLine><span>{tx(locale, "Shape the first viewport and the reading pace.", "첫 화면의 비율과 읽는 속도를 조절하세요.")}</span></div>
      <label className="editor-range"><span>{tx(locale, "Hero height", "첫 화면 높이")}<output>{draft.heroHeight}px</output></span><input type="range" min="320" max="1400" step="10" value={draft.heroHeight} onChange={(event) => updateSetting("heroHeight", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Hero gap", "첫 화면 간격")}<output>{draft.heroGap}px</output></span><input type="range" min="0" max="420" step="5" value={draft.heroGap} onChange={(event) => updateSetting("heroGap", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Hero title scale", "첫 화면 제목 크기")}<output>{Math.round(draft.heroCopyScale * 100)}%</output></span><input type="range" min="0.45" max="1.85" step="0.01" value={draft.heroCopyScale} onChange={(event) => updateSetting("heroCopyScale", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Body line height", "본문 줄 간격")}<output>{draft.bodyLeading.toFixed(2)}</output></span><input type="range" min="0.85" max="2.4" step="0.01" value={draft.bodyLeading} onChange={(event) => updateSetting("bodyLeading", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Grid gap", "카드 간격")}<output>{draft.gridGap}px</output></span><input type="range" min="0" max="120" step="1" value={draft.gridGap} onChange={(event) => updateSetting("gridGap", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Corner radius", "모서리 둥글기")}<output>{draft.radius}px</output></span><input type="range" min="0" max="80" step="1" value={draft.radius} onChange={(event) => updateSetting("radius", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Image saturation", "이미지 채도")}<output>{Math.round(draft.imageSaturation * 100)}%</output></span><input type="range" min="0" max="2.2" step="0.01" value={draft.imageSaturation} onChange={(event) => updateSetting("imageSaturation", Number(event.target.value))} /></label>
      <div className="editor-subhead"><MetaLine>{tx(locale, "FONT SYSTEM", "폰트 시스템")}</MetaLine><span>{tx(locale, "Choose a curated web-font pairing, then optionally point to a public Cloudflare R2 font URL.", "검수된 웹폰트 조합을 선택한 뒤, 필요하면 공개된 Cloudflare R2 폰트 URL을 연결하세요.")}</span></div>
      <label className="editor-select-field"><span>{tx(locale, "Font preset", "폰트 프리셋")}</span><select value={draft.fontPreset} onChange={(event) => updateSetting("fontPreset", event.target.value as SiteSettings["fontPreset"])}>{Object.entries(fontPresets).map(([key, preset]) => <option key={key} value={key}>{preset.label}</option>)}</select></label>
      <label className="editor-range"><span>{tx(locale, "Font scale", "폰트 전체 크기")}<output>{Math.round(draft.fontScale * 100)}%</output></span><input type="range" min="0.7" max="1.45" step="0.01" value={draft.fontScale} onChange={(event) => updateSetting("fontScale", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Heading weight", "제목 굵기")}<output>{draft.headingWeight}</output></span><input type="range" min="300" max="700" step="100" value={draft.headingWeight} onChange={(event) => updateSetting("headingWeight", Number(event.target.value))} /></label>
      <label className="editor-range"><span>{tx(locale, "Heading tracking", "제목 자간")}<output>{draft.letterSpacing.toFixed(3)}em</output></span><input type="range" min="-0.09" max="0.08" step="0.005" value={draft.letterSpacing} onChange={(event) => updateSetting("letterSpacing", Number(event.target.value))} /></label>
      <div className="editor-font-upload-grid"><R2FontUploader value={draft.headingFontUrl} label={tx(locale, "Heading font", "제목 폰트")} description={tx(locale, "Used for large editorial headings.", "큰 에디토리얼 제목에 적용됩니다.")} chooseLabel={tx(locale, "Choose heading font", "제목 폰트 선택")} onChange={(url) => updateSetting("headingFontUrl", url)} /><R2FontUploader value={draft.bodyFontUrl} label={tx(locale, "Body font", "본문 폰트")} description={tx(locale, "Used for body copy and interface text.", "본문과 인터페이스 문구에 적용됩니다.")} chooseLabel={tx(locale, "Choose body font", "본문 폰트 선택")} onChange={(url) => updateSetting("bodyFontUrl", url)} /></div>
      <div className="editor-subhead"><MetaLine>{tx(locale, "PAGE CONTENT", "페이지 콘텐츠")}</MetaLine><span>{tx(locale, "Edit the shared page introduction, actions, and section behavior for this route.", "이 페이지의 소개 문구와 액션, 섹션 동작을 편집하세요.")}</span></div>
      {["eyebrow", "title", "emphasis", "description"].map((key) => <div className="editor-copy-row" key={key}><span>{key === "eyebrow" ? tx(locale, "Eyebrow", "상단 라벨") : key === "title" ? tx(locale, "Title", "제목") : key === "emphasis" ? tx(locale, "Title emphasis", "제목 강조") : tx(locale, "Description", "설명")}</span><textarea value={pageContentDraft[key as "eyebrow" | "title" | "emphasis" | "description"].en} onChange={(event) => updatePageCopy(key as "eyebrow" | "title" | "emphasis" | "description", "en", event.target.value)} placeholder="English" /><textarea value={pageContentDraft[key as "eyebrow" | "title" | "emphasis" | "description"].ko} onChange={(event) => updatePageCopy(key as "eyebrow" | "title" | "emphasis" | "description", "ko", event.target.value)} placeholder="한국어" /></div>)}
      <div className="editor-copy-row"><span>{tx(locale, "Primary action", "첫 번째 액션")}</span><input value={pageContentDraft.primaryLabel.en} onChange={(event) => updatePageCopy("primaryLabel", "en", event.target.value)} placeholder="English label" /><input value={pageContentDraft.primaryLabel.ko} onChange={(event) => updatePageCopy("primaryLabel", "ko", event.target.value)} placeholder="한국어 라벨" /><input value={pageContentDraft.primaryHref} onChange={(event) => updatePageField("primaryHref", event.target.value)} placeholder="/artists" /></div>
      <div className="editor-copy-row"><span>{tx(locale, "Secondary action", "두 번째 액션")}</span><input value={pageContentDraft.secondaryLabel.en} onChange={(event) => updatePageCopy("secondaryLabel", "en", event.target.value)} placeholder="English label" /><input value={pageContentDraft.secondaryLabel.ko} onChange={(event) => updatePageCopy("secondaryLabel", "ko", event.target.value)} placeholder="한국어 라벨" /><input value={pageContentDraft.secondaryHref} onChange={(event) => updatePageField("secondaryHref", event.target.value)} placeholder="/connections" /></div>
      <label className="editor-copy-field"><span>{tx(locale, "Section order · comma separated", "섹션 순서 · 쉼표로 구분")}</span><input value={pageContentDraft.sectionOrder.join(", ")} onChange={(event) => setPageContentDraft((current) => ({ ...current, sectionOrder: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} /></label>
      <div className="editor-toggle-list">{pageContentDraft.sectionOrder.map((sectionId) => <label key={sectionId}><input type="checkbox" checked={!pageContentDraft.hiddenSections.includes(sectionId)} onChange={(event) => setPageContentDraft((current) => ({ ...current, hiddenSections: event.target.checked ? current.hiddenSections.filter((item) => item !== sectionId) : [...current.hiddenSections, sectionId] }))} /><span>{sectionId}</span></label>)}</div>
      {isHome ? <>
      <div className="editor-subhead"><MetaLine>{tx(locale, "HOMEPAGE COPY", "홈페이지 문구")}</MetaLine><span>{tx(locale, "Edit the key lines in both languages.", "주요 문구를 두 언어로 편집하세요.")}</span></div>
      {["line1", "emphasis", "line3"].map((part) => <div className="editor-copy-row" key={part}><span>{part === "line1" ? tx(locale, "Hero line 1", "히어로 1행") : part === "emphasis" ? tx(locale, "Hero emphasis", "히어로 강조") : tx(locale, "Hero line 3", "히어로 3행")}</span><input value={String(contentDraft[`home.hero.${part}.en`])} onChange={(event) => updateContent(`home.hero.${part}.en`, event.target.value)} placeholder="English" /><input value={String(contentDraft[`home.hero.${part}.ko`])} onChange={(event) => updateContent(`home.hero.${part}.ko`, event.target.value)} placeholder="한국어" /></div>)}
      <label className="editor-copy-field"><span>{tx(locale, "Hero lede", "히어로 설명")}</span><textarea value={String(contentDraft[`home.hero.lede.${locale}`])} onChange={(event) => updateContent(`home.hero.lede.${locale}`, event.target.value)} /></label>
      <label className="editor-copy-field"><span>{tx(locale, "Intro title", "소개 제목")}</span><textarea value={String(contentDraft[`home.intro.title.${locale}`])} onChange={(event) => updateContent(`home.intro.title.${locale}`, event.target.value)} /></label>
      <label className="editor-copy-field"><span>{tx(locale, "Intro body", "소개 본문")}</span><textarea value={String(contentDraft[`home.intro.body.${locale}`])} onChange={(event) => updateContent(`home.intro.body.${locale}`, event.target.value)} /></label>
      <label className="editor-copy-field"><span>{tx(locale, "Join title", "참여 제목")}</span><textarea value={String(contentDraft[`home.join.title.${locale}`])} onChange={(event) => updateContent(`home.join.title.${locale}`, event.target.value)} /></label>
      <div className="editor-subhead"><MetaLine>{tx(locale, "SECTION VISIBILITY", "섹션 노출")}</MetaLine><span>{tx(locale, "Hide a section without changing its content.", "내용을 지우지 않고 섹션을 숨길 수 있습니다.")}</span></div>
      <div className="editor-toggle-list">{[["radar", "Radar"], ["connection", "Current connection"], ["recap", "Annual recap"], ["selection", "Selection"], ["artists", "Artists"], ["works", "Works"], ["journal", "Journal"], ["faq", "FAQ"], ["join", "Join"]].map(([key, label]) => { const contentKey = `home.section.${key}`; return <label key={key}><input type="checkbox" checked={contentDraft[contentKey] !== false} onChange={(event) => updateContent(contentKey, event.target.checked)} /><span>{label}</span></label>; })}</div></> : <div className="editor-page-note"><MetaLine>{tx(locale, "PAGE-SPECIFIC SETTINGS", "페이지별 설정")}</MetaLine><p>{tx(locale, "Copy and section visibility stay in the homepage editor for now. This page already has its own saved design settings, ready for the next content layer.", "문구와 섹션 노출은 현재 홈페이지 편집기에 유지됩니다. 이 페이지는 이미 독립적인 디자인 설정을 저장하며, 다음 콘텐츠 편집 레이어를 확장할 수 있습니다.")}</p></div>}
      <button className="editor-reset" type="button" onClick={resetDraft}><RotateCcw size={13} /> {tx(locale, "Discard unsaved changes", "저장하지 않은 변경사항 버리기")}</button>
      {error && <p className="admin-editor-error" role="alert">{error}</p>}
      <div className="admin-editor-note"><strong>{tx(locale, "Structured editing", "구조화된 편집")}</strong><span>{tx(locale, "This first layer keeps the editorial layout intact while giving you live control over rhythm, copy, and visibility.", "첫 편집 레이어는 에디토리얼 레이아웃을 지키면서 리듬, 문구, 섹션 노출을 실시간으로 제어합니다.")}</span></div>
      </aside><section className="admin-editor-preview"><div className="admin-editor-preview-bar"><div><span><i /> {tx(locale, "Live preview", "실시간 미리보기")} · {locale === "ko" ? currentPage.labelKo : currentPage.label}</span><small>{tx(locale, "Click text to edit · click an image to replace it", "텍스트를 클릭해 수정 · 이미지를 클릭해 교체")}</small></div><div className="editor-viewport-switcher" role="group" aria-label={tx(locale, "Preview size", "미리보기 크기")}>{([["desktop", Monitor, "Desktop", "데스크톱"], ["tablet", Tablet, "Tablet", "태블릿"], ["mobile", Smartphone, "Mobile", "모바일"]] as const).map(([mode, Icon, en, ko]) => <button key={mode} type="button" className={previewMode === mode ? "is-active" : ""} aria-pressed={previewMode === mode} onClick={() => setPreviewMode(mode)}><Icon size={14} /> {tx(locale, en, ko)}</button>)}</div></div><div className={`admin-editor-preview-canvas is-${previewMode}`}><iframe className="admin-editor-preview-frame" ref={previewRef} title={tx(locale, "u.a.u public site live preview", "u.a.u 공개 사이트 실시간 미리보기")} src="/?uauSitePreview=1" onLoad={() => { previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-settings", settings: draft, pageId: previewPageId }, window.location.origin); previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-page-content", content: pageContentDraft, pageId: previewPageId }, window.location.origin); previewRef.current?.contentWindow?.postMessage({ type: "uau-site-preview-content", content: contentDraft }, window.location.origin); }} /></div><input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(event) => { void handlePreviewImage(event.target.files?.[0]); event.currentTarget.value = ""; }} />{imageUploading && <p className="editor-image-upload-status" role="status" aria-live="polite"><ImagePlus size={14} /> {tx(locale, "Replacing image…", "이미지를 교체하는 중…")}</p>}</section></div>
  </div></main>;
}
