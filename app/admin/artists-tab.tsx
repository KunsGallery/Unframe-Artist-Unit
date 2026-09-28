"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../auth-provider";
import { db } from "../firebase-client";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

export default function AdminArtistsTab() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const [targets, setTargets] = useState<{ nav: HTMLElement | null; top: HTMLElement | null }>({ nav: null, top: null });
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!user || !db) { setAllowed(false); return; }
    return onSnapshot(doc(db, "admins", user.uid), (snapshot) => setAllowed(snapshot.exists() && snapshot.data()?.active === true && snapshot.data()?.role === "super_admin"), () => setAllowed(false));
  }, [user]);

  useEffect(() => {
    const findTarget = () => setTargets({
      nav: document.querySelector<HTMLElement>(".admin-nav"),
      top: document.querySelector<HTMLElement>(".admin-top"),
    });
    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!allowed) return null;
  return <>
    {targets.nav && createPortal(<a className="admin-editor-tab" href="/admin/artists"><Users size={16}/>{tx(locale, "Artist management", "작가 추가·관리")}</a>, targets.nav)}
    {targets.top && createPortal(<a className="button button-blue admin-add-artist-action" href="/admin/artists"><Plus size={16}/>{tx(locale, "Add artist", "아티스트 추가")}</a>, targets.top)}
  </>;
}
