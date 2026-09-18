"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

export function GuideLauncher() {
  const { locale } = useLanguage();
  const [open, setOpen] = useState(false);
  return <div className="guide-launcher-wrap">
    {open && <aside className="guide-launcher-panel" aria-label={tx(locale, "u.a.u guide", "u.a.u 안내") }>
      <button className="guide-launcher-close" type="button" onClick={() => setOpen(false)} aria-label={tx(locale, "Close guide", "안내 닫기")}><X size={15} /></button>
      <span className="guide-launcher-kicker">u.a.u / GUIDE</span>
      <h2>{tx(locale, "Where would you like to go?", "어디로 가볼까요?")}</h2>
      <p>{tx(locale, "The AI guide is coming soon. For now, start with a question or find your way in.", "AI 안내자는 곧 준비됩니다. 지금은 질문을 확인하거나 당신의 방식으로 들어와 보세요.")}</p>
      <div className="guide-launcher-links"><Link href="/#faq" onClick={() => setOpen(false)}>{tx(locale, "Read the FAQ", "FAQ 보기")} <ArrowUpRight size={13} /></Link><Link href="/enter" onClick={() => setOpen(false)}>{tx(locale, "Find your way in", "들어오는 방법 찾기")} <ArrowUpRight size={13} /></Link></div>
    </aside>}
    <button className={open ? "guide-launcher-button is-open" : "guide-launcher-button"} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={tx(locale, "Open u.a.u guide", "u.a.u 안내 열기")}><span aria-hidden="true">?</span></button>
  </div>;
}
