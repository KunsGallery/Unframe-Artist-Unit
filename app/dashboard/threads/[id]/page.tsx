"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where, type Timestamp } from "firebase/firestore";
import { useAuth } from "../../../auth-provider";
import { DemoNotice, MetaLine } from "../../../components";
import { db } from "../../../firebase-client";
import { useLanguage } from "../../../i18n-provider";
import { tx } from "../../../i18n-shared";
import { DashboardSidebar } from "../../dashboard-sidebar";

type Room = { id: string; title: string; members: string[]; ownerUid: string };
type Message = { id: string; senderUid: string; body: string; createdAt?: Timestamp };

export default function ThreadDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db || !id || !user) { setLoading(false); return; }
    const unRoom = onSnapshot(doc(db, "threads", id), (snapshot) => {
      setRoom(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Room) : null);
      setLoading(false);
    }, (nextError) => { setError(nextError.message); setLoading(false); });
    const unMessages = onSnapshot(query(collection(db, "thread_messages"), where("threadId", "==", id)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Message));
      next.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setMessages(next);
    }, (nextError) => setError(nextError.message));
    return () => { unRoom(); unMessages(); };
  }, [id, user]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !id || !user || !body.trim()) return;
    setSending(true); setError("");
    try {
      await addDoc(collection(db, "thread_messages"), { threadId: id, senderUid: user.uid, body: body.trim(), createdAt: serverTimestamp() });
      await updateDoc(doc(db, "threads", id), { updatedAt: serverTimestamp() }).catch(() => undefined);
      setBody("");
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Message could not be sent."); }
    finally { setSending(false); }
  }

  if (authLoading || !user) return <main className="dashboard-page page-wrap"><Link href="/login">{tx(locale, "Sign in to open this room", "룸을 열려면 로그인해 주세요")}</Link></main>;
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="threads" /><section className="dashboard-main"><Link className="text-link" href="/dashboard/threads">← {tx(locale, "All rooms", "모든 룸")}</Link><div className="dashboard-top"><div><MetaLine>{tx(locale, "PRIVATE THREAD", "비공개 스레드")}</MetaLine><h1>{room?.title || tx(locale, "Thread room", "스레드 룸")}</h1></div></div>{error && <p role="alert" className="admin-editor-error">{error}</p>}{!loading && !room && <p>{tx(locale, "This room is unavailable.", "이 룸에 접근할 수 없습니다.")}</p>}{room && <><div className="thread-message-list">{messages.map((message) => <article className={message.senderUid === user.uid ? "is-own" : ""} key={message.id}><span>{message.senderUid === user.uid ? tx(locale, "You", "나") : message.senderUid.slice(0, 8)} · {message.createdAt?.toDate().toLocaleString(locale === "ko" ? "ko-KR" : "en-US") || ""}</span><p>{message.body}</p></article>)}{messages.length === 0 && <p>{tx(locale, "Start the conversation with a note.", "첫 기록을 남겨 대화를 시작하세요.")}</p>}</div><form className="thread-message-form" onSubmit={send}><label>{tx(locale, "New message", "새 메시지")}<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} rows={4} required /></label><button type="submit" className="button button-blue" disabled={sending || !body.trim()}>{sending ? tx(locale, "Sending…", "보내는 중…") : tx(locale, "Send message", "메시지 보내기")}</button></form></>}</section></div></main>;
}
