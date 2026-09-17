"use client";

import { Bell } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../../components";
import { DashboardSidebar } from "../dashboard-sidebar";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";

const notifications = [
  { title: "Han Mira", body: "added a new work to After the Salon", time: "2 hours ago", initials: "HM", tone: "tone-blue" },
  { title: "Yoon Doyun", body: "accepted your project invite", time: "Yesterday", initials: "YD", tone: "tone-clay" },
  { title: "UNFRAME Salon 04", body: "has a new connection update", time: "3 days ago", initials: "04", tone: "tone-ink" },
];

export default function NotificationsPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading || !user) {
    return <main className="dashboard-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking your account…", "계정을 확인하고 있습니다…")}</div></main>;
  }

  return <main className="dashboard-page"><DemoNotice /><div className="dashboard-wrap"><DashboardSidebar active="notifications" /><section className="dashboard-main notifications-main"><div className="dashboard-top"><div><MetaLine>{tx(locale, "MY U.A.U / NOTIFICATIONS", "MY U.A.U / 알림")}</MetaLine><h1>{tx(locale, <>Stay close to<br /><em>the thread.</em></>, <>실마리에서<br /><em>멀어지지 않기.</em></>)}</h1></div><div className="profile-chip"><Bell size={16} /> <span>{tx(locale, "2 new", "새 알림 2개")}</span></div></div><div className="notifications-list">{notifications.map((notification, index) => <article className={index < 2 ? "notification-row is-unread" : "notification-row"} key={`${notification.title}-${notification.time}`}><span className={`activity-mark ${notification.tone}`}>{notification.initials}</span><div><strong>{notification.title}</strong><p>{tx(locale, notification.body, index === 0 ? "After the Salon에 새 작품을 추가했습니다" : index === 1 ? "프로젝트 초대를 수락했습니다" : "새로운 연결 업데이트가 있습니다")}</p><small>{tx(locale, notification.time, index === 0 ? "2시간 전" : index === 1 ? "어제" : "3일 전")}</small></div><span className="notification-dot" aria-label={index < 2 ? tx(locale, "Unread", "읽지 않음") : undefined} /></article>)}</div></section></div></main>;
}
