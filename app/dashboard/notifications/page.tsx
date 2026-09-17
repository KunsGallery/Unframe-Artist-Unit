"use client";

import { Bell, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DemoNotice, MetaLine } from "../../components";
import { DashboardSidebar } from "../dashboard-sidebar";
import { useAuth } from "../../auth-provider";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { markNotificationsRead, useNotifications } from "../../notifications";

export default function NotificationsPage() {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { unread, unreadCount, loading, error } = useNotifications(user?.uid);
  const router = useRouter();
  const markedRef = useRef<string>("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!loading && unread.length > 0) {
      const ids = unread.map((item) => item.id);
      const key = ids.join(",");
      if (key !== markedRef.current) {
        markedRef.current = key;
        void markNotificationsRead(ids).catch(() => undefined);
      }
    }
  }, [loading, unread]);

  if (authLoading || !user) {
    return <main className="dashboard-page"><DemoNotice /><div className="auth-guard">{tx(locale, "Checking your account…", "계정을 확인하고 있습니다…")}</div></main>;
  }

  return (
    <main className="dashboard-page">
      <DemoNotice />
      <div className="dashboard-wrap">
        <DashboardSidebar active="notifications" />
        <section className="dashboard-main notifications-main">
          <div className="dashboard-top">
            <div>
              <MetaLine>{tx(locale, "MY U.A.U / NOTIFICATIONS", "MY U.A.U / 알림")}</MetaLine>
              <h1>{tx(locale, <>Stay close to<br /><em>the thread.</em></>, <>실마리에서<br /><em>멀어지지 않기.</em></>)}</h1>
            </div>
            <div className="profile-chip"><Bell size={16} /><span>{unreadCount > 0 ? tx(locale, String(unreadCount) + " new", "새 알림 " + unreadCount + "개") : tx(locale, "All caught up", "모두 확인했습니다")}</span></div>
          </div>
          {error && <div className="notification-error"><p>{tx(locale, "Notifications could not be loaded.", "알림을 불러오지 못했습니다.")}</p><small>{tx(locale, "Check your connection and try again.", "연결 상태를 확인한 뒤 다시 시도해주세요.")}</small></div>}
          {!loading && !error && unread.length === 0 && <div className="notification-empty"><Bell size={22} /><h2>{tx(locale, "You are all caught up.", "모든 알림을 확인했습니다.")}</h2><p>{tx(locale, "New activity around your unit will appear here in real time.", "새로운 유닛 활동이 실시간으로 이곳에 표시됩니다.")}</p></div>}
          {loading && <div className="notification-empty"><RefreshCw className="spin" size={20} /><p>{tx(locale, "Listening for new activity…", "새로운 활동을 기다리는 중…")}</p></div>}
          {unread.length > 0 && <div className="notifications-list">{unread.map((notification) => <article className="notification-row is-unread" key={notification.id}><span className="activity-mark tone-blue"><Bell size={14} /></span><div><strong>{notification.title}</strong><p>{notification.body}</p><small>{notification.type ?? tx(locale, "New activity", "새 활동")}</small></div><span className="notification-dot" aria-label={tx(locale, "Unread", "읽지 않음")} /></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
