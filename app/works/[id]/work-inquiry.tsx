"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Mail } from "lucide-react";
import { useAuth } from "../../auth-provider";
import { db } from "../../firebase-client";
import { tx, type Locale } from "../../i18n-shared";
import type { ArtistSiteWork, PublicProfile } from "../../profile";

export function WorkInquiry({ work, profile, locale }: { work: ArtistSiteWork; profile: PublicProfile; locale: Locale }) {
  const { user } = useAuth();
  const inquiryContext = [
    `${tx(locale, "Work", "문의 작품")}: ${work.title}${work.year ? `, ${work.year}` : ""}`,
    work.medium ? `${tx(locale, "Medium", "재료 / 매체")}: ${work.medium}` : "",
    "",
  ].filter(Boolean).join("\n");
  const [message, setMessage] = useState(inquiryContext);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !user || !message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await addDoc(collection(db, "work_inquiries"), {
        requesterUid: user.uid,
        requesterName: user.displayName || user.email || "u.a.u member",
        requesterEmail: user.email || "",
        recipientUid: profile.ownerUid,
        artistSlug: profile.slug,
        workId: work.id,
        workTitle: work.title,
        message: message.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      });
      setSent(true);
      setMessage(inquiryContext);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : tx(locale, "Inquiry could not be sent.", "문의를 보내지 못했습니다."));
    } finally {
      setSending(false);
    }
  }

  return <section className="work-inquiry"><h2>{tx(locale, "Ask about this work", "이 작품 문의하기")}</h2>{sent ? <p role="status">{tx(locale, "Your inquiry has been sent to the artist.", "아티스트에게 문의가 전달되었습니다.")}</p> : user ? <form onSubmit={submit}><label>{tx(locale, "Message", "문의 내용")}<textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={10} maxLength={2000} rows={5} placeholder={tx(locale, "Tell the artist what you would like to know.", "작품에 관해 궁금한 내용을 적어주세요.")} /></label><button className="button button-blue" type="submit" disabled={sending || message.trim().length < 10}><Mail size={15} /> {sending ? tx(locale, "Sending…", "보내는 중…") : tx(locale, "Send inquiry", "문의 보내기")}</button>{error && <p role="alert">{error}</p>}</form> : <p>{tx(locale, "Sign in to send an inquiry directly to the artist.", "로그인하면 아티스트에게 직접 문의할 수 있습니다.")} <Link href="/login">{tx(locale, "Sign in", "로그인")}</Link></p>}</section>;
}
