"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowLeft, ArrowUpRight, Eye, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../../components";
import { R2ImageUploader } from "../../components/r2-image-uploader";
import { useAuth } from "../../auth-provider";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import type { ArtistSiteSection, ArtistSiteTemplate, ArtistSiteWork, PublicProfile } from "../../profile";

type ManagedProfile = PublicProfile;
type FormState = Omit<ManagedProfile, "slug" | "ownerUid" | "published" | "showCV" | "showAbout" | "showExhibitions" | "isDemonstration"> & {
  slug: string;
  ownerUid: string;
  published: boolean;
  showCV: boolean;
  showAbout: boolean;
  showExhibitions: boolean;
};

const defaultForm = (): FormState => ({
  slug: "", ownerUid: "", displayName: "", artistName: "", accountType: "artist", practice: "", basedInCity: "", country: "",
  bio: "", artistStatement: "", artistCv: "", websiteUrl: "", profileImageUrl: "", siteCoverImageUrl: "", artistAudioUrl: "",
  siteTemplate: "editorial", siteSections: ["works", "about", "cv"], siteAccent: "blue", showCV: true, showAbout: true, showExhibitions: true,
  published: false, verificationStatus: undefined, siteWorks: [], siteExhibitions: [], collaborationOpen: false, contactPurposes: [],
});

const sectionOptions: Array<{ id: ArtistSiteSection; en: string; ko: string }> = [
  { id: "works", en: "Works", ko: "작품" }, { id: "exhibitions", en: "Exhibitions", ko: "전시" },
  { id: "cv", en: "CV", ko: "CV" }, { id: "about", en: "About", ko: "소개" },
  { id: "studioArchive", en: "Studio archive", ko: "작업 아카이브" }, { id: "inspiration", en: "Inspiration", ko: "영감" },
];

export default function AdminArtistsPage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"checking" | "super_admin" | "denied">("checking");
  const [profiles, setProfiles] = useState<ManagedProfile[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user || !db) { setRole("denied"); return; }
    return onSnapshot(doc(db, "admins", user.uid), (snapshot) => {
      const data = snapshot.data();
      setRole(snapshot.exists() && data?.active === true && data?.role === "super_admin" ? "super_admin" : "denied");
    }, () => setRole("denied"));
  }, [user]);

  useEffect(() => {
    if (!db || role !== "super_admin") return;
    return onSnapshot(collection(db, "public_profiles"), (snapshot) => {
      setProfiles(snapshot.docs.map((item) => ({ ...item.data(), slug: item.id } as ManagedProfile)).filter((profile) => !profile.isDemonstration).sort((a, b) => (a.artistName || a.displayName).localeCompare(b.artistName || b.displayName)));
    }, (snapshotError) => setError(snapshotError.message));
  }, [role]);

  const selectedName = useMemo(() => editingId ? profiles.find((profile) => profile.slug === editingId)?.artistName || profiles.find((profile) => profile.slug === editingId)?.displayName || editingId : "", [editingId, profiles]);

  function startNew() {
    setEditingId(null); setForm(defaultForm()); setError(""); setMessage("");
  }

  function editProfile(profile: ManagedProfile) {
    router.push(`/admin/artists/${profile.slug}/edit`);
  }

  function updateWork(index: number, key: keyof ArtistSiteWork, value: string) {
    setForm((current) => ({ ...current, siteWorks: (current.siteWorks || []).map((work, itemIndex) => itemIndex === index ? { ...work, [key]: value } : work) }));
  }

  function addWork() {
    setForm((current) => ({ ...current, siteWorks: [...(current.siteWorks || []), { id: crypto.randomUUID(), title: "", year: "", medium: "", imageUrl: "" }] }));
  }

  async function saveProfile(publish: boolean, event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!db || !user || role !== "super_admin") return;
    const slug = form.slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setError(tx(locale, "Use a URL-safe slug with lowercase letters, numbers, and hyphens.", "주소는 영문 소문자·숫자·하이픈만 사용해 주세요.")); return; }
    if (editingId && slug !== editingId) { setError(tx(locale, "To keep existing links working, a saved page address cannot be changed here.", "기존 링크 보호를 위해 저장된 페이지 주소는 여기서 바꿀 수 없습니다.")); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const reference = doc(db, "public_profiles", slug);
      const isNew = !editingId;
      if (isNew && profiles.some((profile) => profile.slug === slug)) throw new Error(tx(locale, "That page address is already in use.", "이미 사용 중인 페이지 주소입니다."));
      const payload = {
        ...form, slug, ownerUid: editingId ? form.ownerUid : user.uid, accountType: "artist", published: publish,
        siteWorks: (form.siteWorks || []).filter((work) => work.title.trim()), siteExhibitions: form.siteExhibitions || [],
        updatedAt: serverTimestamp(), ...(isNew ? { createdAt: serverTimestamp(), createdByAdmin: user.uid } : {}),
      };
      await setDoc(reference, payload, { merge: true });
      setEditingId(slug); setForm((current) => ({ ...current, slug, published: publish }));
      setMessage(publish ? tx(locale, "Profile published. Open the preview link to review the public page.", "프로필을 공개했습니다. 미리보기 링크에서 공개 화면을 확인하세요.") : tx(locale, "Draft saved. Only administrators can preview it.", "초안을 저장했습니다. 관리자만 미리볼 수 있습니다."));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : tx(locale, "The profile could not be saved.", "프로필을 저장하지 못했습니다."));
    } finally { setSaving(false); }
  }

  if (authLoading || role === "checking") return <main className="admin-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking administrator access…", "관리자 권한을 확인하고 있습니다…")}</div></main>;
  if (role !== "super_admin") return <main className="admin-page"><DemoNotice /><div className="admin-denied"><ShieldCheck size={28}/><h1>{tx(locale, "Super admin access only.", "슈퍼 어드민 전용입니다.")}</h1><Link className="button button-quiet" href="/admin">{tx(locale, "Back to admin", "관리자 홈으로")}</Link></div></main>;

  return <main className="admin-page"><DemoNotice/><div className="admin-wrap"><aside className="admin-nav"><span className="dash-label">{tx(locale, "Admin / UNFRAME", "관리자 / UNFRAME")}</span><Link href="/admin"><ArrowLeft size={15}/>{tx(locale, "Admin overview", "관리자 개요")}</Link><a className="active" href="#profile-list">{tx(locale, "Artist profiles", "작가 프로필")}</a><div className="dash-bottom"><span>{user?.displayName || user?.email || "u.a.u admin"}</span><small>{tx(locale, "Super administrator", "슈퍼 어드민")}</small></div></aside><section className="admin-main admin-artist-manager">
    <header className="admin-artist-heading"><div><MetaLine>{tx(locale, "PROFILE STUDIO / ADMIN", "프로필 스튜디오 / 관리자")}</MetaLine><h1>{tx(locale, "Build an artist's room.", "작가의 공간을 만드세요.")}</h1><p>{tx(locale, "Create and maintain public artist pages. Drafts stay private until you publish.", "공개 작가 페이지를 만들고 관리합니다. 게시 전 초안은 비공개입니다.")}</p></div><div><button className="button button-blue" type="button" onClick={startNew}><Plus size={15}/>{tx(locale, "New profile", "새 프로필")}</button></div></header>
    {(message || error) && <p className={`admin-artist-flash${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>{error || message}</p>}
    <div className="admin-artist-layout"><section id="profile-list" className="admin-artist-list"><div className="admin-section-head"><div><MetaLine>{tx(locale, "PUBLIC PROFILE RECORDS", "작가 페이지 목록")}</MetaLine><h2>{tx(locale, "Pages", "프로필")}</h2></div><span>{profiles.length}</span></div>{profiles.length ? profiles.map((profile) => <button type="button" className={`admin-artist-row${editingId === profile.slug ? " is-selected" : ""}`} key={profile.slug} onClick={() => editProfile(profile)}><span className="admin-artist-avatar">{profile.profileImageUrl ? <img src={profile.profileImageUrl} alt=""/> : (profile.artistName || profile.displayName).slice(0, 1)}</span><span><strong>{profile.artistName || profile.displayName}</strong><small>/{profile.slug}</small></span><em className={profile.published ? "is-live" : ""}>{profile.published ? tx(locale, "Published", "공개") : tx(locale, "Draft", "초안")}</em></button>) : <p className="admin-empty">{tx(locale, "No managed artist pages yet. Create a profile to begin.", "관리 중인 작가 페이지가 없습니다. 새 프로필을 만들어 시작하세요.")}</p>}</section>
    <form className="admin-artist-form" onSubmit={(event) => void saveProfile(form.published, event)}>
      <div className="admin-artist-form-head"><div><MetaLine>{editingId ? tx(locale, "EDIT ARTIST PAGE", "작가 페이지 수정") : tx(locale, "NEW ARTIST PAGE", "새 작가 페이지")}</MetaLine><h2>{editingId ? selectedName : tx(locale, "A new introduction.", "새로운 소개.")}</h2></div>{editingId && <a className="admin-artist-preview" href={`/artist/${editingId}`} target="_blank" rel="noreferrer"><Eye size={14}/>{tx(locale, "Preview page", "페이지 미리보기")}<ArrowUpRight size={13}/></a>}</div>
      <div className="admin-artist-fields"><label>{tx(locale, "Page address", "페이지 주소")}<span className="admin-artist-slug"><b>/artist/</b><input value={form.slug} disabled={Boolean(editingId)} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="artist-name" required /></span></label><label>{tx(locale, "Artist name", "작가명")}<input value={form.artistName || ""} onChange={(event) => setForm({ ...form, artistName: event.target.value, displayName: form.displayName || event.target.value })} required /></label><label>{tx(locale, "Practice / role", "분야 / 역할")}<input value={form.practice || ""} onChange={(event) => setForm({ ...form, practice: event.target.value })} placeholder={tx(locale, "Painter, sculptor, artist…", "회화, 조각, 설치…")} /></label><div className="admin-artist-two"><label>{tx(locale, "City", "도시")}<input value={form.basedInCity || ""} onChange={(event) => setForm({ ...form, basedInCity: event.target.value })} /></label><label>{tx(locale, "Country", "국가")}<input value={form.country || ""} onChange={(event) => setForm({ ...form, country: event.target.value })} /></label></div><label>{tx(locale, "Short introduction", "짧은 소개")}<textarea rows={5} value={form.bio || ""} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label><label>{tx(locale, "Artist note", "작가 노트")}<textarea rows={5} value={form.artistStatement || ""} onChange={(event) => setForm({ ...form, artistStatement: event.target.value })} /></label><label>{tx(locale, "CV / profile record", "CV / 활동 이력")}<textarea rows={4} value={form.artistCv || ""} onChange={(event) => setForm({ ...form, artistCv: event.target.value })} /></label><label>{tx(locale, "Website", "웹사이트")}<input type="url" value={form.websiteUrl || ""} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} placeholder="https://" /></label></div>
      <div className="admin-artist-media"><R2ImageUploader value={form.profileImageUrl || ""} assetType="profile" entityId={form.slug || "artist-profile"} label={tx(locale, "Profile image", "프로필 이미지")} description={tx(locale, "Square portrait or mascot artwork", "정사각형 프로필 또는 마스코트 이미지")} onChange={(url) => setForm({ ...form, profileImageUrl: url })}/><R2ImageUploader value={form.siteCoverImageUrl || ""} assetType="cover" entityId={form.slug || "artist-cover"} label={tx(locale, "Cover image", "커버 이미지")} description={tx(locale, "A horizontal image for the opening view", "첫 화면에 보여줄 가로형 이미지")} onChange={(url) => setForm({ ...form, siteCoverImageUrl: url })}/></div>
      <section className="admin-artist-subsection"><div className="admin-section-head"><div><MetaLine>{tx(locale, "WORKS / PORTFOLIO", "작품 / 포트폴리오")}</MetaLine><h3>{tx(locale, "Selected works", "대표 작품")}</h3></div><button type="button" className="text-link" onClick={addWork}><Plus size={14}/>{tx(locale, "Add work", "작품 추가")}</button></div>{form.siteWorks?.map((work, index) => <div className="admin-artist-work" key={work.id}><div className="admin-artist-two"><label>{tx(locale, "Title", "작품명")}<input value={work.title} onChange={(event) => updateWork(index, "title", event.target.value)}/></label><label>{tx(locale, "Year", "연도")}<input value={work.year || ""} onChange={(event) => updateWork(index, "year", event.target.value)}/></label></div><label>{tx(locale, "Medium", "재료 / 매체")}<input value={work.medium || ""} onChange={(event) => updateWork(index, "medium", event.target.value)}/></label><R2ImageUploader value={work.imageUrl || ""} assetType="work" entityId={work.id} label={tx(locale, "Artwork image", "작품 이미지")} description={tx(locale, "Upload a clear image of this work", "작품이 잘 보이는 이미지를 올려주세요")} onChange={(url) => updateWork(index, "imageUrl", url)}/><button type="button" className="admin-artist-remove" onClick={() => setForm((current) => ({ ...current, siteWorks: current.siteWorks?.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={13}/>{tx(locale, "Remove work", "작품 삭제")}</button></div>)}{!form.siteWorks?.length && <p className="admin-empty">{tx(locale, "No works added. Add works when images and titles are ready.", "아직 등록한 작품이 없습니다. 제목과 이미지를 준비한 뒤 추가하세요.")}</p>}</section>
      <div className="admin-artist-settings"><label>{tx(locale, "Page layout", "페이지 템플릿")}<select value={form.siteTemplate} onChange={(event) => setForm({ ...form, siteTemplate: event.target.value as ArtistSiteTemplate })}><option value="editorial">{tx(locale, "Editorial", "에디토리얼")}</option><option value="gallery">{tx(locale, "Gallery", "갤러리")}</option><option value="archive">{tx(locale, "Archive", "아카이브")}</option></select></label><fieldset><legend>{tx(locale, "Visible sections", "보일 섹션")}</legend>{sectionOptions.map((section) => <label key={section.id}><input type="checkbox" checked={Boolean(form.siteSections?.includes(section.id))} onChange={(event) => setForm((current) => ({ ...current, siteSections: event.target.checked ? [...(current.siteSections || []), section.id] : (current.siteSections || []).filter((item) => item !== section.id) }))}/>{tx(locale, section.en, section.ko)}</label>)}</fieldset></div>
      <div className="admin-artist-savebar"><span>{form.published ? tx(locale, "This page is public.", "현재 공개 페이지입니다.") : tx(locale, "This page is a private draft.", "비공개 초안입니다.")}</span><button className="button button-quiet" type="submit" disabled={saving}><Save size={14}/>{saving ? tx(locale, "Saving…", "저장 중…") : form.published ? tx(locale, "Save changes", "수정 내용 저장") : tx(locale, "Save draft", "초안 저장")}</button><button className="button button-blue" type="button" disabled={saving} onClick={() => void saveProfile(!form.published)}>{form.published ? tx(locale, "Unpublish", "비공개로 전환") : tx(locale, "Publish page", "페이지 공개")} <ArrowUpRight size={14}/></button></div>
    </form></div>
  </section></div></main>;
}
