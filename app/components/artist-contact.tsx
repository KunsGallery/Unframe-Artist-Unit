"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ArrowUpRight, Mail } from "lucide-react";
import { useAuth } from "../auth-provider";
import { db } from "../firebase-client";
import { tx, type Locale } from "../i18n-shared";
import type { PublicProfile } from "../profile";

const purposes = [{ id: "work", en: "Artwork purchase or loan", ko: "작품 구매·대여" }, { id: "curation", en: "Exhibition / curatorial proposal", ko: "전시·기획 제안" }, { id: "collaboration", en: "Collaboration", ko: "협업 제안" }, { id: "other", en: "Other inquiry", ko: "기타 문의" }];

export function ArtistContact({ profile, locale }: { profile: PublicProfile; locale: Locale }) {
  const { user } = useAuth();
  const [purpose, setPurpose] = useState(profile.contactPurposes?.[0] || purposes[0].id);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !user || message.trim().length < 10 || sending) return;
    setSending(true); setError("");
    try {
      const purposeLabel = purposes.find((item) => item.id === purpose);
      await addDoc(collection(db, "work_inquiries"), { requesterUid: user.uid, requesterName: user.displayName || user.email || "u.a.u member", requesterEmail: user.email || "", recipientUid: profile.ownerUid, artistSlug: profile.slug, workId: "artist-profile", workTitle: purposeLabel ? tx(locale, purposeLabel.en, purposeLabel.ko) : purpose, message: message.trim(), status: "new", createdAt: serverTimestamp() });
      setSent(true); setMessage("");
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : tx(locale, "Your message could not be sent.", "문의를 보내지 못했습니다.")); }
    finally { setSending(false); }
  }
  const activePurposes = profile.contactPurposes?.length ? profile.contactPurposes : purposes.map((item) => item.id);
  return <section className="artist-contact"><div><span className="public-section-label">{tx(locale, "A WAY TO CONNECT", "연결을 위한 연락")}</span><h2>{profile.collaborationOpen ? tx(locale, "Open to a next conversation.", "다음 대화를 기다리고 있어요.") : tx(locale, "Contact the artist", "작가에게 연락하기")}</h2><p>{tx(locale, "문의 목적을 선택하면 작가의 U.A.U 받은 편지함으로 전달됩니다.", "문의 목적을 선택하면 작가의 U.A.U 받은 편지함으로 전달됩니다.")}</p></div>{sent ? <p className="contact-success" role="status">{tx(locale, "Your note is with the artist.", "작가에게 문의를 전달했어요.")}</p> : user ? <form onSubmit={submit}><label>{tx(locale, "Purpose", "문의 목적")}<select value={purpose} onChange={(event) => setPurpose(event.target.value)}>{activePurposes.map((id) => { const item = purposes.find((candidate) => candidate.id === id); return item ? <option key={item.id} value={item.id}>{tx(locale, item.en, item.ko)}</option> : null; })}</select></label><label>{tx(locale, "Your message", "문의 내용")}<textarea required minLength={10} maxLength={2000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={tx(locale, "A little context helps the artist respond.", "문의 내용을 구체적으로 적어주세요.")}/></label><button className="button button-blue" disabled={sending || message.trim().length < 10}><Mail size={15}/>{sending ? tx(locale, "Sending…", "보내는 중…") : tx(locale, "Send inquiry", "문의 보내기")} <ArrowUpRight size={14}/></button>{error && <p role="alert">{error}</p>}</form> : <p>{tx(locale, "Sign in to send a private inquiry to the artist.", "로그인하면 작가에게 비공개로 문의할 수 있어요.")} <Link href="/login">{tx(locale, "Sign in", "로그인")}</Link></p>}</section>;
}
