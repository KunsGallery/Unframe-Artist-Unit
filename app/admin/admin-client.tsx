"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { ArrowUpRight, Bell, Check, FileText, LayoutDashboard, LogOut, ShieldCheck, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../components";
import { useAuth } from "../auth-provider";
import { db } from "../firebase-client";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { createNotification, type UauNotification } from "../notifications";

type AdminRole = "super_admin" | "editor" | "curator" | "support" | "finance" | "moderator";
type AdminRecord = { id: string; role?: AdminRole; active?: boolean; email?: string };
type DataRecord = { id: string; [key: string]: unknown };
const roles: AdminRole[] = ["super_admin", "editor", "curator", "support", "finance", "moderator"];

function useAdminData(uid?: string | null) {
  const [access, setAccess] = useState<"checking" | "allowed" | "denied">("checking");
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Record<string, DataRecord[]>>({});
  const [admins, setAdmins] = useState<AdminRecord[]>([]);

  useEffect(() => {
    if (!uid || !db) {
      setAccess("denied");
      return;
    }

    const firestore = db;
    const unsubscribeAccess = onSnapshot(doc(firestore, "admins", uid), (snapshot) => {
      const data = snapshot.data();
      setAccess(snapshot.exists() && data?.active === true && roles.includes(data.role as AdminRole) ? "allowed" : "denied");
    }, () => {
      setError("Admin access could not be verified.");
      setAccess("denied");
    });
    const names = ["users", "artists", "artworks", "projects", "notifications"];
    const unsubscribeCollections = names.map((name) => onSnapshot(collection(firestore, name), (snapshot) => {
      setCollections((current) => ({ ...current, [name]: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) }));
    }, (snapshotError) => setError(snapshotError.message)));
    const unsubscribeAdmins = onSnapshot(collection(firestore, "admins"), (snapshot) => {
      setAdmins(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AdminRecord)));
    }, (snapshotError) => setError(snapshotError.message));

    return () => {
      unsubscribeAccess();
      unsubscribeCollections.forEach((unsubscribe) => unsubscribe());
      unsubscribeAdmins();
    };
  }, [uid]);

  return { access, error, collections, admins };
}

export default function AdminClient() {
  const { locale } = useLanguage();
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { access, error, collections, admins } = useAdminData(user?.uid);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notificationForm, setNotificationForm] = useState({ recipientUid: "", title: "", body: "", type: "System update" });
  const [adminForm, setAdminForm] = useState({ uid: "", role: "editor" as AdminRole });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, router, user]);

  const stats = useMemo(() => ({
    users: collections.users?.length ?? 0,
    artists: collections.artists?.length ?? 0,
    artworks: collections.artworks?.length ?? 0,
    projects: collections.projects?.length ?? 0,
    notifications: collections.notifications?.length ?? 0,
  }), [collections]);
  const pendingArtists = useMemo(() => (collections.artists ?? []).filter((artist) => artist.applicationStatus === "pending"), [collections.artists]);
  const recentNotifications = useMemo(() => (collections.notifications ?? []).slice(0, 6) as UauNotification[], [collections.notifications]);

  async function approveArtist(artistId: string) {
    if (!db) return;
    setActionError(null);
    try {
      await updateDoc(doc(db, "artists", artistId), { verified: true, applicationStatus: "approved", published: true, updatedAt: serverTimestamp() });
      setNotice(tx(locale, "Artist approved and published.", "아티스트를 승인하고 공개했습니다."));
    } catch (approveError) {
      setActionError(approveError instanceof Error ? approveError.message : "Approval failed.");
    }
  }

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!notificationForm.recipientUid || !notificationForm.title || !notificationForm.body) return;
    setSending(true);
    setActionError(null);
    try {
      await createNotification(notificationForm);
      setNotificationForm({ recipientUid: "", title: "", body: "", type: "System update" });
      setNotice(tx(locale, "Notification sent in real time.", "알림을 실시간으로 발송했습니다."));
    } catch (sendError) {
      setActionError(sendError instanceof Error ? sendError.message : "Notification could not be sent.");
    } finally {
      setSending(false);
    }
  }

  async function addAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !adminForm.uid.trim()) return;
    setActionError(null);
    try {
      await setDoc(doc(db, "admins", adminForm.uid.trim()), { role: adminForm.role, active: true, updatedAt: serverTimestamp() }, { merge: true });
      setAdminForm({ uid: "", role: "editor" });
      setNotice(tx(locale, "Admin access updated.", "관리자 권한을 업데이트했습니다."));
    } catch (adminError) {
      setActionError(adminError instanceof Error ? adminError.message : "Admin access could not be updated.");
    }
  }

  async function revokeAdmin(adminUid: string) {
    if (!db) return;
    try {
      await updateDoc(doc(db, "admins", adminUid), { active: false, updatedAt: serverTimestamp() });
      setNotice(tx(locale, "Admin access revoked.", "관리자 권한을 해제했습니다."));
    } catch (revokeError) {
      setActionError(revokeError instanceof Error ? revokeError.message : "Admin access could not be revoked.");
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (authLoading || !user || access === "checking") {
    return <main className="admin-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking administrator access…", "관리자 권한을 확인하고 있습니다…")}</div></main>;
  }

  if (access === "denied") {
    return <main className="admin-page"><DemoNotice /><div className="admin-denied"><ShieldCheck size={28} /><h1>{tx(locale, "This room is private.", "이 공간은 관리자 전용입니다.")}</h1><p>{tx(locale, "Your account does not have an active u.a.u admin role.", "현재 계정에는 활성화된 u.a.u 관리자 권한이 없습니다.")}</p><button className="button button-blue" type="button" onClick={() => router.replace("/dashboard")}>{tx(locale, "Return to dashboard", "대시보드로 돌아가기")} <ArrowUpRight size={15} /></button></div></main>;
  }

  return <main className="admin-page"><DemoNotice /><div className="admin-wrap"><aside className="admin-nav"><span className="dash-label">{tx(locale, "Admin / UNFRAME", "관리자 / UNFRAME")}</span><a className="active" href="#overview"><LayoutDashboard size={16} /> {tx(locale, "Overview", "개요")}</a><a href="#review"><Users size={16} /> {tx(locale, "Artist review", "아티스트 검토")} {pendingArtists.length > 0 && <b>{pendingArtists.length}</b>}</a><a href="#notifications"><Bell size={16} /> {tx(locale, "Notifications", "알림")}</a><a href="#content"><FileText size={16} /> {tx(locale, "Content", "콘텐츠")}</a><a href="#admins"><ShieldCheck size={16} /> {tx(locale, "Admin access", "관리자 권한")}</a><div className="dash-bottom"><span>{user.displayName || user.email || "u.a.u admin"}</span><small>{tx(locale, "Active administrator", "활성 관리자")}</small><button className="dashboard-signout" type="button" onClick={handleLogout}><LogOut size={14} /> {tx(locale, "Sign out", "로그아웃")}</button></div></aside><section className="admin-main"><div id="overview" className="admin-top"><div><MetaLine>{tx(locale, "ADMIN / SYSTEM OVERVIEW", "관리자 / 시스템 개요")}</MetaLine><h1>{tx(locale, <>The unit,<br /><em>in motion.</em></>, <>움직이는<br /><em>유닛.</em></>)}</h1></div><span className="admin-date">{tx(locale, "Live Firestore view", "Firestore 실시간 보기")}</span></div>{(notice || actionError || error) && <div className={actionError || error ? "admin-alert is-error" : "admin-alert"}>{actionError || error || notice}<button type="button" onClick={() => { setNotice(null); setActionError(null); }} aria-label={tx(locale, "Dismiss message", "메시지 닫기")}><X size={14} /></button></div>}<div className="admin-stats"><div><span>{tx(locale, "Registered users", "가입 사용자")}</span><strong>{stats.users}</strong><small>{tx(locale, "Live collection", "실시간 컬렉션")}</small></div><div><span>{tx(locale, "Artists", "아티스트")}</span><strong>{stats.artists}</strong><small>{tx(locale, String(pendingArtists.length) + " pending review", "검토 대기 " + pendingArtists.length + "명")}</small></div><div><span>{tx(locale, "Works", "작품")}</span><strong>{stats.artworks}</strong><small>{tx(locale, "Live collection", "실시간 컬렉션")}</small></div><div><span>{tx(locale, "Projects", "프로젝트")}</span><strong>{stats.projects}</strong><small>{tx(locale, "Live collection", "실시간 컬렉션")}</small></div></div><div id="review" className="admin-columns"><section className="admin-table"><div className="admin-section-head"><div><MetaLine>{tx(locale, "REVIEW QUEUE", "검토 대기열")}</MetaLine><h2>{tx(locale, "Artist applications", "아티스트 신청")}</h2></div></div>{pendingArtists.length === 0 && <p className="admin-empty">{tx(locale, "No artist applications are waiting.", "대기 중인 아티스트 신청이 없습니다.")}</p>}{pendingArtists.slice(0, 8).map((artist) => <div className="review-row" key={artist.id}><span>{artist.id.slice(0, 6)}</span><div><strong>{String(artist.name ?? artist.artistName ?? "Unnamed artist")}</strong><small>{String(artist.basedInCity ?? artist.nationality ?? "—")}</small></div><button type="button" onClick={() => approveArtist(artist.id)} aria-label={tx(locale, "Approve artist", "아티스트 승인")}><Check size={15} /></button></div>)}</section><section id="content" className="admin-activity"><div className="admin-section-head"><div><MetaLine>{tx(locale, "SYSTEM PULSE", "시스템 현황")}</MetaLine><h2>{tx(locale, "What is connected", "연결된 시스템")}</h2></div></div>{[[tx(locale, "Notifications", "알림"), stats.notifications], [tx(locale, "Administrators", "관리자"), admins.filter((admin) => admin.active).length], [tx(locale, "Users", "사용자"), stats.users]].map(([label, count]) => <div className="log-row" key={String(label)}><i /><p>{String(label)}<strong>{String(count)}</strong><small>{tx(locale, "Documents in Firestore", "Firestore 문서")}</small></p></div>)}</section></div><section id="notifications" className="admin-tool-grid"><div className="admin-tool"><MetaLine>{tx(locale, "REAL-TIME DELIVERY", "실시간 발송")}</MetaLine><h2>{tx(locale, "Send a note into the unit.", "유닛에 알림 보내기.")}</h2><form onSubmit={sendNotification}><label>{tx(locale, "Recipient UID", "수신자 UID")}<input value={notificationForm.recipientUid} onChange={(event) => setNotificationForm({ ...notificationForm, recipientUid: event.target.value })} placeholder="Firebase Auth UID" required /></label><label>{tx(locale, "Title", "제목")}<input value={notificationForm.title} onChange={(event) => setNotificationForm({ ...notificationForm, title: event.target.value })} placeholder={tx(locale, "A new thread is waiting", "새로운 실마리가 도착했습니다")} required /></label><label>{tx(locale, "Message", "메시지")}<textarea value={notificationForm.body} onChange={(event) => setNotificationForm({ ...notificationForm, body: event.target.value })} placeholder={tx(locale, "Write a short update…", "짧은 업데이트를 작성해주세요…")} rows={3} required /></label><label>{tx(locale, "Type", "유형")}<input value={notificationForm.type} onChange={(event) => setNotificationForm({ ...notificationForm, type: event.target.value })} /></label><button className="button button-blue" type="submit" disabled={sending}>{sending ? tx(locale, "Sending…", "발송 중…") : tx(locale, "Send notification", "알림 보내기")} <ArrowUpRight size={15} /></button></form></div><div className="admin-tool"><MetaLine>{tx(locale, "RECENT NOTIFICATIONS", "최근 알림")}</MetaLine><h2>{tx(locale, "The live feed.", "실시간 피드.")}</h2>{recentNotifications.length === 0 && <p className="admin-empty">{tx(locale, "No notifications have been sent yet.", "아직 발송된 알림이 없습니다.")}</p>}{recentNotifications.map((notification) => <div className="admin-notification-row" key={notification.id}><span className={notification.read ? "read-state" : "unread-state"}>{notification.read ? "read" : "new"}</span><div><strong>{notification.title}</strong><small>{notification.recipientUid}</small></div></div>)}</div></section><section id="admins" className="admin-tool-grid"><div className="admin-tool"><MetaLine>{tx(locale, "ACCESS CONTROL", "접근 제어")}</MetaLine><h2>{tx(locale, "Give the right people a key.", "필요한 사람에게 키를 주세요.")}</h2><form onSubmit={addAdmin}><label>{tx(locale, "User UID", "사용자 UID")}<input value={adminForm.uid} onChange={(event) => setAdminForm({ ...adminForm, uid: event.target.value })} placeholder="Firebase Auth UID" required /></label><label>{tx(locale, "Role", "역할")}<select value={adminForm.role} onChange={(event) => setAdminForm({ ...adminForm, role: event.target.value as AdminRole })}>{roles.map((role) => <option value={role} key={role}>{role}</option>)}</select></label><button className="button button-blue" type="submit">{tx(locale, "Grant access", "권한 부여")} <ArrowUpRight size={15} /></button></form></div><div className="admin-tool"><MetaLine>{tx(locale, "ADMIN REGISTRY", "관리자 목록")}</MetaLine><h2>{tx(locale, "Who can enter.", "접근 가능한 사람.")}</h2>{admins.map((admin) => <div className="admin-notification-row" key={admin.id}><span className={admin.active ? "read-state" : "revoked-state"}>{admin.active ? "active" : "revoked"}</span><div><strong>{admin.email || admin.id}</strong><small>{admin.role || "editor"}</small></div>{admin.id !== user.uid && admin.active && <button type="button" onClick={() => revokeAdmin(admin.id)} aria-label={tx(locale, "Revoke access", "권한 해제")}><X size={14} /></button>}</div>)}</div></section></section></div></main>;
}
