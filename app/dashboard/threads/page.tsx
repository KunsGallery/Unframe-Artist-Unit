"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus, RefreshCw } from "lucide-react";
import { addDoc, collection, onSnapshot, query, serverTimestamp, where, type Timestamp } from "firebase/firestore";
import { useAuth } from "../../auth-provider";
import { DemoNotice, MetaLine } from "../../components";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { DashboardSidebar } from "../dashboard-sidebar";

type Room = { id: string; title: string; description: string; members: string[]; visibility: string; updatedAt?: Timestamp };

export default function ThreadsPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, router, user]);
  useEffect(() => {
    if (!db || !user) return;
    return onSnapshot(query(collection(db, "threads"), where("members", "array-contains", user.uid)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Room));
      next.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
      setRooms(next); setError("");
    }, (snapshotError) => setError(snapshotError.message));
  }, [user]);

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !user || !roomTitle.trim()) return;
    setCreating(true); setError("");
    try {
      const reference = await addDoc(collection(db, "threads"), { title: roomTitle.trim(), description: "", visibility: "private", ownerUid: user.uid, members: [user.uid], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setRoomTitle(""); setComposerOpen(false);
      router.push(`/dashboard/threads/${reference.id}`);
    } catch (createError) { setError(createError instanceof Error ? createError.message : "Room could not be created."); }
    finally { setCreating(false); }
  }

  if (loading || !user) return <main className="dashboard-page"><DemoNotice /><div className="auth-guard"><RefreshCw className="spin" size={18} /> {tx(locale, "Opening your rooms…", "룸을 여는 중…")}</div></main>;
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="threads" /><section className="dashboard-main threads-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / THREAD ROOMS", "MY U.A.U / 스레드 룸")}</MetaLine><h1>{tx(locale, "Your rooms", "나의 스레드 룸")}</h1></div><button className="button button-blue" type="button" onClick={() => setComposerOpen((current) => !current)}><Plus size={15} /> {tx(locale, "Start a room", "룸 만들기")}</button></div>{composerOpen && <form className="thread-composer" onSubmit={createRoom}><label>{tx(locale, "Room title", "룸 이름")}<input value={roomTitle} onChange={(event) => setRoomTitle(event.target.value)} placeholder={tx(locale, "A question worth keeping open", "계속 열어둘 질문")} autoFocus required /></label><button className="button button-blue" type="submit" disabled={creating}>{creating ? tx(locale, "Creating…", "만드는 중…") : tx(locale, "Create private room", "비공개 룸 만들기")} <ArrowUpRight size={15} /></button></form>}{error && <p role="alert" className="admin-editor-error">{error}</p>}<div className="thread-intro"><p>{tx(locale, "Private rooms for notes and conversations you want to continue.", "계속 이어가고 싶은 기록과 대화를 위한 비공개 룸입니다.")}</p><span>{rooms.length} {tx(locale, "rooms", "개 룸")}</span></div><div className="thread-list">{rooms.map((room, index) => <article className={`thread-row thread-tone-${index % 3}`} key={room.id}><span className="thread-index">{String(index + 1).padStart(2, "0")}</span><div className="thread-main-copy"><div className="thread-meta"><span>{tx(locale, "Thread room", "스레드 룸")}</span><span>{room.visibility === "private" ? tx(locale, "Private", "비공개") : tx(locale, "Open", "공개")}</span></div><h2>{room.title}</h2><p>{room.description}</p><div className="thread-members">{room.members.map((member) => <span key={member}>{member === user.uid ? "YOU" : member.slice(0, 2).toUpperCase()}</span>)}<small>{room.updatedAt?.toDate().toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US") || ""}</small></div></div><Link className="thread-open" href={`/dashboard/threads/${room.id}`} aria-label={tx(locale, `Open ${room.title}`, `${room.title} 열기`)}><ArrowUpRight size={18} /></Link></article>)}{rooms.length === 0 && <div className="empty-state"><h2>{tx(locale, "No rooms yet.", "아직 만든 룸이 없습니다.")}</h2><p>{tx(locale, "Start a room to keep notes and conversations together.", "룸을 만들어 기록과 대화를 한곳에 모아보세요.")}</p></div>}</div></section></div></main>;
}
