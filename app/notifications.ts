"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase-client";

export type UauNotification = {
  id: string;
  recipientUid: string;
  title: string;
  body: string;
  href?: string;
  type?: string;
  read: boolean;
  createdAt?: Timestamp | null;
  readAt?: Timestamp | null;
};

export function useNotifications(uid?: string | null) {
  const [notifications, setNotifications] = useState<UauNotification[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !db) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("recipientUid", "==", uid),
    );

    return onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setNotifications(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() } as UauNotification))
            .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)),
        );
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );
  }, [uid]);

  const unread = useMemo(() => notifications.filter((item) => !item.read), [notifications]);
  return { notifications, unread, unreadCount: unread.length, loading, error };
}

export async function markNotificationRead(notificationId: string) {
  if (!db) throw new Error("Firebase is not configured.");
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markNotificationsRead(notificationIds: string[]) {
  await Promise.all(notificationIds.map(markNotificationRead));
}

export async function createNotification(input: {
  recipientUid: string;
  title: string;
  body: string;
  href?: string;
  type?: string;
}) {
  if (!db) throw new Error("Firebase is not configured.");
  return addDoc(collection(db, "notifications"), {
    ...input,
    read: false,
    createdAt: serverTimestamp(),
    readAt: null,
  });
}
