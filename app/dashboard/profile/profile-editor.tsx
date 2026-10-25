"use client";
import { MovingBannerEditor } from "../../components/moving-banner";
import { normalizeMovingBanner } from "../../moving-banner";

import { ArtistProfileView } from "../../public-artist-page";
import { firestoreValues } from "../../firestore-values";
import { ArtistTemplatePicker } from "../../components/artist-template-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Eye, ExternalLink, LayoutTemplate, RefreshCw, FileDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { MetaLine } from "../../components";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { accountTypes, roleRequiresApproval, saveProfileAndPublicSite, useArtistMembership, withoutMembership, useMembership, useUserProfile, type ArtistSiteAccent, type ArtistSiteSection, type UauAccountType } from "../../profile";
import { artistSiteAccentLabels, artistSiteSectionLabels, normalizeArtistSiteSections } from "../../artist/site-config";
import { DashboardSidebar } from "../dashboard-sidebar";
import { R2ImageUploader } from "../../components/r2-image-uploader";
import { R2AudioUploader } from "../../components/r2-audio-uploader";
import { ArtistCvEditor } from "../../components/artist-cv-editor";
import { safeExternalUrl } from "../../artist/cv";
import "../../artist-growth.css";
import "../../artist-growth-motion.css";
import { getArtistProgress } from "../../artist-progress";
import { emptyForm, getPublicSlug, type ProfileForm } from "./profile-form";
import { buildPortfolioHtml } from "./portfolio-export";
import { ContactPurposesEditor, SelectedWorksEditor, StudioRecordsEditor, StudioVideoSettings, WorkDimensionsSettings } from "./builder-records";
import { db } from "../../firebase-client";
import { MembershipPanel } from "../../admin/membership-panel";
import type { PublicProfile } from "../../profile";


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
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (previewOpen) previewDialog.current?.showModal(); else previewDialog.current?.close(); }, [previewOpen]);
  const formRef = useRef(form);
  formRef.current = form;
  const formDirtyRef = useRef(false);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (formDirtyRef.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

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
      collaborationOpen: profile?.collaborationOpen ?? true,
      contactPurposes: profile?.contactPurposes || [],
      websiteUrl: profile?.websiteUrl || "",
      profileImageUrl: profile?.profileImageUrl || "",
      siteCoverImageUrl: profile?.siteCoverImageUrl || "",
      publicSlug: profile?.publicSlug || getPublicSlug(profile?.displayName || user?.displayName || "", user?.uid || "artist"),
      siteTemplate: profile?.siteTemplate || "editorial",
      siteSections: normalizeArtistSiteSections(profile?.siteSections),
      siteAccent: profile?.siteAccent || "blue",
      movingBanner: normalizeMovingBanner(profile?.movingBanner),
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
    const submittedForm = form;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      if (!form.displayName.trim()) throw new Error(tx(locale, "Add a display name before publishing your site.", "페이지를 공개하기 전에 표시 이름을 입력해 주세요."));
      if (form.siteExhibitions.some((entry) => entry.externalUrl?.trim() && !safeExternalUrl(entry.externalUrl))) throw new Error(tx(locale, "CV links must use an http:// or https:// address.", "CV 링크는 http:// 또는 https:// 주소를 입력해 주세요."));
      const slug = managedSlug || getPublicSlug(form.publicSlug || form.displayName, user.uid);
      if (managedSlug) {
        if (!db || !adminAccess || (form.publicSlug && form.publicSlug !== managedSlug)) throw new Error(tx(locale, "관리자 권한 또는 페이지 주소를 확인해 주세요.", "관리자 권한 또는 페이지 주소를 확인해 주세요."));
        await setDoc(doc(db, "public_profiles", managedSlug), firestoreValues({ ...withoutMembership(form), slug: managedSlug, ownerUid: managedProfile?.ownerUid || user.uid, accountType: "artist", published: form.sitePublished, showExhibitions: form.siteSections.includes("exhibitions"), showCV: form.siteSections.includes("cv"), showAbout: form.siteSections.includes("about"), updatedAt: serverTimestamp(), ...(managedProfile ? {} : { createdAt: serverTimestamp(), createdByAdmin: user.uid }) }), { merge: true });
        if (formRef.current === submittedForm) { formDirtyRef.current = false; setSaved(true); }
        setSaving(false);
        return;
      }
      const profileValues = {
        ...form,
        collaborationOpen: form.collaborationOpen,
        contactPurposes: form.contactPurposes,
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
        collaborationOpen: form.collaborationOpen,
        contactPurposes: form.contactPurposes,
        websiteUrl: form.websiteUrl.trim(),
        profileImageUrl: form.profileImageUrl,
        siteCoverImageUrl: form.siteCoverImageUrl,
        siteTemplate: form.siteTemplate,
        siteSections: form.siteSections,
        siteAccent: form.siteAccent,
        movingBanner: normalizeMovingBanner(form.movingBanner),
        siteWorks: form.siteWorks,
        siteExhibitions: form.siteExhibitions,
        showExhibitions: form.siteSections.includes("exhibitions"),
        showCV: form.siteSections.includes("cv"),
        showAbout: form.siteSections.includes("about"),
        published: form.sitePublished,
      });
      if (formRef.current === submittedForm) {
        setForm((current) => ({ ...current, publicSlug: slug }));
        formDirtyRef.current = false;
        setSaved(true);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : tx(locale, "Profile could not be saved.", "프로필을 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  function exportPortfolio() {
    if (!portfolioFeatureOpen) { setError(tx(locale, "포트폴리오·CV와 대표작 3점, 전시 기록을 먼저 완성해 주세요.", "포트폴리오·CV와 대표작 3점, 전시 기록을 먼저 완성해 주세요.")); return; }
    const html = buildPortfolioHtml(form, locale);
    const popup = window.open("", "_blank");
    if (!popup) { setError(tx(locale, "Allow pop-ups for this site, then try again.", "팝업을 허용한 뒤 다시 시도해 주세요.")); return; }
    popup.document.open(); popup.document.write(html.replace("</body>", "<script>window.onload=()=>setTimeout(()=>window.print(),350)</script></body>")); popup.document.close();
  }

  if (authLoading || !user || (managedSlug ? managedLoading : profileLoading)) {
    return <main className="dashboard-page"><div className="auth-guard"><RefreshCw className="spin" size={18} /> {tx(locale, "Opening your profile…", "프로필을 여는 중…")}</div></main>;
  }
  if (managedSlug && !adminAccess) return <main className="dashboard-page"><div className="auth-guard">{tx(locale, "Super admin access only.", "슈퍼 어드민 전용입니다.")}</div></main>;
  if (managedSlug && !managedProfile && !managedLoading) return <main className="dashboard-page"><div className="auth-guard">{tx(locale, "Artist page not found.", "작가 페이지를 찾을 수 없습니다.")}</div></main>;

  const hasArtistAccess = (artist?.verified === true && artist.applicationStatus === "approved") || membership?.active === true || membership?.status === "active";
  return <main className="dashboard-page"><div className="dashboard-wrap"><DashboardSidebar active="profile" /><section className="dashboard-main profile-main">
    <div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / PROFILE", "MY U.A.U / 프로필")}</MetaLine><h1>{tx(locale, <>Make your place<br /><em>legible.</em></>, <>당신의 자리를<br /><em>선명하게.</em></>)}</h1></div><div className="profile-role-stamp"><span>{roleLabel?.en}</span><strong>{form.displayName || "u.a.u"}</strong></div></div>
    <nav className="profile-jump-nav" aria-label={tx(locale, "Editing sections", "편집 항목")}><a href="#identity">{tx(locale, "Profile", "기본 정보")}</a>{form.accountType === "artist" && <><a href="#artist-cv">{tx(locale, "CV", "이력")}</a><a href="#builder-title">{tx(locale, "Page design", "페이지 구성")}</a><a href="#artist-works">{tx(locale, "Works", "대표 작품")}</a></>}</nav><div id="identity" className="profile-layout"><form id="artist-profile-form" className="profile-form" onSubmit={handleSubmit}>{managedSlug && <div className="admin-artist-callout"><strong>{tx(locale, "운영자 입력 모드 · 작가 프로필과 동일한 편집 화면", "운영자 입력 모드 · 작가 프로필과 동일한 편집 화면")}</strong><span>{tx(locale, "이 화면은 아티스트가 직접 프로필을 등록할 때 사용하는 화면입니다. 입력 후 저장하면 해당 작가 페이지에 반영됩니다.", "이 화면은 아티스트가 직접 프로필을 등록할 때 사용하는 화면입니다. 입력 후 저장하면 해당 작가 페이지에 반영됩니다.")}</span></div>}<div className="profile-form-intro"><MetaLine>{tx(locale, "YOUR IDENTITY", "당신의 정체성")}</MetaLine><p>{tx(locale, "Choose the role that best describes how you enter the unit. You can change it as your practice moves.", "유닛에 들어오는 방식을 가장 잘 설명하는 역할을 선택하세요. 실천의 방향에 따라 언제든 바꿀 수 있습니다.")}</p></div>
      <label>{tx(locale, "Display name", "표시 이름")}<input value={form.displayName} onChange={(event) => setField("displayName", event.target.value)} placeholder={tx(locale, "Your name", "이름")} /></label>
      {form.accountType === "artist" && <label>{tx(locale, "Public / English name", "공개 이름 / 영문 이름")}<input value={form.artistName} onChange={(event) => setField("artistName", event.target.value)} placeholder={tx(locale, "The name on your artist page", "아티스트 페이지에 표시할 이름")} /></label>}
      <label>{tx(locale, "I enter as", "나는 이렇게 들어옵니다")}<select value={form.accountType} onChange={(event) => setField("accountType", event.target.value as UauAccountType)}>{accountTypes.map((role) => <option value={role.value} key={role.value}>{tx(locale, role.en, role.ko)}</option>)}</select></label>
      <div className="profile-two-up"><label>{tx(locale, "Based in", "활동 지역")}<input value={form.basedInCity} onChange={(event) => setField("basedInCity", event.target.value)} placeholder={tx(locale, "Seoul", "서울")} /></label><label>{tx(locale, "Country", "국가")}<input value={form.country} onChange={(event) => setField("country", event.target.value)} placeholder={tx(locale, "Korea", "한국")} /></label></div>
      <label>{tx(locale, "Practice / field", "실천 / 분야")}<input value={form.practice} onChange={(event) => setField("practice", event.target.value)} placeholder={tx(locale, "Painting, sound, research…", "회화, 사운드, 리서치…")} /></label>
      <label>{tx(locale, "Short note", "짧은 소개")}<textarea value={form.bio} onChange={(event) => setField("bio", event.target.value)} placeholder={tx(locale, "What are you keeping open?", "무엇을 열어두고 있나요?")} rows={5} /></label>
      {form.accountType === "artist" && <><label>{tx(locale, "Artist statement", "작가 노트")}<textarea value={form.artistStatement} onChange={(event) => setField("artistStatement", event.target.value)} placeholder={tx(locale, "작업의 출발점과 관심사를 들려주세요.", "작업의 출발점과 관심사를 들려주세요.")} rows={7} maxLength={5000}/><small className="profile-field-hint">{form.artistStatement.trim().length}/5,000 · {form.artistStatement.trim().length >= 500 ? tx(locale, "작가 오디오 슬롯 이용 가능", "작가 오디오 슬롯 이용 가능") : tx(locale, "500자 작성 시 작가 오디오 안내가 열립니다", "500자 작성 시 작가 오디오 안내가 열립니다")}</small></label>
      <div id="artist-cv"><ArtistCvEditor entries={form.siteExhibitions} legacyText={form.artistCv} locale={locale} onEntriesChange={(entries) => setField("siteExhibitions", entries)} onLegacyTextChange={(value) => setField("artistCv", value)} /></div>
      <div className="profile-audio-field"><MetaLine>{tx(locale, "ARTIST AUDIO GUIDE", "작가 오디오 도슨트")}</MetaLine>{form.artistStatement.trim().length >= 500 ? <R2AudioUploader value={form.artistAudioUrl} entityId={user.uid} onChange={(url) => setField("artistAudioUrl", url)} /> : <p>{tx(locale, "작가 노트 500자 이상 작성하면 직접 녹음한 오디오를 추가할 수 있어요. 언제든 비워둘 수 있고 자동 재생은 되지 않습니다.", "작가 노트 500자 이상 작성하면 직접 녹음한 오디오를 추가할 수 있어요. 언제든 비워둘 수 있고 자동 재생은 되지 않습니다.")}</p>}</div>
      </>}<div className="profile-media-fields"><MetaLine>{tx(locale, "PROFILE IMAGES", "프로필 이미지")}</MetaLine><p>{tx(locale, "Choose the images that introduce your practice. Once saved, they stay connected to your public profile.", "작업과 프로필을 소개할 이미지를 선택하세요. 저장하면 공개 프로필에 연결됩니다.")}</p><div className="profile-media-grid"><R2ImageUploader value={form.profileImageUrl} assetType="profile" entityId={user.uid} label={tx(locale, "Profile image", "프로필 이미지")} description={tx(locale, "A portrait, mark, or image that represents you.", "나를 표현하는 초상, 마크 또는 이미지입니다.")} onChange={(url) => setField("profileImageUrl", url)} /><R2ImageUploader value={form.siteCoverImageUrl} assetType="cover" entityId={user.uid} label={tx(locale, "Site cover", "페이지 커버")} description={tx(locale, "The opening image visitors see on your page.", "방문자가 페이지에서 처음 만나는 이미지입니다.")} onChange={(url) => setField("siteCoverImageUrl", url)} /></div></div>
      <div className="profile-submit-row"><button className="button button-blue" type="submit" disabled={saving}>{saving ? tx(locale, "Saving…", "저장 중…") : tx(locale, "Save profile", "프로필 저장")} <ArrowUpRight size={15} /></button>{saved && <span className="save-confirm"><Check size={14} /> {tx(locale, "Saved", "저장됨")}</span>}{error && <span className="form-error">{error}</span>}<Link className="text-link" href="/dashboard/progress">{tx(locale, "See what your practice can unlock", "내 작업으로 열리는 기능 보기")} <ArrowUpRight size={13}/></Link></div>
    </form><aside className="profile-side">{managedSlug && adminAccess && <MembershipPanel slug={managedSlug} membership={managedProfile?.membership} locale={locale} />}<div className={hasArtistAccess ? "membership-status is-verified" : "membership-status"}><MetaLine>{tx(locale, "ARTIST ACCESS", "아티스트 이용 권한")}</MetaLine><h2>{hasArtistAccess ? tx(locale, "Your gallery is open.", "당신의 갤러리가 열려 있습니다.") : tx(locale, "Your practice can begin here.", "당신의 실천은 여기서 시작할 수 있습니다.")}</h2><p>{hasArtistAccess ? tx(locale, "Your public artist page is available. The 3D gallery is currently a separate local prototype.", "공개 아티스트 페이지를 구성할 수 있습니다. 3D 갤러리는 아직 별도 로컬 시제품으로 테스트 중입니다.") : tx(locale, "Build your artist page first. Shared 3D exhibitions are not available yet.", "먼저 작가 페이지를 구성하세요. 서버에 저장·공유하는 3D 전시는 아직 제공되지 않습니다.")}</p><div className="membership-meta"><span>{tx(locale, "Account role", "계정 역할")}<strong>{tx(locale, roleLabel?.en || "Artist", roleLabel?.ko || "아티스트")}</strong></span><span>{tx(locale, "Membership", "멤버십")}<strong>{hasArtistAccess ? tx(locale, membership?.active ? "Active membership" : "Verified artist", membership?.active ? "활성 멤버십" : "인증 아티스트") : tx(locale, "Open / review", "신청 / 검토")}</strong></span></div><a className="text-link" href="/dashboard/virtual-gallery">{tx(locale, "Open your space", "나의 공간 열기")} <ArrowUpRight size={14} /></a></div><div className="profile-note"><span>u.a.u</span><p>{tx(locale, "A profile is not a finished statement. It is a door left open for the next connection.", "프로필은 완성된 선언이 아닙니다. 다음 연결을 위해 열어둔 문입니다.")}</p></div></aside></div>

    {form.accountType === "artist" && <section className="profile-builder" aria-labelledby="builder-title"><div className="profile-builder-heading"><div><MetaLine>{tx(locale, "PUBLIC SITE BUILDER", "공개 페이지 빌더")}</MetaLine><h2 id="builder-title">{tx(locale, <>Give your practice<br /><em>a room of its own.</em></>, <>당신의 작업에<br /><em>자기만의 방을 주세요.</em></>)}</h2></div><LayoutTemplate size={22} aria-hidden="true" /></div><p className="profile-builder-intro">{tx(locale, "Choose a starting structure, then keep changing it as the work changes. Your public page stays connected to your u.a.u profile.", "작업의 변화에 맞춰 계속 바꿀 수 있는 시작 구조를 선택하세요. 공개 페이지는 u.a.u 프로필과 연결되어 있습니다.")}</p>
<ArtistTemplatePicker value={form.siteTemplate} onChange={(value) => setField("siteTemplate", value)} locale={locale}/>
<MovingBannerEditor value={form.movingBanner} onChange={(value) => setField("movingBanner", value)} locale={locale} disabled={saving}/>
<div className="builder-settings"><div><MetaLine>{tx(locale, "SITE ADDRESS", "페이지 주소")}</MetaLine><label className="builder-slug-field"><span>uau.unframe.kr/artist/</span><input value={form.publicSlug} onChange={(event) => setField("publicSlug", event.target.value)} placeholder="your-name" aria-label={tx(locale, "Public page address", "공개 페이지 주소")} /></label><label>{tx(locale, "Website / portfolio link", "웹사이트 / 포트폴리오 링크")}<input type="url" value={form.websiteUrl} onChange={(event) => setField("websiteUrl", event.target.value)} placeholder="https://" /></label><button type="button" className="button button-outline" onClick={exportPortfolio}><FileDown size={15}/>{tx(locale, "Export portfolio PDF", "포트폴리오 PDF 만들기")}</button><small>{tx(locale, "출력 창에서 ‘PDF로 저장’을 선택하세요.", "출력 창에서 ‘PDF로 저장’을 선택하세요.")}</small></div><div className="builder-controls"><MetaLine>{tx(locale, "PUBLISH SETTINGS", "공개 설정")}</MetaLine><label className="builder-check"><input type="checkbox" checked={form.sitePublished} onChange={(event) => setField("sitePublished", event.target.checked)} /><span><strong>{tx(locale, "Publish my page", "내 페이지 공개하기")}</strong><small>{tx(locale, "Anyone with the link can visit it.", "링크를 가진 누구나 방문할 수 있습니다.")}</small></span></label><div className="builder-sections"><div className="builder-common-sections"><strong>{tx(locale, "Common sections", "공통 섹션")}</strong><p>{tx(locale, "Identity · works · about / statement · CV · contact. Empty content is hidden.", "기본 정보 · 작품 · 소개/작가노트 · CV · 연락. 내용이 없으면 숨겨지며, 연락은 문의 항목을 켜면 표시됩니다.")}</p></div><span>{tx(locale, "Optional sections", "선택 섹션")}</span>{(["exhibitions", "studioArchive", "inspiration"] as ArtistSiteSection[]).map((section) => <label key={section}><input type="checkbox" checked={form.siteSections.includes(section)} onChange={() => toggleSection(section)} /> {tx(locale, artistSiteSectionLabels[section].en, artistSiteSectionLabels[section].ko)}</label>)}</div><label className="builder-check"><input type="checkbox" checked={form.collaborationOpen} onChange={(event) => setField("collaborationOpen", event.target.checked)} /><span><strong>{tx(locale, "Accept inquiries (works, exhibitions, collaborations)", "문의 받기 (작품·전시·협업)")}</strong><small>{tx(locale, "Turn this on to add an inquiry form to your page. New inquiries are emailed to you.", "켜면 작가 페이지에 문의 폼이 생기고, 새 문의는 이메일로 알려드려요.")}</small></span></label></div></div>
      <div className="builder-system-settings"><div className="builder-section-order"><MetaLine>{tx(locale, "PAGE ORDER", "페이지 순서")}</MetaLine><p>{tx(locale, "Arrange the sections in the order your practice wants to be read.", "작업이 읽히길 바라는 순서대로 섹션을 배치하세요.")}</p><div className="builder-order-list">{form.siteSections.map((section, index) => <div className="builder-order-row" key={section}><span>0{index + 1}</span><strong>{tx(locale, artistSiteSectionLabels[section].en, artistSiteSectionLabels[section].ko)}</strong><div><button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={tx(locale, `Move ${artistSiteSectionLabels[section].en} up`, `${artistSiteSectionLabels[section].ko} 위로 이동`)}><ArrowUp size={14} /></button><button type="button" onClick={() => moveSection(index, 1)} disabled={index === form.siteSections.length - 1} aria-label={tx(locale, `Move ${artistSiteSectionLabels[section].en} down`, `${artistSiteSectionLabels[section].ko} 아래로 이동`)}><ArrowDown size={14} /></button></div></div>)}</div></div><div className="builder-accent-control"><MetaLine>{tx(locale, "ACCENT", "강조색")}</MetaLine><p>{tx(locale, "Choose a restrained accent for your public room.", "공개 페이지에 사용할 절제된 강조색을 고르세요.")}</p><label><span className="sr-only">{tx(locale, "Artist page accent", "아티스트 페이지 강조색")}</span><select value={form.siteAccent} onChange={(event) => setField("siteAccent", event.target.value as ArtistSiteAccent)}>{(["blue", "ink", "clay"] as ArtistSiteAccent[]).map((accent) => <option value={accent} key={accent}>{tx(locale, artistSiteAccentLabels[accent].en, artistSiteAccentLabels[accent].ko)}</option>)}</select></label></div></div>
      <SelectedWorksEditor form={form} setField={setField} locale={locale} />
      <StudioRecordsEditor form={form} setField={setField} locale={locale} />
      <ContactPurposesEditor form={form} setField={setField} locale={locale} />
      <StudioVideoSettings form={form} setField={setField} locale={locale} />
      <WorkDimensionsSettings form={form} setField={setField} locale={locale} />
      <div className="builder-footer"><span>{tx(locale, "Your page is saved with your profile. Publish when it feels ready.", "페이지는 프로필과 함께 저장됩니다. 준비가 되었을 때 공개하세요.")}</span>{publicUrl && <a className="text-link" href={publicUrl} target="_blank" rel="noreferrer"><Eye size={14} /> {tx(locale, "Preview page", "페이지 미리보기")} <ExternalLink size={13} /></a>}</div>
    </section>}
    <dialog ref={previewDialog} className="profile-preview-dialog" onClose={() => setPreviewOpen(false)}><div className="profile-preview-toolbar"><strong>{tx(locale, "Unsaved draft preview", "저장 전 초안 미리보기")}</strong><button type="button" className="button button-outline" onClick={() => setPreviewOpen(false)}>{tx(locale, "Close", "닫기")}</button></div>{previewOpen && <ArtistProfileView locale={locale} previewOnly profile={{ ...form, slug: managedSlug || getPublicSlug(form.publicSlug, user.uid), ownerUid: managedProfile?.ownerUid || user.uid, published: false }}/>}</dialog><div className="profile-save-dock">{form.accountType === "artist" && <button className="button button-outline" type="button" onClick={() => setPreviewOpen(true)}>{tx(locale, "Preview draft", "초안 미리보기")}</button>}<span role="status" aria-live="polite">{error || (saving ? tx(locale, "Saving…", "저장 중…") : saved ? tx(locale, "Saved", "저장 완료") : formDirtyRef.current ? tx(locale, "Unsaved changes", "저장하지 않은 변경사항") : tx(locale, "Changes are published only after saving.", "변경 후 저장하면 반영됩니다."))}</span><button className="button button-blue" type="submit" form="artist-profile-form" disabled={saving}>{tx(locale, "Save changes", "변경사항 저장")}</button></div>
  </section></div></main>;
}
