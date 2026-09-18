"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

export default function AdminEditorTab() {
  const { locale } = useLanguage();
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findTarget = () => {
      const nextTarget = document.querySelector<HTMLElement>(".admin-nav");
      if (nextTarget) setTarget(nextTarget);
    };
    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!target) return null;
  return createPortal(<a className="admin-editor-tab" href="/admin/editor"><Pencil size={16} /> {tx(locale, "Site editor", "사이트 편집")}</a>, target);
}
