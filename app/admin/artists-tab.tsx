"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../auth-provider";
import { db } from "../firebase-client";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

export default function AdminArtistsTab() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!user || !db) { setAllowed(false); return; }
    return onSnapshot(doc(db, "admins", user.uid), (snapshot) => setAllowed(snapshot.exists() && snapshot.data()?.active === true && snapshot.data()?.role === "super_admin"), () => setAllowed(false));
  }, [user]);

  useEffect(() => {
    const findTarget = () => setTarget(document.querySelector<HTMLElement>(".admin-nav"));
    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!target || !allowed) return null;
  return createPortal(<a className="admin-editor-tab" href="/admin/artists"><Users size={16}/>{tx(locale, "Artist profiles", "작가 프로필")}</a>, target);
}
