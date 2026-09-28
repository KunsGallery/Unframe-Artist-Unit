"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { ArrowUpRight, Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../auth-provider";
import { DemoNotice, MetaLine } from "../../components";
import { R2ImageUploader } from "../../components/r2-image-uploader";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { useUserProfile } from "../../profile";
import { DashboardSidebar } from "../dashboard-sidebar";

type PreviewWork = { id: string; title: string; year: string; medium: string; dimensions: string; imageUrl: string };
type ViewingRoom = { id: string; ownerUid: string; artistSlug: string; artistName: string; title: string; intro: string; works: PreviewWork[]; active: boolean };
const blankWork = (): PreviewWork => ({ id: crypto.randomUUID(), title: "", year: "", medium: "", dimensions: "", imageUrl: "" });

export default function PrivateViewingRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const { profile } = useUserProfile(user?.uid);
  const [room, setRoom] = useState<ViewingRoom | null>(null);
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [works, setWorks] = useState<PreviewWork[]>([blankWork()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user || !db) return;
    return onSnapshot(query(collection(db, "private_viewing_rooms"), where("ownerUid", "==", user.uid)), (snapshot) => {
      const current = snapshot.docs[0];
      if (!current) { setRoom(null); return; }
      const data = current.data() as Omit<ViewingRoom, "id">;
      setRoom({ id: current.id, ...data });
      setTitle(data.title || ""); setIntro(data.intro || ""); setWorks(data.works?.length ? data.works : [blankWork()]);
    }, (snapshotError) => setError(snapshotError.message));
  }, [user]);

  const validWorks = useMemo(() => works.filter((work) => work.title.trim() && work.imageUrl), [works]);
  function updateWork(index: number, key: keyof PreviewWork, value: string) {
    setWorks((items) => items.map((work, itemIndex) => itemIndex === index ? { ...work, [key]: value } : work));
  }

  async function save() {
    if (!user || !db || !profile?.publicSlug || !title.trim() || validWorks.length === 0 || busy) return;
    setBusy(true); setError(""); setNotice("");
    const data = { ownerUid: user.uid, artistSlug: profile.publicSlug, artistName: profile.artistName || profile.displayName || user.displayName || "u.a.u artist", title: title.trim(), intro: intro.trim(), works: validWorks, active: true, updatedAt: serverTimestamp() };
    try {
      if (room) await updateDoc(doc(db, "private_viewing_rooms", room.id), data);
      else await addDoc(collection(db, "private_viewing_rooms"), { ...data, createdAt: serverTimestamp() });
      setNotice(tx(locale, "Viewing room saved. Its invitation link is ready.", "뷰잉룸을 저장했어요. 초대 링크를 사용할 수 있습니다."));
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : tx(locale, "The room could not be saved.", "룸을 저장하지 못했습니다.")); }
    finally { setBusy(false); }
  }

  async function toggleRoom() {
    if (!db || !room) return;
    try { await updateDoc(doc(db, "private_viewing_rooms", room.id), { active: !room.active, updatedAt: serverTimestamp() }); }
    catch (toggleError) { setError(toggleError instanceof Error ? toggleError.message : "Unable to update room status."); }
  }

  async function copyLink() {
    if (!room) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/viewing/${room.id}`); setNotice(tx(locale, "Invitation link copied.", "초대 링크를 복사했어요.")); }
    catch { setError(tx(locale, "Clipboard access is unavailable. Copy the link from the address field.", "클립보드에 접근할 수 없어요. 링크 주소를 직접 복사해 주세요.")); }
  }

  if (authLoading) return <main className="dashboard-page page-wrap"><p>{tx(locale, "Loading…", "불러오는 중…")}</p></main>;
  if (!user) return <main className="dashboard-page page-wrap"><Link href="/login">{tx(locale, "Sign in to manage a viewing room.", "뷰잉룸 관리를 위해 로그인해 주세요.")}</Link></main>;
  return <main className="dashboard-page"><DemoNotice/><div className="dashboard-wrap"><DashboardSidebar active="viewing"/><section className="dashboard-main viewing-room-editor"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / PRIVATE PREVIEW", "MY U.A.U / 프라이빗 프리뷰")}</MetaLine><h1>{tx(locale, "A room before\nthe opening.", "공개 전,\n먼저 건네는 방.")}</h1></div></div><p className="viewing-room-lede">{tx(locale, "Share selected, unpublished studies with a small circle through an unlisted invitation link.", "아직 공개하지 않은 작업을 초대 링크를 받은 사람에게 먼저 보여주세요.")}</p>{!profile?.publicSlug && <p className="admin-alert">{tx(locale, "Save your artist profile once before creating a viewing room.", "뷰잉룸을 만들기 전에 아티스트 프로필을 먼저 저장해 주세요.")} <Link href="/dashboard/profile">{tx(locale, "Open profile", "프로필 열기")} <ArrowUpRight size={13}/></Link></p>}{error && <p role="alert" className="admin-alert is-error">{error}</p>}{notice && <p role="status" className="admin-alert">{notice}</p>}<div className="viewing-room-warning"><EyeOff size={17}/><p>{tx(locale, "Invitation link is the only access check. Anyone who receives it can forward it, and uploaded images use public R2 URLs that can be copied. This is not DRM or leak-proof storage.", "링크를 받은 사람은 다시 전달할 수 있고, 업로드 이미지는 공개 R2 주소를 사용해 별도로 복사될 수 있어요. 유출 방지·DRM 기능은 아닙니다.")}</p></div><label className="viewing-room-field">{tx(locale, "Viewing room title", "뷰잉룸 제목")}<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder={tx(locale, "New works · private preview", "신작 · 프라이빗 프리뷰")}/></label><label className="viewing-room-field">{tx(locale, "A note for invited viewers", "초대 관람객에게 전할 말")}<textarea value={intro} onChange={(event) => setIntro(event.target.value)} rows={3} maxLength={1000}/></label><div className="viewing-room-work-heading"><div><MetaLine>{tx(locale, "SELECTED WORKS", "먼저 보여줄 작품")}</MetaLine><p>{tx(locale, "Add up to 9 works. Only complete entries with an image and title are included.", "최대 9점을 추가할 수 있어요. 제목과 이미지가 있는 작품만 포함됩니다.")}</p></div><button type="button" className="button button-outline" disabled={works.length >= 9} onClick={() => setWorks((items) => [...items, blankWork()])}><Plus size={14}/>{tx(locale, "Add a work", "작품 추가")}</button></div><div className="viewing-room-works">{works.map((work, index) => <article className="viewing-room-work" key={work.id}><div className="viewing-room-work-top"><span>0{index + 1}</span><button type="button" aria-label={tx(locale, "Remove work", "작품 삭제")} onClick={() => setWorks((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14}/></button></div><label>{tx(locale, "Title", "작품명")}<input value={work.title} onChange={(event) => updateWork(index, "title", event.target.value)} maxLength={120}/></label><div className="profile-two-up"><label>{tx(locale, "Year", "연도")}<input value={work.year} onChange={(event) => updateWork(index, "year", event.target.value)} maxLength={20}/></label><label>{tx(locale, "Dimensions", "규격")}<input value={work.dimensions} onChange={(event) => updateWork(index, "dimensions", event.target.value)} maxLength={80} placeholder="116.8 × 91 cm"/></label></div><label>{tx(locale, "Medium", "재료 / 매체")}<input value={work.medium} onChange={(event) => updateWork(index, "medium", event.target.value)} maxLength={120}/></label><R2ImageUploader value={work.imageUrl} assetType="work" entityId={`${user.uid}-private-${work.id}`} label={tx(locale, "Preview image", "프리뷰 이미지")} description={tx(locale, "Upload an image for invited viewers.", "초대 관람객에게 보여줄 이미지를 업로드하세요.")} onChange={(url) => updateWork(index, "imageUrl", url)}/></article>)}</div><div className="viewing-room-save-row"><button type="button" className="button button-blue" disabled={busy || !profile?.publicSlug || !title.trim() || !validWorks.length} onClick={() => void save()}>{busy ? tx(locale, "Saving…", "저장 중…") : room ? tx(locale, "Save changes", "변경 사항 저장") : tx(locale, "Create invitation room", "초대 룸 만들기")} <ArrowUpRight size={15}/></button>{room && <><button type="button" className="button button-outline" onClick={() => void copyLink()}><Copy size={14}/>{tx(locale, "Copy invitation link", "초대 링크 복사")}</button><button type="button" className="button button-outline" onClick={() => void toggleRoom()}>{room.active ? <EyeOff size={14}/> : <Eye size={14}/>} {room.active ? tx(locale, "Close room", "룸 닫기") : tx(locale, "Reopen room", "룸 다시 열기")}</button><Link className="text-link" href={`/viewing/${room.id}`} target="_blank">{tx(locale, "Preview room", "룸 미리보기")} <ArrowUpRight size={14}/></Link></>}</div></section></div></main>;
}
