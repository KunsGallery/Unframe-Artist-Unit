"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where, type Timestamp } from "firebase/firestore";
import { useAuth } from "../../auth-provider";
import { DemoNotice, MetaLine } from "../../components";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { DashboardSidebar } from "../dashboard-sidebar";

type Inquiry = { id: string; requesterName: string; requesterEmail: string; artistSlug: string; workId: string; workTitle: string; message: string; status: string; createdAt?: Timestamp };

export default function InquiriesPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) { setLoading(false); return; }
    return onSnapshot(query(collection(db, "work_inquiries"), where("recipientUid", "==", user.uid)), (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Inquiry));
      items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setInquiries(items);
      setLoading(false);
      setError(null);
    }, (snapshotError) => { setError(snapshotError.message); setLoading(false); });
  }, [user]);

  async function changeStatus(id: string, status: string) {
    if (!db) return;
    try { await updateDoc(doc(db, "work_inquiries", id), { status, updatedAt: serverTimestamp() }); }
    catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Update failed."); }
  }

  if (authLoading) return <main className="dashboard-page"><p className="page-wrap">{tx(locale, "Opening inquiries…", "문의를 불러오는 중…")}</p></main>;
  if (!user) return <main className="dashboard-page page-wrap"><Link href="/login">{tx(locale, "Sign in to view inquiries", "문의 확인을 위해 로그인해 주세요")}</Link></main>;
  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="inquiries" /><section className="dashboard-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / WORK INQUIRIES", "MY U.A.U / 작품 문의")}</MetaLine><h1>{tx(locale, "Work inquiries", "작품·협업 문의")}</h1></div></div>{error && <p role="alert" className="admin-editor-error">{error}</p>}{!loading && !error && inquiries.length === 0 && <div className="empty-state"><h2>{tx(locale, "No inquiries yet.", "아직 도착한 문의가 없습니다.")}</h2><p>{tx(locale, "Work, exhibition, and collaboration requests will appear here.", "작품·전시·협업 문의가 이곳에 표시됩니다.")}</p></div>}<div className="inquiry-list">{inquiries.map((inquiry) => <article className="inquiry-item" key={inquiry.id}><div className="inquiry-item-head"><div><MetaLine>{inquiry.createdAt?.toDate().toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US") || ""}</MetaLine><h2>{inquiry.workTitle}</h2><span>{inquiry.requesterName} · <a href={`mailto:${encodeURIComponent(inquiry.requesterEmail)}`}>{inquiry.requesterEmail}</a></span></div><label>{tx(locale, "Status", "처리 상태")}<select value={inquiry.status} onChange={(event) => void changeStatus(inquiry.id, event.target.value)}><option value="new">{tx(locale, "New", "새 문의")}</option><option value="in_progress">{tx(locale, "In progress", "진행 중")}</option><option value="answered">{tx(locale, "Answered", "답변 완료")}</option><option value="closed">{tx(locale, "Closed", "종료")}</option></select></label></div><p>{inquiry.message}</p>{inquiry.workId !== "artist-profile" && <Link className="text-link" href={`/works/${encodeURIComponent(`${inquiry.artistSlug}~${inquiry.workId}`)}`}>{tx(locale, "Open work", "작품 보기")}</Link>}</article>)}</div></section></div></main>;
}
