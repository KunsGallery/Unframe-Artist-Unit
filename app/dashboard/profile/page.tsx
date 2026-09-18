"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Eye, ExternalLink, LayoutTemplate, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../../components";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { accountTypes, savePublicProfile, saveUserProfile, useArtistMembership, useMembership, useUserProfile, type ArtistSiteAccent, type ArtistSiteExhibition, type ArtistSiteSection, type ArtistSiteTemplate, type ArtistSiteWork, type UauAccountType } from "../../profile";
import { artistSiteAccentLabels, artistSiteSectionLabels, defaultArtistSiteSections, normalizeArtistSiteSections } from "../../artist/site-config";
import { DashboardSidebar } from "../dashboard-sidebar";

type ProfileForm = {
  displayName: string;
  artistName: string;
  accountType: UauAccountType;
  basedInCity: string;
  country: string;
  practice: string;
  bio: string;
  websiteUrl: string;
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
  websiteUrl: "",
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

export default function DashboardProfilePage() {
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

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!profile && !user) return;
    setForm({
      displayName: profile?.displayName || user?.displayName || "",
      artistName: profile?.artistName || "",
      accountType: profile?.accountType || "artist",
      basedInCity: profile?.basedInCity || "",
      country: profile?.country || "",
      practice: profile?.practice || "",
      bio: profile?.bio || "",
      websiteUrl: profile?.websiteUrl || "",
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
  }, [profile, user]);

  const roleLabel = useMemo(() => accountTypes.find((role) => role.value === form.accountType), [form.accountType]);
  const publicUrl = user ? `/artist/${getPublicSlug(form.publicSlug, user.uid)}` : "";

  function setField<K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) {
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
      const slug = getPublicSlug(form.publicSlug || form.displayName, user.uid);
      const profileValues = {
        ...form,
        publicSlug: slug,
        showExhibitions: form.siteSections.includes("exhibitions"),
        showCV: form.siteSections.includes("cv"),
        showAbout: form.siteSections.includes("about"),
      };
      await saveUserProfile(user.uid, profileValues);
      await savePublicProfile(user.uid, slug, {
        displayName: form.displayName.trim(),
        artistName: form.artistName.trim(),
        accountType: form.accountType,
        country: form.country.trim(),
        basedInCity: form.basedInCity.trim(),
        practice: form.practice.trim(),
        bio: form.bio.trim(),
        websiteUrl: form.websiteUrl.trim(),
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
    setField("siteExhibitions", [...form.siteExhibitions, { id: `exhibition-${Date.now()}`, year: "", title: "", venue: "", location: "" }]);
  }

  function removeExhibition(index: number) {
    setField("siteExhibitions", form.siteExhibitions.filter((_, itemIndex) => itemIndex !== index));
  }

  if (authLoading || !user || profileLoading) {
    return <main className="dashboard-page"><DemoNotice /><div className="auth-guard"><RefreshCw className="spin" size={18} /> {tx(locale, "Opening your profile…", "프로필을 여는 중…")}</div></main>;
  }

  const hasArtistAccess = (artist?.verified === true && artist.applicationStatus === "approved") || membership?.active === true || membership?.status === "active";
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="profile" /><section className="dashboard-main profile-main">
    <div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / PROFILE", "MY U.A.U / 프로필")}</MetaLine><h1>{tx(locale, <>Make your place<br /><em>legible.</em></>, <>당신의 자리를<br /><em>선명하게.</em></>)}</h1></div><div className="profile-role-stamp"><span>{roleLabel?.en}</span><strong>{form.displayName || "u.a.u"}</strong></div></div>
    <div className="profile-layout"><form className="profile-form" onSubmit={handleSubmit}><div className="profile-form-intro"><MetaLine>{tx(locale, "YOUR IDENTITY", "당신의 정체성")}</MetaLine><p>{tx(locale, "Choose the role that best describes how you enter the unit. You can change it as your practice moves.", "유닛에 들어오는 방식을 가장 잘 설명하는 역할을 선택하세요. 실천의 방향에 따라 언제든 바꿀 수 있습니다.")}</p></div>
      <label>{tx(locale, "Display name", "표시 이름")}<input value={form.displayName} onChange={(event) => setField("displayName", event.target.value)} placeholder={tx(locale, "Your name", "이름")} /></label>
      {form.accountType === "artist" && <label>{tx(locale, "Public / English name", "공개 이름 / 영문 이름")}<input value={form.artistName} onChange={(event) => setField("artistName", event.target.value)} placeholder={tx(locale, "The name on your artist page", "아티스트 페이지에 표시할 이름")} /></label>}
      <label>{tx(locale, "I enter as", "나는 이렇게 들어옵니다")}<select value={form.accountType} onChange={(event) => setField("accountType", event.target.value as UauAccountType)}>{accountTypes.map((role) => <option value={role.value} key={role.value}>{tx(locale, role.en, role.ko)}</option>)}</select></label>
      <div className="profile-two-up"><label>{tx(locale, "Based in", "활동 지역")}<input value={form.basedInCity} onChange={(event) => setField("basedInCity", event.target.value)} placeholder={tx(locale, "Seoul", "서울")} /></label><label>{tx(locale, "Country", "국가")}<input value={form.country} onChange={(event) => setField("country", event.target.value)} placeholder={tx(locale, "Korea", "한국")} /></label></div>
      <label>{tx(locale, "Practice / field", "실천 / 분야")}<input value={form.practice} onChange={(event) => setField("practice", event.target.value)} placeholder={tx(locale, "Painting, sound, research…", "회화, 사운드, 리서치…")} /></label>
      <label>{tx(locale, "Short note", "짧은 소개")}<textarea value={form.bio} onChange={(event) => setField("bio", event.target.value)} placeholder={tx(locale, "What are you keeping open?", "무엇을 열어두고 있나요?")} rows={5} /></label>
      <div className="profile-submit-row"><button className="button button-blue" type="submit" disabled={saving}>{saving ? tx(locale, "Saving…", "저장 중…") : tx(locale, "Save profile", "프로필 저장")} <ArrowUpRight size={15} /></button>{saved && <span className="save-confirm"><Check size={14} /> {tx(locale, "Saved", "저장됨")}</span>}{error && <span className="form-error">{error}</span>}</div>
    </form><aside className="profile-side"><div className={hasArtistAccess ? "membership-status is-verified" : "membership-status"}><MetaLine>{tx(locale, "ARTIST ACCESS", "아티스트 이용 권한")}</MetaLine><h2>{hasArtistAccess ? tx(locale, "Your gallery is open.", "당신의 갤러리가 열려 있습니다.") : tx(locale, "Your practice can begin here.", "당신의 실천은 여기서 시작할 수 있습니다.")}</h2><p>{hasArtistAccess ? tx(locale, "Your membership or approved artist status unlocks a small virtual gallery and a public artist page.", "멤버십 또는 승인된 아티스트 상태로 작은 버츄얼 갤러리와 공개 아티스트 페이지를 사용할 수 있습니다.") : tx(locale, "Every artist can compose an AI spatial preview. Membership or UNFRAME verification opens the full virtual gallery.", "모든 아티스트는 AI 공간 프리뷰를 만들 수 있습니다. 멤버십 또는 UNFRAME 인증을 받으면 전체 버츄얼 갤러리가 열립니다.")}</p><div className="membership-meta"><span>{tx(locale, "Account role", "계정 역할")}<strong>{tx(locale, roleLabel?.en || "Artist", roleLabel?.ko || "아티스트")}</strong></span><span>{tx(locale, "Membership", "멤버십")}<strong>{hasArtistAccess ? tx(locale, membership?.active ? "Active membership" : "Verified artist", membership?.active ? "활성 멤버십" : "인증 아티스트") : tx(locale, "Open / review", "신청 / 검토")}</strong></span></div><a className="text-link" href="/dashboard/virtual-gallery">{tx(locale, "Open your space", "나의 공간 열기")} <ArrowUpRight size={14} /></a></div><div className="profile-note"><span>u.a.u</span><p>{tx(locale, "A profile is not a finished statement. It is a door left open for the next connection.", "프로필은 완성된 선언이 아닙니다. 다음 연결을 위해 열어둔 문입니다.")}</p></div></aside></div>

    <section className="profile-builder" aria-labelledby="builder-title"><div className="profile-builder-heading"><div><MetaLine>{tx(locale, "PUBLIC SITE BUILDER", "공개 페이지 빌더")}</MetaLine><h2 id="builder-title">{tx(locale, <>Give your practice<br /><em>a room of its own.</em></>, <>당신의 작업에<br /><em>자기만의 방을 주세요.</em></>)}</h2></div><LayoutTemplate size={22} aria-hidden="true" /></div><p className="profile-builder-intro">{tx(locale, "Choose a starting structure, then keep changing it as the work changes. Your public page stays connected to your u.a.u profile.", "작업의 변화에 맞춰 계속 바꿀 수 있는 시작 구조를 선택하세요. 공개 페이지는 u.a.u 프로필과 연결되어 있습니다.")}</p>
      <div className="builder-template-list">{templateChoices.map((template) => <button key={template.value} type="button" className={form.siteTemplate === template.value ? "builder-template is-selected" : "builder-template"} onClick={() => setField("siteTemplate", template.value)} aria-pressed={form.siteTemplate === template.value}><div className={`builder-preview builder-preview-${template.value}`}><span>{template.value === "gallery" ? "IMAGE / 01" : template.value === "editorial" ? "ABOUT / WORK" : "INDEX / 2026"}</span><strong>{form.displayName || "Your name"}</strong><i /><small>{template.value === "gallery" ? "a work stays in the room" : template.value === "editorial" ? "a practice in motion" : "selected works / archive"}</small></div><div className="builder-template-copy"><strong>{tx(locale, template.en, template.ko)}</strong><span>{tx(locale, template.noteEn, template.noteKo)}</span>{form.siteTemplate === template.value && <Check size={15} />}</div></button>)}</div>
      <div className="builder-settings"><div><MetaLine>{tx(locale, "SITE ADDRESS", "페이지 주소")}</MetaLine><label className="builder-slug-field"><span>uau.unframe.kr/artist/</span><input value={form.publicSlug} onChange={(event) => setField("publicSlug", event.target.value)} placeholder="your-name" aria-label={tx(locale, "Public page address", "공개 페이지 주소")} /></label><label>{tx(locale, "Website / portfolio link", "웹사이트 / 포트폴리오 링크")}<input type="url" value={form.websiteUrl} onChange={(event) => setField("websiteUrl", event.target.value)} placeholder="https://" /></label></div><div className="builder-controls"><MetaLine>{tx(locale, "PUBLISH SETTINGS", "공개 설정")}</MetaLine><label className="builder-check"><input type="checkbox" checked={form.sitePublished} onChange={(event) => setField("sitePublished", event.target.checked)} /><span><strong>{tx(locale, "Publish my page", "내 페이지 공개하기")}</strong><small>{tx(locale, "Anyone with the link can visit it.", "링크를 가진 누구나 방문할 수 있습니다.")}</small></span></label><div className="builder-sections"><span>{tx(locale, "Show on page", "페이지에 표시할 섹션")}</span>{(["exhibitions", "cv", "about"] as ArtistSiteSection[]).map((section) => <label key={section}><input type="checkbox" checked={form.siteSections.includes(section)} onChange={() => toggleSection(section)} /> {tx(locale, artistSiteSectionLabels[section].en, artistSiteSectionLabels[section].ko)}</label>)}</div></div></div>
      <div className="builder-system-settings"><div className="builder-section-order"><MetaLine>{tx(locale, "PAGE ORDER", "페이지 순서")}</MetaLine><p>{tx(locale, "Arrange the sections in the order your practice wants to be read.", "작업이 읽히길 바라는 순서대로 섹션을 배치하세요.")}</p><div className="builder-order-list">{form.siteSections.map((section, index) => <div className="builder-order-row" key={section}><span>0{index + 1}</span><strong>{tx(locale, artistSiteSectionLabels[section].en, artistSiteSectionLabels[section].ko)}</strong><div><button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={tx(locale, `Move ${artistSiteSectionLabels[section].en} up`, `${artistSiteSectionLabels[section].ko} 위로 이동`)}><ArrowUp size={14} /></button><button type="button" onClick={() => moveSection(index, 1)} disabled={index === form.siteSections.length - 1} aria-label={tx(locale, `Move ${artistSiteSectionLabels[section].en} down`, `${artistSiteSectionLabels[section].ko} 아래로 이동`)}><ArrowDown size={14} /></button></div></div>)}</div></div><div className="builder-accent-control"><MetaLine>{tx(locale, "ACCENT", "강조색")}</MetaLine><p>{tx(locale, "Choose a restrained accent for your public room.", "공개 페이지에 사용할 절제된 강조색을 고르세요.")}</p><label><span className="sr-only">{tx(locale, "Artist page accent", "아티스트 페이지 강조색")}</span><select value={form.siteAccent} onChange={(event) => setField("siteAccent", event.target.value as ArtistSiteAccent)}>{(["blue", "ink", "clay"] as ArtistSiteAccent[]).map((accent) => <option value={accent} key={accent}>{tx(locale, artistSiteAccentLabels[accent].en, artistSiteAccentLabels[accent].ko)}</option>)}</select></label></div></div>
      <div className="builder-records"><div className="builder-records-heading"><div><MetaLine>{tx(locale, "PUBLIC RECORDS", "공개 기록")}</MetaLine><h3>{tx(locale, "Give the room something real to hold.", "공간에 실제 기록을 남겨보세요.")}</h3></div><p>{tx(locale, "Add selected works and exhibitions. They will appear on your public page in the order you save them.", "대표 작품과 전시를 추가하세요. 저장한 순서대로 공개 페이지에 나타납니다.")}</p></div><div className="builder-record-grid"><section><div className="builder-record-head"><strong>{tx(locale, "Selected works", "대표 작품")}</strong><button type="button" onClick={addWork}>+ {tx(locale, "Add work", "작품 추가")}</button></div>{form.siteWorks.length === 0 && <p className="builder-record-empty">{tx(locale, "No works added yet.", "아직 추가된 작품이 없습니다.")}</p>}{form.siteWorks.map((work, index) => <div className="builder-record-card" key={work.id}><div className="builder-record-card-top"><span>0{index + 1}</span><button type="button" onClick={() => removeWork(index)}>{tx(locale, "Remove", "삭제")}</button></div><label>{tx(locale, "Title", "제목")}<input value={work.title} onChange={(event) => updateWork(index, "title", event.target.value)} placeholder={tx(locale, "The work title", "작품 제목")} /></label><div className="profile-two-up"><label>{tx(locale, "Year", "연도")}<input value={work.year || ""} onChange={(event) => updateWork(index, "year", event.target.value)} placeholder="2026" /></label><label>{tx(locale, "Medium", "매체")}<input value={work.medium || ""} onChange={(event) => updateWork(index, "medium", event.target.value)} placeholder={tx(locale, "Oil on linen", "린넨에 유채")} /></label></div><label>{tx(locale, "Image URL", "이미지 주소")}<input type="url" value={work.imageUrl || ""} onChange={(event) => updateWork(index, "imageUrl", event.target.value)} placeholder="https://" /></label></div>)}</section><section><div className="builder-record-head"><strong>{tx(locale, "Exhibitions", "전시")}</strong><button type="button" onClick={addExhibition}>+ {tx(locale, "Add exhibition", "전시 추가")}</button></div>{form.siteExhibitions.length === 0 && <p className="builder-record-empty">{tx(locale, "No exhibitions added yet.", "아직 추가된 전시가 없습니다.")}</p>}{form.siteExhibitions.map((exhibition, index) => <div className="builder-record-card" key={exhibition.id}><div className="builder-record-card-top"><span>0{index + 1}</span><button type="button" onClick={() => removeExhibition(index)}>{tx(locale, "Remove", "삭제")}</button></div><div className="profile-two-up"><label>{tx(locale, "Year", "연도")}<input value={exhibition.year} onChange={(event) => updateExhibition(index, "year", event.target.value)} placeholder="2026" /></label><label>{tx(locale, "Location", "장소")}<input value={exhibition.location || ""} onChange={(event) => updateExhibition(index, "location", event.target.value)} placeholder={tx(locale, "Seoul", "서울")} /></label></div><label>{tx(locale, "Exhibition title", "전시명")}<input value={exhibition.title} onChange={(event) => updateExhibition(index, "title", event.target.value)} placeholder={tx(locale, "Exhibition title", "전시명")} /></label><label>{tx(locale, "Venue", "공간")}<input value={exhibition.venue || ""} onChange={(event) => updateExhibition(index, "venue", event.target.value)} placeholder={tx(locale, "Gallery or project space", "갤러리 또는 프로젝트 스페이스")} /></label></div>)}</section></div></div>
      <div className="builder-footer"><span>{tx(locale, "Your page is saved with your profile. Publish when it feels ready.", "페이지는 프로필과 함께 저장됩니다. 준비가 되었을 때 공개하세요.")}</span>{publicUrl && <a className="text-link" href={publicUrl} target="_blank" rel="noreferrer"><Eye size={14} /> {tx(locale, "Preview page", "페이지 미리보기")} <ExternalLink size={13} /></a>}</div>
    </section>
  </section></div></main>;
}
