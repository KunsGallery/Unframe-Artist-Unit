"use client";

import { useEffect, useState } from "react";
import { Check, LockKeyhole, X } from "lucide-react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { DemoNotice, MetaLine } from "../../components";
import { db } from "../../firebase-client";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { createNotification } from "../../notifications";

type PendingUser = { uid: string; displayName?: string; email?: string; accountType?: string; accessStatus?: string; basedInCity?: string };
const adminRoles = ["super_admin", "editor", "curator", "support", "finance", "moderator"];

export default function AdminAccessPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!user || !db) { setAllowed(false); return; } return onSnapshot(doc(db, "admins", user.uid), (snapshot) => { const data = snapshot.data(); setAllowed(snapshot.exists() && data?.active === true && adminRoles.includes(data.role)); }, () => setAllowed(false)); }, [user]);
  useEffect(() => { if (!db || !allowed) return; return onSnapshot(collection(db, "users"), (snapshot) => { setUsers(snapshot.docs.map((item) => ({ uid: item.id, ...item.data() } as PendingUser)).filter((item) => item.accessStatus === "pending")); }, (snapshotError) => setError(snapshotError.message)); }, [allowed]);
  async function review(uid: string, next: "approved" | "rejected") { if (!db) return; await updateDoc(doc(db, "users", uid), { accessStatus: next, approvedAt: next === "approved" ? new Date() : null }); await createNotification({ recipientUid: uid, title: next === "approved" ? "Your U.A.U room is open" : "Your U.A.U access needs a little more context", body: next === "approved" ? "Your role access has been approved. The next room is ready." : "We could not open this role yet. You can keep exploring and update your profile.", href: "/dashboard", type: "Role access" }).catch(() => undefined); }
  if (loading || allowed === null) return <main className="admin-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking admin access…", "관리자 권한을 확인하고 있습니다…")}</div></main>;
  if (!allowed) return <main className="admin-page"><DemoNotice /><section className="access-page page-wrap"><LockKeyhole size={25} /><MetaLine>{tx(locale, "ADMIN / PRIVATE", "관리자 / 비공개")}</MetaLine><h1>{tx(locale, <>This room is<br /><em>private.</em></>, <>이 공간은<br /><em>비공개입니다.</em></>)}</h1><p>{tx(locale, "Your account does not have an active U.A.U admin role.", "계정에 활성화된 U.A.U 관리자 권한이 없습니다.")}</p></section></main>;
  return <main className="admin-page"><DemoNotice /><div className="page-wrap admin-access-page"><div className="admin-access-heading"><div><MetaLine>{tx(locale, "ADMIN / ROLE ACCESS", "관리자 / 역할 권한")}</MetaLine><h1>{tx(locale, <>Open the next<br /><em>room.</em></>, <>다음 공간을<br /><em>열어주세요.</em></>)}</h1></div><p>{tx(locale, "Curator, gallery, project, and institution access is reviewed here. Artists are reviewed in the artist queue.", "큐레이터, 갤러리, 프로젝트, 기관 계정의 접근 권한을 검토합니다. 아티스트는 기존 아티스트 검토 대기열에서 관리합니다.")}</p></div>{error && <p className="admin-alert is-error">{error}</p>}<div className="role-review-list">{users.length === 0 && <p className="admin-empty">{tx(locale, "No role requests are waiting.", "대기 중인 역할 신청이 없습니다.")}</p>}{users.map((item) => <div className="role-review-row" key={item.uid}><div><MetaLine>{item.accountType || "role"} · {item.basedInCity || "—"}</MetaLine><h2>{item.displayName || item.email || item.uid}</h2><small>{item.email} · {item.uid}</small></div><div className="review-actions"><button type="button" className="button button-blue" onClick={() => void review(item.uid, "approved")}><Check size={14} /> {tx(locale, "Approve", "승인")}</button><button type="button" className="button button-quiet" onClick={() => void review(item.uid, "rejected")}><X size={14} /> {tx(locale, "Hold", "보류")}</button></div></div>)}</div></div></main>;
}
