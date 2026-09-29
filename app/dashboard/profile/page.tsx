"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Eye, ExternalLink, LayoutTemplate, RefreshCw, Plus, Trash2, FileDown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../../components";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { accountTypes, roleRequiresApproval, saveProfileAndPublicSite, useArtistMembership, useMembership, useUserProfile, type ArtistSiteAccent, type ArtistSiteArchiveEntry, type ArtistInspiration, type ArtistSiteExhibition, type ArtistSiteSection, type ArtistSiteTemplate, type ArtistSiteWork, type UauAccountType } from "../../profile";
import { artistSiteAccentLabels, artistSiteSectionLabels, defaultArtistSiteSections, normalizeArtistSiteSections } from "../../artist/site-config";
import { DashboardSidebar } from "../dashboard-sidebar";
import { R2ImageUploader } from "../../components/r2-image-uploader";
import { R2AudioUploader } from "../../components/r2-audio-uploader";
import { R2VideoUploader } from "../../components/r2-video-uploader";
import { ArtistCvEditor } from "../../components/artist-cv-editor";
import { artistCvCategories, artistCvCategoryLabels, safeExternalUrl } from "../../artist/cv";
import "../../artist-growth.css";
import "../../artist-growth-motion.css";
import { getArtistProgress } from "../../artist-progress";
import { db } from "../../firebase-client";
import type { PublicProfile } from "../../profile";

type ProfileForm = {
  displayName: string;
  artistName: string;
  accountType: UauAccountType;
  basedInCity: string;
  country: string;
  practice: string;
  bio: string;
  artistStatement: string;
  artistCv: string;
  artistAudioUrl: string;
  siteArchive: ArtistSiteArchiveEntry[];
  siteInspirations: ArtistInspiration[];
  collaborationOpen: boolean;
  contactPurposes: string[];
  websiteUrl: string;
  profileImageUrl: string;
  siteCoverImageUrl: string;
  publicSlug: string;
  siteTemplate: ArtistSiteTemplate;
  siteSections: ArtistSiteSection[];
  siteAccent: ArtistSiteAccent;
  siteWorks: ArtistSiteWork[];
  siteExhibitions: ArtistSiteExhibition[];
  sitePublished: boolean;
  showExhibitions: boolean;
  showCV: boolean;
  showAbout: boolean;
};

const emptyForm: ProfileForm = {
  displayName: "",
  artistName: "",
  accountType: "artist",
  basedInCity: "",
  country: "",
  practice: "",
  bio: "",
  artistStatement: "",
  artistCv: "",
  artistAudioUrl: "",
  siteArchive: [],
  siteInspirations: [],
  collaborationOpen: false,
  contactPurposes: [],
  websiteUrl: "",
  profileImageUrl: "",
  siteCoverImageUrl: "",
  publicSlug: "",
  siteTemplate: "editorial",
  siteSections: [...defaultArtistSiteSections],
  siteAccent: "blue",
  siteWorks: [],
  siteExhibitions: [],
  sitePublished: false,
  showExhibitions: true,
  showCV: true,
  showAbout: true,
};

const templateChoices: Array<{ value: ArtistSiteTemplate; en: string; ko: string; noteEn: string; noteKo: string }> = [
  { value: "gallery", en: "Gallery", ko: "갤러리", noteEn: "One work, one atmosphere.", noteKo: "하나의 작품, 하나의 분위기." },
  { value: "editorial", en: "Editorial", ko: "에디토리얼", noteEn: "A voice with room to breathe.", noteKo: "말과 이미지가 숨 쉬는 구조." },
  { value: "archive", en: "Archive", ko: "아카이브", noteEn: "A clear index of the practice.", noteKo: "작업을 선명하게 정리하는 구조." },
];

const fiftyChars = 50;

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, fiftyChars);
}

function getPublicSlug(value: string, uid: string) {
  return toSlug(value) || `artist-${uid.slice(0, 8).toLowerCase()}`;
}

export default function DashboardProfilePage({ managedSlug }: { managedSlug?: string }) {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const { artist } = useArtistMembership(user?.uid);
  const { membership } = useMembership(user?.uid);
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managedProfile, setManagedProfile] = useState<PublicProfile | null>(null);
  const [managedLoading, setManagedLoading] = useState(Boolean(managedSlug));
  const [adminAccess, setAdminAccess] = useState(!managedSlug);
  const formDirtyRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!managedSlug) return;
    if (!user || !db) { setAdminAccess(false); setManagedLoading(false); return; }
    let stopProfile: (() => void) | undefined;
    const stopAdmin = onSnapshot(doc(db, "admins", user.uid), (admin) => {
      const allowed = admin.exists() && admin.data()?.active === true && admin.data()?.role === "super_admin";
      setAdminAccess(allowed);
      if (!allowed) { setManagedLoading(false); return; }
      stopProfile?.();
      stopProfile = onSnapshot(doc(db!, "public_profiles", managedSlug), (snapshot) => {
        const next = snapshot.exists() ? { ...snapshot.data(), slug: snapshot.id } as PublicProfile : null;
        setManagedProfile(next?.isDemonstration ? null : next);
        setManagedLoading(false);
      }, () => setManagedLoading(false));
    }, () => { setAdminAccess(false); setManagedLoading(false); });
    return () => { stopAdmin(); stopProfile?.(); };
  }, [managedSlug, user]);

  useEffect(() => {
      if (managedSlug) {
      if (managedLoading || !adminAccess || formDirtyRef.current) return;
      if (!managedProfile) {
        setForm({ ...emptyForm, publicSlug: managedSlug });
        return;
      }
      const source = managedProfile;
      setForm({ ...emptyForm, ...source, displayName: source.displayName || "", artistName: source.artistName || "", accountType: "artist", publicSlug: source.slug || managedSlug, sitePublished: source.published === true, siteSections: normalizeArtistSiteSections(source.siteSections), siteWorks: source.siteWorks || [], siteExhibitions: source.siteExhibitions || [], siteArchive: source.siteArchive || [], siteInspirations: source.siteInspirations || [], contactPurposes: source.contactPurposes || [], collaborationOpen: source.collaborationOpen === true });
      return;
    }
    if (!profile && !user) return;
    if (formDirtyRef.current) return;
    setForm({
      displayName: profile?.displayName || user?.displayName || "",
      artistName: profile?.artistName || "",
      accountType: profile?.accountType || "artist",
      basedInCity: profile?.basedInCity || "",
      country: profile?.country || "",
      practice: profile?.practice || "",
      bio: profile?.bio || "",
      artistStatement: profile?.artistStatement || "",
      artistCv: profile?.artistCv || "",
      artistAudioUrl: profile?.artistAudioUrl || "",
      siteArchive: profile?.siteArchive || [],
      siteInspirations: profile?.siteInspirations || [],
      collaborationOpen: profile?.collaborationOpen === true,
      contactPurposes: profile?.contactPurposes || [],
      websiteUrl: profile?.websiteUrl || "",
      profileImageUrl: profile?.profileImageUrl || "",
      siteCoverImageUrl: profile?.siteCoverImageUrl || "",
      publicSlug: profile?.publicSlug || getPublicSlug(profile?.displayName || user?.displayName || "", user?.uid || "artist"),
      siteTemplate: profile?.siteTemplate || "editorial",
      siteSections: normalizeArtistSiteSections(profile?.siteSections),
      siteAccent: profile?.siteAccent || "blue",
      siteWorks: profile?.siteWorks || [],
      siteExhibitions: profile?.siteExhibitions || [],
      sitePublished: profile?.sitePublished === true,
      showExhibitions: profile?.showExhibitions !== false,
      showCV: profile?.showCV !== false,
      showAbout: profile?.showAbout !== false,
    });
  }, [profile, user, managedSlug, managedLoading, managedProfile, adminAccess]);

  const roleLabel = useMemo(() => accountTypes.find((role) => role.value === form.accountType), [form.accountType]);
  const localProgress = useMemo(() => getArtistProgress({ uid: user?.uid || "draft", ...form }), [form, user?.uid]);
  const contactFeatureOpen = localProgress.milestones.find((item) => item.id === "contact-form")?.unlocked === true;
  const portfolioFeatureOpen = localProgress.milestones.find((item) => item.id === "portfolio-pdf")?.unlocked === true;
  const publicUrl = user ? `/artist/${getPublicSlug(form.publicSlug, user.uid)}` : "";

  function setField<K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) {
    formDirtyRef.current = true;
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setError(null);
  }

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.siteSections.length) return;
    const nextSections = [...form.siteSections];
    [nextSections[index], nextSections[nextIndex]] = [nextSections[nextIndex], nextSections[index]];
    setField("siteSections", nextSections);
  }

  function toggleSection(section: ArtistSiteSection) {
    if (section === "works") return;
    const nextSections = form.siteSections.includes(section)
      ? form.siteSections.filter((item) => item !== section)
      : [...form.siteSections, section];
    setField("siteSections", nextSections);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      if (!form.displayName.trim()) throw new Error(tx(locale, "Add a display name before publishing your site.", "페이지를 공개하기 전에 표시 이름을 입력해 주세요."));
      if (form.siteExhibitions.some((entry) => entry.externalUrl?.trim() && !safeExternalUrl(entry.externalUrl))) throw new Error(tx(locale, "CV links must use an http:// or https:// address.", "CV 링크는 http:// 또는 https:// 주소를 입력해 주세요."));
      const slug = managedSlug || getPublicSlug(form.publicSlug || form.displayName, user.uid);
      if (managedSlug) {
        if (!db || !adminAccess || (form.publicSlug && form.publicSlug !== managedSlug)) throw new Error(tx(locale, "관리자 권한 또는 페이지 주소를 확인해 주세요.", "관리자 권한 또는 페이지 주소를 확인해 주세요."));
        await setDoc(doc(db, "public_profiles", managedSlug), { ...form, slug: managedSlug, ownerUid: managedProfile?.ownerUid || user.uid, accountType: "artist", published: form.sitePublished, showExhibitions: form.siteSections.includes("exhibitions"), showCV: form.siteSections.includes("cv"), showAbout: form.siteSections.includes("about"), updatedAt: serverTimestamp(), ...(managedProfile ? {} : { createdAt: serverTimestamp(), createdByAdmin: user.uid }) }, { merge: true });
        formDirtyRef.current = false;
        setSaved(true);
        setSaving(false);
        return;
      }
      const profileValues = {
        ...form,
        collaborationOpen: contactFeatureOpen && form.collaborationOpen,
        contactPurposes: contactFeatureOpen ? form.contactPurposes : [],
        email: user.email || "",
        ...(!profile?.accountType ? { accessStatus: roleRequiresApproval(form.accountType) ? "pending" as const : "open" as const } : profile.accountType !== form.accountType ? { accessStatus: "pending" as const } : {}),
        publicSlug: slug,
        showExhibitions: form.siteSections.includes("exhibitions"),
        showCV: form.siteSections.includes("cv"),
        showAbout: form.siteSections.includes("about"),
      };
      await saveProfileAndPublicSite(user.uid, slug, profileValues, {
        displayName: form.displayName.trim(),
        artistName: form.artistName.trim(),
        accountType: form.accountType,
        country: form.country.trim(),
        basedInCity: form.basedInCity.trim(),
        practice: form.practice.trim(),
        bio: form.bio.trim(),
        artistStatement: form.artistStatement.trim(),
        artistCv: form.artistCv.trim(),
        artistAudioUrl: form.artistAudioUrl,
        siteArchive: form.siteArchive,
        siteInspirations: form.siteInspirations,
        collaborationOpen: contactFeatureOpen && form.collaborationOpen,
        contactPurposes: contactFeatureOpen ? form.contactPurposes : [],
        websiteUrl: form.websiteUrl.trim(),
        profileImageUrl: form.profileImageUrl,
        siteCoverImageUrl: form.siteCoverImageUrl,
        siteTemplate: form.siteTemplate,
        siteSections: form.siteSections,
        siteAccent: form.siteAccent,
        siteWorks: form.siteWorks,
        siteExhibitions: form.siteExhibitions,
        showExhibitions: form.siteSections.includes("exhibitions"),
        showCV: form.siteSections.includes("cv"),
        showAbout: form.siteSections.includes("about"),
        published: form.sitePublished,
      });
      setForm((current) => ({ ...current, publicSlug: slug }));
      formDirtyRef.current = false;
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : tx(locale, "Profile could not be saved.", "프로필을 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  function updateWork(index: number, field: keyof ArtistSiteWork, value: string) {
    setField("siteWorks", form.siteWorks.map((work, workIndex) => workIndex === index ? { ...work, [field]: value } : work));
  }

  function addWork() {
    setField("siteWorks", [...form.siteWorks, { id: `work-${Date.now()}`, title: "", year: "", medium: "", imageUrl: "" }]);
  }

  function removeWork(index: number) {
    setField("siteWorks", form.siteWorks.filter((_, workIndex) => workIndex !== index));
  }

  function updateExhibition(index: number, field: keyof ArtistSiteExhibition, value: string) {
    setField("siteExhibitions", form.siteExhibitions.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  function addExhibition() {
    setField("siteExhibitions", [...form.siteExhibitions, { id: `cv-${Date.now()}`, category: undefined, eventDate: "", year: "", title: "", venue: "", location: "", externalUrl: "" }]);
  }

  function removeExhibition(index: number) {
    setField("siteExhibitions", form.siteExhibitions.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateArchive(index: number, key: keyof ArtistSiteArchiveEntry, value: string) {
    setField("siteArchive", form.siteArchive.map((entry, itemIndex) => itemIndex === index ? { ...entry, [key]: value } : entry));
  }

  function updateInspiration(index: number, key: keyof ArtistInspiration, value: string) {
    setField("siteInspirations", form.siteInspirations.map((entry, itemIndex) => itemIndex === index ? { ...entry, [key]: value } : entry));
  }

  function exportPortfolio() {
    if (!portfolioFeatureOpen) { setError(tx(locale, "포트폴리오·CV와 대표작 3점, 전시 기록을 먼저 완성해 주세요.", "포트폴리오·CV와 대표작 3점, 전시 기록을 먼저 완성해 주세요.")); return; }
    const escape = (value: string) => value.replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]!);
    const works = form.siteWorks.filter((work) => work.title && work.imageUrl).map((work) => `<article><img src="${escape(work.imageUrl || "")}"/><h2>${escape(work.title)}</h2><p>${escape([work.year, work.medium].filter(Boolean).join(" · "))}</p></article>`).join("");
    const cvSections = artistCvCategories.map((category) => {
      const entries = form.siteExhibitions.filter((entry) => (entry.category || "group") === category).sort((a, b) => (b.eventDate || `${b.year}-01-01`).localeCompare(a.eventDate || `${a.year}-01-01`));
      if (!entries.length) return "";
      return `<section class="cv-group"><h2>${escape(artistCvCategoryLabels[category][locale])}</h2>${entries.map((entry) => { const link = safeExternalUrl(entry.externalUrl); return `<article class="cv-entry"><time>${escape(entry.eventDate?.replaceAll("-", ".") || entry.year)}</time><div><strong>${escape(entry.title)}</strong><p>${escape([entry.venue, entry.location].filter(Boolean).join(" · "))}</p></div>${link ? `<a href="${escape(link)}">↗</a>` : ""}</article>`; }).join("")}</section>`;
    }).join("");
    const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><title>${escape(form.artistName || form.displayName)} · Portfolio</title><style>@page{margin:18mm}*{box-sizing:border-box}body{font:14px/1.7 Arial,sans-serif;color:#24231f;margin:0}header{padding:20mm 0 12mm;border-bottom:1px solid #aaa}small{letter-spacing:.16em;color:#1438ee}h1{font:48px/1.15 Georgia,serif;margin:12px 0}header p{white-space:pre-line;color:#68645f}section{padding:12mm 0}h2{font:24px Georgia,serif}.works{display:grid;grid-template-columns:1fr 1fr;gap:12mm 8mm}.works article{break-inside:avoid}.works img{width:100%;height:70mm;object-fit:contain;background:#f2f0eb}.works h2{font-size:18px;margin:8px 0 0}.works p,.cv-entry p{color:#69655f;font-size:12px}.cv-group h2{padding-bottom:5mm;border-bottom:1px solid #999}.cv-entry{display:grid;grid-template-columns:26mm 1fr auto;gap:6mm;align-items:start;padding:2.5mm 0;break-inside:avoid}.cv-entry time{font-variant-numeric:tabular-nums}.cv-entry strong{font-weight:500}.cv-entry p{margin:0}.cv-entry a{color:#1438ee}</style><body><header><small>U.A.U · ARTIST PORTFOLIO</small><h1>${escape(form.artistName || form.displayName)}</h1><p>${escape(form.bio)}</p><p>${escape(form.artistStatement)}</p></header><section><h2>Selected Works</h2><div class="works">${works}</div></section>${cvSections}</body></html>`;
    const popup = window.open("", "_blank");
    if (!popup) { setError(tx(locale, "Allow pop-ups for this site, then try again.", "팝업을 허용한 뒤 다시 시도해 주세요.")); return; }
    popup.document.open(); popup.document.write(html.replace("</body>", "<script>window.onload=()=>setTimeout(()=>window.print(),350)</script></body>")); popup.document.close();
  }

  if (authLoading || !user || (managedSlug ? managedLoading : profileLoading)) {
    return <main className="dashboard-page"><DemoNotice /><div className="auth-guard"><RefreshCw className="spin" size={18} /> {tx(locale, "Opening your profile…", "프로필을 여는 중…")}</div></main>;
  }
  if (managedSlug && !adminAccess) return <main className="dashboard-page"><DemoNotice/><div className="auth-guard">{tx(locale, "Super admin access only.", "슈퍼 어드민 전용입니다.")}</div></main>;
  if (managedSlug && !managedProfile && !managedLoading) return <main className="dashboard-page"><DemoNotice/><div className="auth-guard">{tx(locale, "Artist page not found.", "작가 페이지를 찾을 수 없습니다.")}</div></main>;

  const hasArtistAccess = (artist?.verified === true && artist.applicationStatus === "approved") || membership?.active === true || membership?.status === "active";
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="profile" /><section className="dashboard-main profile-main">
    <div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / PROFILE", "MY U.A.U / 프로필")}</MetaLine><h1>{tx(locale, <>Make your place<br /><em>legible.</em></>, <>당신의 자리를<br /><em>선명하게.</em></>)}</h1></div><div className="profile-role-stamp"><span>{roleLabel?.en}</span><strong>{form.displayName || "u.a.u"}</strong></div></div>
    <div className="profile-layout"><form className="profile-form" onSubmit={handleSubmit}>{managedSlug && <div className="admin-artist-callout"><strong>{tx(locale, "운영자 입력 모드 · 작가 프로필과 동일한 편집 화면", "운영자 입력 모드 · 작가 프로필과 동일한 편집 화면")}</strong><span>{tx(locale, "이 화면은 아티스트가 직접 프로필을 등록할 때 사용하는 화면입니다. 입력 후 저장하면 해당 작가 페이지에 반영됩니다.", "이 화면은 아티스트가 직접 프로필을 등록할 때 사용하는 화면입니다. 입력 후 저장하면 해당 작가 페이지에 반영됩니다.")}</span></div>}<div className="profile-form-intro"><MetaLine>{tx(locale, "YOUR IDENTITY", "당신의 정체성")}</MetaLine><p>{tx(locale, "Choose the role that best describes how you enter the unit. You can change it as your practice moves.", "유닛에 들어오는 방식을 가장 잘 설명하는 역할을 선택하세요. 실천의 방향에 따라 언제든 바꿀 수 있습니다.")}</p></div>
      <label>{tx(locale, "Display name", "표시 이름")}<input value={form.displayName} onChange={(event) => setField("displayName", event.target.value)} placeholder={tx(locale, "Your name", "이름")} /></label>
      {form.accountType === "artist" && <label>{tx(locale, "Public / English name", "공개 이름 / 영문 이름")}<input value={form.artistName} onChange={(event) => setField("artistName", event.target.value)} placeholder={tx(locale, "The name on your artist page", "아티스트 페이지에 표시할 이름")} /></label>}
      <label>{tx(locale, "I enter as", "나는 이렇게 들어옵니다")}<select value={form.accountType} onChange={(event) => setField("accountType", event.target.value as UauAccountType)}>{accountTypes.map((role) => <option value={role.value} key={role.value}>{tx(locale, role.en, role.ko)}</option>)}</select></label>
      <div className="profile-two-up"><label>{tx(locale, "Based in", "활동 지역")}<input value={form.basedInCity} onChange={(event) => setField("basedInCity", event.target.value)} placeholder={tx(locale, "Seoul", "서울")} /></label><label>{tx(locale, "Country", "국가")}<input value={form.country} onChange={(event) => setField("country", event.target.value)} placeholder={tx(locale, "Korea", "한국")} /></label></div>
      <label>{tx(locale, "Practice / field", "실천 / 분야")}<input value={form.practice} onChange={(event) => setField("practice", event.target.value)} placeholder={tx(locale, "Painting, sound, research…", "회화, 사운드, 리서치…")} /></label>
      <label>{tx(locale, "Short note", "짧은 소개")}<textarea value={form.bio} onChange={(event) => setField("bio", event.target.value)} placeholder={tx(locale, "What are you keeping open?", "무엇을 열어두고 있나요?")} rows={5} /></label>
      <label>{tx(locale, "Artist statement", "작가 노트")}<textarea value={form.artistStatement} onChange={(event) => setField("artistStatement", event.target.value)} placeholder={tx(locale, "작업의 출발점과 관심사를 들려주세요.", "작업의 출발점과 관심사를 들려주세요.")} rows={7} maxLength={5000}/><small className="profile-field-hint">{form.artistStatement.trim().length}/5,000 · {form.artistStatement.trim().length >= 500 ? tx(locale, "작가 오디오 슬롯 이용 가능", "작가 오디오 슬롯 이용 가능") : tx(locale, "500자 작성 시 작가 오디오 안내가 열립니다", "500자 작성 시 작가 오디오 안내가 열립니다")}</small></label>
      <ArtistCvEditor entries={form.siteExhibitions} legacyText={form.artistCv} locale={locale} onEntriesChange={(entries) => setField("siteExhibitions", entries)} onLegacyTextChange={(value) => setField("artistCv", value)} />
      <div className="profile-audio-field"><MetaLine>{tx(locale, "ARTIST AUDIO GUIDE", "작가 오디오 도슨트")}</MetaLine>{form.artistStatement.trim().length >= 500 ? <R2AudioUploader value={form.artistAudioUrl} entityId={user.uid} onChange={(url) => setField("artistAudioUrl", url)} /> : <p>{tx(locale, "작가 노트 500자 이상 작성하면 직접 녹음한 오디오를 추가할 수 있어요. 언제든 비워둘 수 있고 자동 재생은 되지 않습니다.", "작가 노트 500자 이상 작성하면 직접 녹음한 오디오를 추가할 수 있어요. 언제든 비워둘 수 있고 자동 재생은 되지 않습니다.")}</p>}</div>
      <div className="profile-media-fields"><MetaLine>{tx(locale, "PROFILE IMAGES", "프로필 이미지")}</MetaLine><p>{tx(locale, "Choose the images that introduce your practice. Once saved, they stay connected to your public profile.", "작업과 프로필을 소개할 이미지를 선택하세요. 저장하면 공개 프로필에 연결됩니다.")}</p><div className="profile-media-grid"><R2ImageUploader value={form.profileImageUrl} assetType="profile" entityId={user.uid} label={tx(locale, "Profile image", "프로필 이미지")} description={tx(locale, "A portrait, mark, or image that represents you.", "나를 표현하는 초상, 마크 또는 이미지입니다.")} onChange={(url) => setField("profileImageUrl", url)} /><R2ImageUploader value={form.siteCoverImageUrl} assetType="cover" entityId={user.uid} label={tx(locale, "Site cover", "페이지 커버")} description={tx(locale, "The opening image visitors see on your page.", "방문자가 페이지에서 처음 만나는 이미지입니다.")} onChange={(url) => setField("siteCoverImageUrl", url)} /></div></div>
      <div className="profile-submit-row"><button className="button button-blue" type="submit" disabled={saving}>{saving ? tx(locale, "Saving…", "저장 중…") : tx(locale, "Save profile", "프로필 저장")} <ArrowUpRight size={15} /></button>{saved && <span className="save-confirm"><Check size={14} /> {tx(locale, "Saved", "저장됨")}</span>}{error && <span className="form-error">{error}</span>}<Link className="text-link" href="/dashboard/progress">{tx(locale, "See what your practice can unlock", "내 작업으로 열리는 기능 보기")} <ArrowUpRight size={13}/></Link></div>
    </form><aside className="profile-side"><div className={hasArtistAccess ? "membership-status is-verified" : "membership-status"}><MetaLine>{tx(locale, "ARTIST ACCESS", "아티스트 이용 권한")}</MetaLine><h2>{hasArtistAccess ? tx(locale, "Your gallery is open.", "당신의 갤러리가 열려 있습니다.") : tx(locale, "Your practice can begin here.", "당신의 실천은 여기서 시작할 수 있습니다.")}</h2><p>{hasArtistAccess ? tx(locale, "Your membership or approved artist status unlocks a small virtual gallery and a public artist page.", "멤버십 또는 승인된 아티스트 상태로 작은 버츄얼 갤러리와 공개 아티스트 페이지를 사용할 수 있습니다.") : tx(locale, "Every artist can compose an AI spatial preview. Membership or UNFRAME verification opens the full virtual gallery.", "모든 아티스트는 AI 공간 프리뷰를 만들 수 있습니다. 멤버십 또는 UNFRAME 인증을 받으면 전체 버츄얼 갤러리가 열립니다.")}</p><div className="membership-meta"><span>{tx(locale, "Account role", "계정 역할")}<strong>{tx(locale, roleLabel?.en || "Artist", roleLabel?.ko || "아티스트")}</strong></span><span>{tx(locale, "Membership", "멤버십")}<strong>{hasArtistAccess ? tx(locale, membership?.active ? "Active membership" : "Verified artist", membership?.active ? "활성 멤버십" : "인증 아티스트") : tx(locale, "Open / review", "신청 / 검토")}</strong></span></div><a className="text-link" href="/dashboard/virtual-gallery">{tx(locale, "Open your space", "나의 공간 열기")} <ArrowUpRight size={14} /></a></div><div className="profile-note"><span>u.a.u</span><p>{tx(locale, "A profile is not a finished statement. It is a door left open for the next connection.", "프로필은 완성된 선언이 아닙니다. 다음 연결을 위해 열어둔 문입니다.")}</p></div></aside></div>

    <section className="profile-builder" aria-labelledby="builder-title"><div className="profile-builder-heading"><div><MetaLine>{tx(locale, "PUBLIC SITE BUILDER", "공개 페이지 빌더")}</MetaLine><h2 id="builder-title">{tx(locale, <>Give your practice<br /><em>a room of its own.</em></>, <>당신의 작업에<br /><em>자기만의 방을 주세요.</em></>)}</h2></div><LayoutTemplate size={22} aria-hidden="true" /></div><p className="profile-builder-intro">{tx(locale, "Choose a starting structure, then keep changing it as the work changes. Your public page stays connected to your u.a.u profile.", "작업의 변화에 맞춰 계속 바꿀 수 있는 시작 구조를 선택하세요. 공개 페이지는 u.a.u 프로필과 연결되어 있습니다.")}</p>
      <div className="builder-template-list">{templateChoices.map((template) => <button key={template.value} type="button" className={form.siteTemplate === template.value ? "builder-template is-selected" : "builder-template"} onClick={() => setField("siteTemplate", template.value)} aria-pressed={form.siteTemplate === template.value}><div className={`builder-preview builder-preview-${template.value}`}><span>{template.value === "gallery" ? "IMAGE / 01" : template.value === "editorial" ? "ABOUT / WORK" : "INDEX / 2026"}</span><strong>{form.displayName || "Your name"}</strong><i /><small>{template.value === "gallery" ? "a work stays in the room" : template.value === "editorial" ? "a practice in motion" : "selected works / archive"}</small></div><div className="builder-template-copy"><strong>{tx(locale, template.en, template.ko)}</strong><span>{tx(locale, template.noteEn, template.noteKo)}</span>{form.siteTemplate === template.value && <Check size={15} />}</div></button>)}</div>
      <div className="builder-settings"><div><MetaLine>{tx(locale, "SITE ADDRESS", "페이지 주소")}</MetaLine><label className="builder-slug-field"><span>uau.unframe.kr/artist/</span><input value={form.publicSlug} onChange={(event) => setField("publicSlug", event.target.value)} placeholder="your-name" aria-label={tx(locale, "Public page address", "공개 페이지 주소")} /></label><label>{tx(locale, "Website / portfolio link", "웹사이트 / 포트폴리오 링크")}<input type="url" value={form.websiteUrl} onChange={(event) => setField("websiteUrl", event.target.value)} placeholder="https://" /></label><button type="button" className="button button-outline" onClick={exportPortfolio}><FileDown size={15}/>{tx(locale, "Export portfolio PDF", "포트폴리오 PDF 만들기")}</button><small>{tx(locale, "출력 창에서 ‘PDF로 저장’을 선택하세요.", "출력 창에서 ‘PDF로 저장’을 선택하세요.")}</small></div><div className="builder-controls"><MetaLine>{tx(locale, "PUBLISH SETTINGS", "공개 설정")}</MetaLine><label className="builder-check"><input type="checkbox" checked={form.sitePublished} onChange={(event) => setField("sitePublished", event.target.checked)} /><span><strong>{tx(locale, "Publish my page", "내 페이지 공개하기")}</strong><small>{tx(locale, "Anyone with the link can visit it.", "링크를 가진 누구나 방문할 수 있습니다.")}</small></span></label><div className="builder-sections"><span>{tx(locale, "Show on page", "페이지에 표시할 섹션")}</span>{(["exhibitions", "cv", "about", "studioArchive", "inspiration"] as ArtistSiteSection[]).map((section) => <label key={section}><input type="checkbox" checked={form.siteSections.includes(section)} onChange={() => toggleSection(section)} /> {tx(locale, artistSiteSectionLabels[section].en, artistSiteSectionLabels[section].ko)}</label>)}</div><label className="builder-check"><input type="checkbox" checked={form.collaborationOpen} onChange={(event) => setField("collaborationOpen", event.target.checked)} /><span><strong>{tx(locale, "Open to collaborations", "협업 제안 받기")}</strong><small>{tx(locale, "표시 여부는 언제든 바꿀 수 있어요.", "표시 여부는 언제든 바꿀 수 있어요.")}</small></span></label></div></div>
      <div className="builder-system-settings"><div className="builder-section-order"><MetaLine>{tx(locale, "PAGE ORDER", "페이지 순서")}</MetaLine><p>{tx(locale, "Arrange the sections in the order your practice wants to be read.", "작업이 읽히길 바라는 순서대로 섹션을 배치하세요.")}</p><div className="builder-order-list">{form.siteSections.map((section, index) => <div className="builder-order-row" key={section}><span>0{index + 1}</span><strong>{tx(locale, artistSiteSectionLabels[section].en, artistSiteSectionLabels[section].ko)}</strong><div><button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={tx(locale, `Move ${artistSiteSectionLabels[section].en} up`, `${artistSiteSectionLabels[section].ko} 위로 이동`)}><ArrowUp size={14} /></button><button type="button" onClick={() => moveSection(index, 1)} disabled={index === form.siteSections.length - 1} aria-label={tx(locale, `Move ${artistSiteSectionLabels[section].en} down`, `${artistSiteSectionLabels[section].ko} 아래로 이동`)}><ArrowDown size={14} /></button></div></div>)}</div></div><div className="builder-accent-control"><MetaLine>{tx(locale, "ACCENT", "강조색")}</MetaLine><p>{tx(locale, "Choose a restrained accent for your public room.", "공개 페이지에 사용할 절제된 강조색을 고르세요.")}</p><label><span className="sr-only">{tx(locale, "Artist page accent", "아티스트 페이지 강조색")}</span><select value={form.siteAccent} onChange={(event) => setField("siteAccent", event.target.value as ArtistSiteAccent)}>{(["blue", "ink", "clay"] as ArtistSiteAccent[]).map((accent) => <option value={accent} key={accent}>{tx(locale, artistSiteAccentLabels[accent].en, artistSiteAccentLabels[accent].ko)}</option>)}</select></label></div></div>
      <div className="builder-records"><div className="builder-records-heading"><div><MetaLine>{tx(locale, "PUBLIC RECORDS", "공개 기록")}</MetaLine><h3>{tx(locale, "Give the room something real to hold.", "공간에 실제 기록을 남겨보세요.")}</h3></div><p>{tx(locale, "Add selected works and exhibitions. They will appear on your public page in the order you save them.", "대표 작품과 전시를 추가하세요. 저장한 순서대로 공개 페이지에 나타납니다.")}</p></div><div className="builder-record-grid"><section><div className="builder-record-head"><strong>{tx(locale, "Selected works", "대표 작품")}</strong><button type="button" onClick={addWork}>+ {tx(locale, "Add work", "작품 추가")}</button></div>{form.siteWorks.length === 0 && <p className="builder-record-empty">{tx(locale, "No works added yet.", "아직 추가된 작품이 없습니다.")}</p>}{form.siteWorks.map((work, index) => <div className="builder-record-card" key={work.id}><div className="builder-record-card-top"><span>0{index + 1}</span><button type="button" onClick={() => removeWork(index)}>{tx(locale, "Remove", "삭제")}</button></div><label>{tx(locale, "Title", "제목")}<input value={work.title} onChange={(event) => updateWork(index, "title", event.target.value)} placeholder={tx(locale, "The work title", "작품 제목")} /></label><div className="profile-two-up"><label>{tx(locale, "Year", "연도")}<input value={work.year || ""} onChange={(event) => updateWork(index, "year", event.target.value)} placeholder="2026" /></label><label>{tx(locale, "Medium", "매체")}<input value={work.medium || ""} onChange={(event) => updateWork(index, "medium", event.target.value)} placeholder={tx(locale, "Oil on linen", "린넨에 유채")} /></label></div><R2ImageUploader value={work.imageUrl || ""} assetType="work" entityId={work.id} label={tx(locale, "Work image", "작품 이미지")} description={tx(locale, "Choose a clear image that shows this work well.", "작품을 잘 보여주는 이미지를 선택하세요.")} onChange={(url) => updateWork(index, "imageUrl", url)} /></div>)}</section><section><div className="builder-record-head"><strong>{tx(locale, "Exhibitions", "전시")}</strong><button type="button" onClick={addExhibition}>+ {tx(locale, "Add exhibition", "전시 추가")}</button></div>{form.siteExhibitions.length === 0 && <p className="builder-record-empty">{tx(locale, "No exhibitions added yet.", "아직 추가된 전시가 없습니다.")}</p>}{form.siteExhibitions.map((exhibition, index) => <div className="builder-record-card" key={exhibition.id}><div className="builder-record-card-top"><span>0{index + 1}</span><button type="button" onClick={() => removeExhibition(index)}>{tx(locale, "Remove", "삭제")}</button></div><div className="profile-two-up"><label>{tx(locale, "Year", "연도")}<input value={exhibition.year} onChange={(event) => updateExhibition(index, "year", event.target.value)} placeholder="2026" /></label><label>{tx(locale, "Location", "장소")}<input value={exhibition.location || ""} onChange={(event) => updateExhibition(index, "location", event.target.value)} placeholder={tx(locale, "Seoul", "서울")} /></label></div><label>{tx(locale, "Exhibition title", "전시명")}<input value={exhibition.title} onChange={(event) => updateExhibition(index, "title", event.target.value)} placeholder={tx(locale, "Exhibition title", "전시명")} /></label><label>{tx(locale, "Venue", "공간")}<input value={exhibition.venue || ""} onChange={(event) => updateExhibition(index, "venue", event.target.value)} placeholder={tx(locale, "Gallery or project space", "갤러리 또는 프로젝트 스페이스")} /></label></div>)}</section></div></div>
      <div className="builder-extra-records"><section><div className="builder-record-head"><strong>Studio Archive</strong><button type="button" onClick={() => setField("siteArchive", [...form.siteArchive, { id: `archive-${Date.now()}`, title: "", note: "" }])}><Plus size={14}/> {tx(locale, "Add process note", "과정 기록 추가")}</button></div><p>{tx(locale, "스케치·재료 실험·습작 등 완성작의 바깥을 기록해요. 공개 여부는 페이지 섹션에서 선택합니다.", "스케치·재료 실험·습작 등 완성작의 바깥을 기록해요. 공개 여부는 페이지 섹션에서 선택합니다.")}</p>{form.siteArchive.map((entry, index) => <div className="builder-record-card" key={entry.id}><div className="builder-record-card-top"><span>0{index + 1}</span><button type="button" onClick={() => setField("siteArchive", form.siteArchive.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={13}/> {tx(locale, "Remove", "삭제")}</button></div><label>{tx(locale, "Entry title", "기록 제목")}<input value={entry.title} onChange={(event) => updateArchive(index, "title", event.target.value)} placeholder={tx(locale, "A study in blue", "색을 찾던 날")} /></label><label>{tx(locale, "Process note", "과정 메모")}<textarea rows={3} value={entry.note} onChange={(event) => updateArchive(index, "note", event.target.value)} placeholder={tx(locale, "What changed during this experiment?", "이 과정에서 발견한 점을 적어보세요.")}/></label><label>{tx(locale, "Process image URL (optional)", "과정 이미지 URL (선택)")}<input type="url" value={entry.imageUrl || ""} onChange={(event) => updateArchive(index, "imageUrl", event.target.value)} placeholder="https://" /></label></div>)}</section><section><div className="builder-record-head"><strong>Influence & Inspiration</strong><button type="button" onClick={() => setField("siteInspirations", [...form.siteInspirations, { id: `inspiration-${Date.now()}`, title: "" }])}><Plus size={14}/> {tx(locale, "Add reference", "영감 추가")}</button></div><p>{tx(locale, "영향을 준 책·영화·음악·작가를 링크와 함께 큐레이션해요.", "영향을 준 책·영화·음악·작가를 링크와 함께 큐레이션해요.")}</p>{form.siteInspirations.map((entry, index) => <div className="builder-record-card" key={entry.id}><div className="builder-record-card-top"><span>0{index + 1}</span><button type="button" onClick={() => setField("siteInspirations", form.siteInspirations.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={13}/> {tx(locale, "Remove", "삭제")}</button></div><label>{tx(locale, "Title", "제목")}<input value={entry.title} onChange={(event) => updateInspiration(index, "title", event.target.value)} /></label><div className="profile-two-up"><label>{tx(locale, "Creator", "만든 사람")}<input value={entry.creator || ""} onChange={(event) => updateInspiration(index, "creator", event.target.value)} /></label><label>{tx(locale, "Kind", "종류")}<input value={entry.kind || ""} onChange={(event) => updateInspiration(index, "kind", event.target.value)} placeholder="책 · 음악 · 작가" /></label></div><label>{tx(locale, "Link", "링크")}<input type="url" value={entry.url || ""} onChange={(event) => updateInspiration(index, "url", event.target.value)} placeholder="https://" /></label><label>{tx(locale, "Why it matters", "작업과의 연결")}<textarea rows={2} value={entry.note || ""} onChange={(event) => updateInspiration(index, "note", event.target.value)} /></label></div>)}</section></div>
      <div className="builder-contact-settings"><div><MetaLine>{tx(locale, "CONTACT & COLLABORATION", "문의와 협업")}</MetaLine><h3>{tx(locale, "Open a useful way to reach you.", "필요한 연락의 문을 열어두세요.")}</h3><p>{tx(locale, "개인 이메일을 공개하지 않고, 문의는 U.A.U 받은 편지함으로 받습니다.", "개인 이메일을 공개하지 않고, 문의는 U.A.U 받은 편지함으로 받습니다.")}</p></div><div className="builder-contact-options">{[{id:"work",en:"Artwork purchase or loan",ko:"작품 구매·대여"},{id:"curation",en:"Exhibition / curatorial proposal",ko:"전시·기획 제안"},{id:"collaboration",en:"Collaboration",ko:"협업 제안"},{id:"other",en:"Other inquiry",ko:"기타 문의"}].map((purpose) => <label key={purpose.id}><input type="checkbox" checked={form.contactPurposes.includes(purpose.id)} onChange={() => setField("contactPurposes", form.contactPurposes.includes(purpose.id) ? form.contactPurposes.filter((item) => item !== purpose.id) : [...form.contactPurposes, purpose.id])}/>{tx(locale,purpose.en,purpose.ko)}</label>)}</div></div>
      <section className="studio-video-settings"><MetaLine>{tx(locale, "IN THE STUDIO / VIDEO LOOPS", "IN THE STUDIO / 작업 과정 영상")}</MetaLine><p>{tx(locale, "각 작업 기록에 짧은 MP4 또는 WebM 영상을 연결해요. 공개 페이지의 ‘Studio Archive’ 섹션을 켜면 방문자에게 표시됩니다.", "각 작업 기록에 짧은 MP4 또는 WebM 영상을 연결해요. 공개 페이지의 ‘Studio Archive’ 섹션을 켜면 방문자에게 표시됩니다.")}</p>{form.siteArchive.length ? form.siteArchive.map((entry, index) => <div className="studio-video-row" key={entry.id}><span>{entry.title || `기록 ${index + 1}`}</span><R2VideoUploader value={entry.videoUrl} entityId={entry.id} onChange={(url) => updateArchive(index, "videoUrl", url)} /></div>) : <p>{tx(locale, "먼저 Studio Archive에 과정 기록을 추가해 주세요.", "먼저 Studio Archive에 과정 기록을 추가해 주세요.")}</p>}</section>
      <section className="work-dimensions-settings"><MetaLine>{tx(locale, "WORK DETAILS / INQUIRY CONTEXT", "작품 정보 / 문의에 함께 전달")}</MetaLine><p>{tx(locale, "Add dimensions so they travel with an inquiry about a specific work.", "작품 문의를 보낼 때 제목·연도·매체와 함께 규격도 전달돼요.")}</p>{form.siteWorks.map((work, index) => <label key={work.id}>{work.title || `${tx(locale, "Work", "작품")} ${index + 1}`}<input value={work.dimensions || ""} onChange={(event) => updateWork(index, "dimensions", event.target.value)} placeholder="116.8 × 91 cm" /></label>)}</section>
      <div className="builder-footer"><span>{tx(locale, "Your page is saved with your profile. Publish when it feels ready.", "페이지는 프로필과 함께 저장됩니다. 준비가 되었을 때 공개하세요.")}</span>{publicUrl && <a className="text-link" href={publicUrl} target="_blank" rel="noreferrer"><Eye size={14} /> {tx(locale, "Preview page", "페이지 미리보기")} <ExternalLink size={13} /></a>}</div>
    </section>
  </section></div></main>;
}
