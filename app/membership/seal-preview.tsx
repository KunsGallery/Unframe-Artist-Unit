"use client";

import { useState } from "react";
import { UauSeal } from "../components/uau-seal";
import { tx, type Locale } from "../i18n-shared";
import { sealTiers, type MembershipTier } from "../membership-seal";

// Lets an artist type their name and see it with each seal, at the sizes the
// site really uses: the artist page title and the artist list.
export function SealPreview({ locale }: { locale: Locale }) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState<MembershipTier>("member");
  const shown = name.trim() || tx(locale, "Your name", "작가 이름");
  const membership = { tier };
  return <div className="seal-preview" data-tier={tier}>
    <div className="seal-preview-stage">
      <UauSeal membership={membership} size={168} locale={locale} className="seal-preview-big" />
      <div className="seal-preview-uses">
        <p className="seal-preview-title">{shown}<UauSeal membership={membership} size={40} locale={locale} /></p>
        <p className="seal-preview-list">{shown}<UauSeal membership={membership} size={18} locale={locale} /></p>
      </div>
    </div>
    <div className="seal-preview-controls">
      <label><span>{tx(locale, "Try your name", "내 이름으로 보기")}</span><input value={name} maxLength={24} onChange={(event) => setName(event.target.value)} placeholder={tx(locale, "Your name", "작가 이름")} /></label>
      <div className="seal-preview-tiers" role="radiogroup" aria-label={tx(locale, "Seal", "인장")}>
        {(Object.keys(sealTiers) as MembershipTier[]).map((id) => <button key={id} type="button" role="radio" aria-checked={tier === id} className={tier === id ? "is-on" : undefined} onClick={() => setTier(id)}>{tx(locale, id === "member" ? "Member · blue" : "Founding · ink", id === "member" ? "멤버 · 블루" : "창립 멤버 · 먹")}</button>)}
      </div>
    </div>
  </div>;
}
