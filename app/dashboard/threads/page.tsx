"use client";

import { ArrowUpRight, Boxes, Plus, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import type { FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../../components";
import { threads } from "../../data";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { DashboardSidebar } from "../dashboard-sidebar";
import { db } from "../../firebase-client";

export default function ThreadsPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [roomList, setRoomList] = useState(threads);
  const [composerOpen, setComposerOpen] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading || !user) return <main className="dashboard-page"><DemoNotice /><div className="auth-guard"><RefreshCw className="spin" size={18} /> {tx(locale, "Opening your rooms…", "룸을 여는 중…")}</div></main>;

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !user || !roomTitle.trim()) return;
    const uid = user.uid;
    setCreating(true);
    try {
      const reference = await addDoc(collection(db, "threads"), {
        title: roomTitle.trim(),
        type: "Project room",
        description: tx(locale, "A new room for the next thing in motion.", "다음 움직임을 위한 새로운 방입니다."),
        visibility: "private",
        ownerUid: uid,
        members: [uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setRoomList((current) => [{ id: reference.id, title: roomTitle.trim(), type: "Project room", updated: tx(locale, "Just now", "방금 전"), members: ["YOU"], description: tx(locale, "A new room for the next thing in motion.", "다음 움직임을 위한 새로운 방입니다."), visibility: "Private" }, ...current]);
      setRoomTitle("");
      setComposerOpen(false);
    } finally {
      setCreating(false);
    }
  }

  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="threads" /><section className="dashboard-main threads-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / THREAD ROOMS", "MY U.A.U / 스레드 룸")}</MetaLine><h1>{tx(locale, <>Keep the room<br /><em>open.</em></>, <>방을<br /><em>열어두기.</em></>)}</h1></div><button className="button button-blue" type="button" onClick={() => setComposerOpen((current) => !current)}><Plus size={15} /> {tx(locale, "Start a room", "룸 만들기")}</button></div>{composerOpen && <form className="thread-composer" onSubmit={createRoom}><label>{tx(locale, "Room title", "룸 이름")}<input value={roomTitle} onChange={(event) => setRoomTitle(event.target.value)} placeholder={tx(locale, "A question worth keeping open", "계속 열어둘 질문")} autoFocus required /></label><button className="button button-blue" type="submit" disabled={creating}>{creating ? tx(locale, "Creating…", "만드는 중…") : tx(locale, "Create private room", "비공개 룸 만들기")} <ArrowUpRight size={15} /></button></form>}<div className="thread-intro"><p>{tx(locale, "A room for the references, works, questions, and people that keep a practice moving.", "실천을 계속 움직이는 작품과 레퍼런스, 질문, 사람을 위한 방입니다.")}</p><span><i /> {tx(locale, "Private by default", "기본 비공개")}</span></div><div className="thread-list">{roomList.map((thread, index) => <article className={`thread-row thread-tone-${index % 3}`} key={thread.id}><div className="thread-index">{String(index + 1).padStart(2, "0")}</div><div className="thread-main-copy"><div className="thread-meta"><span>{thread.type}</span><span>{thread.visibility}</span></div><h2>{thread.title}</h2><p>{thread.description}</p><div className="thread-members">{thread.members.map((member) => <span key={member}>{member}</span>)}<small>{thread.updated}</small></div></div><button className="thread-open" type="button" aria-label={tx(locale, `Open ${thread.title}`, `${thread.title} 열기`)}><ArrowUpRight size={18} /></button></article>)}</div><div className="thread-call"><Boxes size={20} /><div><MetaLine>{tx(locale, "THE NEXT ROOM", "다음 룸")}</MetaLine><h2>{tx(locale, "Not every idea needs to be public yet.", "모든 아이디어가 아직 공개될 필요는 없습니다.")}</h2><p>{tx(locale, "Invite only the people who need to be in the room. Publish the parts that are ready to move.", "필요한 사람만 초대하고, 움직일 준비가 된 부분만 공개하세요.")}</p></div></div></section></div></main>;
}
