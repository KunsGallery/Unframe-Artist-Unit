"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { collection, doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "../../auth-provider";
import { DemoNotice, MetaLine } from "../../components";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import type { PublicProfile } from "../../profile";
import type { ExhibitionRecord, GalleryRecord } from "../../organizations";

function slugify(value: string) {
  return value.trim().toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

const blankGallery = { name: "", city: "", description: "", websiteUrl: "", published: false };
const blankExhibition = { title: "", year: "", startDate: "", endDate: "", description: "", artistSlugs: [] as string[], published: false };

export default function OrganizationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [galleries, setGalleries] = useState<GalleryRecord[]>([]);
  const [exhibitions, setExhibitions] = useState<ExhibitionRecord[]>([]);
  const [artists, setArtists] = useState<PublicProfile[]>([]);
  const [selectedGallery, setSelectedGallery] = useState("");
  const [galleryForm, setGalleryForm] = useState(blankGallery);
  const [exhibitionId, setExhibitionId] = useState("");
  const [exhibitionForm, setExhibitionForm] = useState(blankExhibition);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !db) { setAllowed(false); return; }
    return onSnapshot(doc(db, "admins", user.uid), (snapshot) => {
      setAllowed(snapshot.exists() && snapshot.data()?.active === true && ["super_admin", "editor", "curator"].includes(snapshot.data()?.role));
    }, () => setAllowed(false));
  }, [user]);

  useEffect(() => {
    if (!allowed || !db) return;
    const unsubGalleries = onSnapshot(collection(db, "galleries"), (snapshot) => {
      setGalleries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as GalleryRecord)));
    }, (nextError) => setError(nextError.message));
    const unsubExhibitions = onSnapshot(collection(db, "exhibitions"), (snapshot) => {
      setExhibitions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ExhibitionRecord)));
    }, (nextError) => setError(nextError.message));
    const unsubArtists = onSnapshot(collection(db, "public_profiles"), (snapshot) => {
      setArtists(snapshot.docs.map((item) => ({ slug: item.id, ...item.data() } as PublicProfile))
        .filter((item) => item.published && (!item.accountType || item.accountType === "artist")));
    }, (nextError) => setError(nextError.message));
    return () => { unsubGalleries(); unsubExhibitions(); unsubArtists(); };
  }, [allowed]);

  function selectGallery(id: string) {
    const gallery = galleries.find((item) => item.id === id);
    setSelectedGallery(id);
    setGalleryForm(gallery ? {
      name: gallery.name, city: gallery.city || "", description: gallery.description || "",
      websiteUrl: gallery.websiteUrl || "", published: gallery.published === true,
    } : blankGallery);
    setExhibitionId("");
    setExhibitionForm(blankExhibition);
    setError("");
    setNotice("");
  }

  function selectExhibition(id: string) {
    const exhibition = exhibitions.find((item) => item.id === id);
    setExhibitionId(id);
    setExhibitionForm(exhibition ? {
      title: exhibition.title, year: exhibition.year, startDate: exhibition.startDate || "",
      endDate: exhibition.endDate || "", description: exhibition.description || "",
      artistSlugs: exhibition.artistSlugs || [], published: exhibition.published === true,
    } : blankExhibition);
    setError("");
    setNotice("");
  }

  async function saveGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !user || !allowed) return;
    const firestore = db;
    setBusy(true); setError(""); setNotice("");
    try {
      const id = selectedGallery || slugify(galleryForm.name);
      if (!id) throw new Error(tx(locale, "Use Latin letters in the gallery name to create its page address.", "페이지 주소를 만들 수 있도록 갤러리 이름에 영문을 포함해 주세요."));
      const values = {
        ...galleryForm, name: galleryForm.name.trim(), city: galleryForm.city.trim(),
        description: galleryForm.description.trim(), websiteUrl: galleryForm.websiteUrl.trim(),
      };
      await runTransaction(firestore, async (transaction) => {
        const reference = doc(firestore, "galleries", id);
        const existing = await transaction.get(reference);
        if (!selectedGallery && existing.exists()) throw new Error(tx(locale, "A gallery with this address already exists.", "같은 주소의 갤러리가 이미 있습니다."));
        transaction.set(reference, {
          ...values, ownerUid: existing.exists() ? existing.data().ownerUid : user.uid,
          updatedAt: serverTimestamp(), ...(!existing.exists() ? { createdAt: serverTimestamp() } : {}),
        }, { merge: true });
      });
      setSelectedGallery(id);
      setNotice(tx(locale, "Gallery saved.", "갤러리를 저장했습니다."));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gallery could not be saved.");
    } finally { setBusy(false); }
  }

  async function saveExhibition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !user || !allowed || !selectedGallery) return;
    const firestore = db;
    setBusy(true); setError(""); setNotice("");
    try {
      if (exhibitionForm.startDate && exhibitionForm.endDate && exhibitionForm.endDate < exhibitionForm.startDate) {
        throw new Error(tx(locale, "End date must follow start date.", "종료일은 시작일 이후여야 합니다."));
      }
      const gallery = await getDoc(doc(firestore, "galleries", selectedGallery));
      if (!gallery.exists()) throw new Error(tx(locale, "Save the gallery first.", "갤러리를 먼저 저장해 주세요."));
      if (exhibitionForm.published && gallery.data().published !== true) {
        throw new Error(tx(locale, "Publish the gallery before publishing its exhibition.", "전시를 공개하려면 갤러리를 먼저 공개해 주세요."));
      }
      const reference = exhibitionId ? doc(firestore, "exhibitions", exhibitionId) : doc(collection(firestore, "exhibitions"));
      const existing = exhibitionId ? await getDoc(reference) : null;
      await setDoc(reference, {
        title: exhibitionForm.title.trim(), year: exhibitionForm.year.trim(),
        startDate: exhibitionForm.startDate, endDate: exhibitionForm.endDate,
        description: exhibitionForm.description.trim(), artistSlugs: exhibitionForm.artistSlugs,
        published: exhibitionForm.published, galleryId: selectedGallery,
        ownerUid: existing?.exists() ? existing.data().ownerUid : user.uid,
        updatedAt: serverTimestamp(), ...(!existing?.exists() ? { createdAt: serverTimestamp() } : {}),
      }, { merge: true });
      setExhibitionId(reference.id);
      setNotice(tx(locale, "Exhibition saved.", "전시를 저장했습니다."));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Exhibition could not be saved.");
    } finally { setBusy(false); }
  }

  if (authLoading || allowed === null) return <main className="admin-page page-wrap"><p>{tx(locale, "Checking access…", "권한 확인 중…")}</p></main>;
  if (!allowed) return <main className="admin-page page-wrap"><p>{tx(locale, "Gallery management requires a content editor role.", "갤러리 관리 권한이 필요합니다.")}</p><Link href="/admin">{tx(locale, "Back to admin", "관리자로 돌아가기")}</Link></main>;

  const galleryExhibitions = exhibitions.filter((item) => item.galleryId === selectedGallery);
  return <main className="admin-page"><DemoNotice /><div className="page-wrap organization-manager">
    <div className="organization-heading"><div><MetaLine>ADMIN / GALLERIES</MetaLine><h1>{tx(locale, "Galleries & exhibitions", "갤러리와 전시")}</h1><p>{tx(locale, "Manage multiple galleries from one account. Publish only confirmed records.", "한 계정에서 여러 갤러리를 관리합니다. 확인한 기록만 공개해 주세요.")}</p></div><Link href="/admin" className="text-link">← {tx(locale, "Admin", "관리자")}</Link></div>
    {(error || notice) && <p className={error ? "admin-editor-error" : "editor-save-state"} role={error ? "alert" : "status"}>{error || notice}</p>}
    <div className="organization-grid">
      <aside className="organization-list"><h2>{tx(locale, "Galleries", "갤러리")}</h2><button type="button" className={!selectedGallery ? "active" : ""} onClick={() => selectGallery("")}>+ {tx(locale, "Add gallery", "갤러리 추가")}</button>{galleries.map((gallery) => <button key={gallery.id} type="button" className={selectedGallery === gallery.id ? "active" : ""} onClick={() => selectGallery(gallery.id)}>{gallery.name}<small>{gallery.published ? tx(locale, "Public", "공개") : tx(locale, "Draft", "비공개")}</small></button>)}</aside>
      <div className="organization-forms">
        <form onSubmit={saveGallery} className="organization-form">
          <div className="organization-form-head"><h2>{selectedGallery ? galleryForm.name : tx(locale, "New gallery", "새 갤러리")}</h2>{selectedGallery && galleryForm.published && <Link href={`/galleries/${selectedGallery}`} target="_blank">{tx(locale, "View public page ↗", "공개 페이지 보기 ↗")}</Link>}</div>
          <label>{tx(locale, "Gallery name", "갤러리 이름")}<input required value={galleryForm.name} onChange={(event) => setGalleryForm({ ...galleryForm, name: event.target.value })} /></label>
          <label>{tx(locale, "City", "도시")}<input value={galleryForm.city} onChange={(event) => setGalleryForm({ ...galleryForm, city: event.target.value })} /></label>
          <label>{tx(locale, "Introduction", "소개")}<textarea rows={4} value={galleryForm.description} onChange={(event) => setGalleryForm({ ...galleryForm, description: event.target.value })} /></label>
          <label>{tx(locale, "Website", "웹사이트")}<input type="url" value={galleryForm.websiteUrl} onChange={(event) => setGalleryForm({ ...galleryForm, websiteUrl: event.target.value })} placeholder="https://" /></label>
          <label className="organization-check"><input type="checkbox" checked={galleryForm.published} onChange={(event) => setGalleryForm({ ...galleryForm, published: event.target.checked })} />{tx(locale, "Publish gallery", "갤러리 공개")}</label>
          <button type="submit" className="button button-blue" disabled={busy}>{busy ? tx(locale, "Saving…", "저장 중…") : tx(locale, "Save gallery", "갤러리 저장")}</button>
        </form>
        {selectedGallery && <section className="organization-exhibitions">
          <div className="organization-form-head"><h2>{tx(locale, "Exhibitions", "전시")}</h2><button type="button" onClick={() => selectExhibition("")}>+ {tx(locale, "New exhibition", "새 전시")}</button></div>
          <div className="organization-exhibition-list">{galleryExhibitions.map((exhibition) => <button type="button" className={exhibitionId === exhibition.id ? "active" : ""} onClick={() => selectExhibition(exhibition.id)} key={exhibition.id}>{exhibition.title}<small>{exhibition.published ? tx(locale, "Public", "공개") : tx(locale, "Draft", "비공개")}</small></button>)}</div>
          <form className="organization-form" onSubmit={saveExhibition}>
            <label>{tx(locale, "Exhibition title", "전시 제목")}<input required value={exhibitionForm.title} onChange={(event) => setExhibitionForm({ ...exhibitionForm, title: event.target.value })} /></label>
            <label>{tx(locale, "Year", "연도")}<input required inputMode="numeric" value={exhibitionForm.year} onChange={(event) => setExhibitionForm({ ...exhibitionForm, year: event.target.value })} placeholder="2026" /></label>
            <div className="organization-date-grid"><label>{tx(locale, "Start date", "시작일")}<input type="date" value={exhibitionForm.startDate} onChange={(event) => setExhibitionForm({ ...exhibitionForm, startDate: event.target.value })} /></label><label>{tx(locale, "End date", "종료일")}<input type="date" value={exhibitionForm.endDate} onChange={(event) => setExhibitionForm({ ...exhibitionForm, endDate: event.target.value })} /></label></div>
            <label>{tx(locale, "Description", "전시 소개")}<textarea rows={4} value={exhibitionForm.description} onChange={(event) => setExhibitionForm({ ...exhibitionForm, description: event.target.value })} /></label>
            <fieldset><legend>{tx(locale, "Participating artists", "참여 아티스트")}</legend>{artists.length ? artists.map((artist) => <label className="organization-check" key={artist.slug}><input type="checkbox" checked={exhibitionForm.artistSlugs.includes(artist.slug)} onChange={(event) => setExhibitionForm((current) => ({ ...current, artistSlugs: event.target.checked ? [...current.artistSlugs, artist.slug] : current.artistSlugs.filter((slug) => slug !== artist.slug) }))} />{artist.artistName || artist.displayName}</label>) : <p>{tx(locale, "Publish artist profiles before connecting them to an exhibition.", "공개된 아티스트 프로필이 있어야 전시에 연결할 수 있습니다.")}</p>}</fieldset>
            <label className="organization-check"><input type="checkbox" checked={exhibitionForm.published} onChange={(event) => setExhibitionForm({ ...exhibitionForm, published: event.target.checked })} />{tx(locale, "Publish exhibition", "전시 공개")}</label>
            <button type="submit" className="button button-blue" disabled={busy}>{busy ? tx(locale, "Saving…", "저장 중…") : tx(locale, "Save exhibition", "전시 저장")}</button>
          </form>
        </section>}
      </div>
    </div>
  </div></main>;
}
