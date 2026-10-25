"use client";

import { useEffect, useState } from "react";
import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Save } from "lucide-react";
import { MetaLine } from "../components";
import { UauSeal } from "../components/uau-seal";
import { db } from "../firebase-client";
import { tx, type Locale } from "../i18n-shared";
import { activeSealTier, normalizeMembership, sealTiers, type PaidMembership } from "../membership-seal";

// Phase 1: an administrator confirms the Imweb order, then turns the seal on here.
export function MembershipPanel({ slug, membership, locale }: { slug: string; membership?: PaidMembership; locale: Locale }) {
  const [form, setForm] = useState({ tier: "", startedAt: "", expiresAt: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({ tier: membership?.tier || "", startedAt: membership?.startedAt || "", expiresAt: membership?.expiresAt || "" });
  }, [membership?.tier, membership?.startedAt, membership?.expiresAt]);

  async function save() {
    if (!db) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const next = normalizeMembership(form);
      await updateDoc(doc(db, "public_profiles", slug), { membership: next ?? deleteField(), membershipUpdatedAt: serverTimestamp() });
      setMessage(next ? tx(locale, "Membership saved.", "멤버십을 저장했습니다.") : tx(locale, "Membership removed.", "멤버십을 해제했습니다."));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : tx(locale, "Membership could not be saved.", "멤버십을 저장하지 못했습니다."));
    } finally { setSaving(false); }
  }

  const preview = form.tier ? { tier: form.tier, startedAt: form.startedAt, expiresAt: form.expiresAt } : null;
  const expired = Boolean(membership) && !activeSealTier(membership);
  return <div className="membership-panel">
    <MetaLine>{tx(locale, "PAID MEMBERSHIP / ADMIN", "유료 멤버십 / 관리자")}</MetaLine>
    <div className="membership-panel-head"><h2>{tx(locale, "Name seal", "이름 옆 인장")}</h2><UauSeal membership={preview} size={40} locale={locale} /></div>
    <p>{tx(locale, "Turn this on after the Imweb payment is confirmed. The founding number is separate and stays as text.", "아임웹 결제를 확인한 뒤 켜 주세요. 창립 번호는 별개이며 글자로만 표시됩니다.")}</p>
    {expired && <p className="form-error">{tx(locale, "This membership has ended, so the seal is hidden.", "기간이 끝나 인장이 숨겨진 상태입니다.")}</p>}
    <label>{tx(locale, "Tier", "등급")}<select value={form.tier} onChange={(event) => setForm({ ...form, tier: event.target.value })}><option value="">{tx(locale, "None", "없음")}</option>{(Object.keys(sealTiers) as Array<keyof typeof sealTiers>).map((tier) => <option value={tier} key={tier}>{tx(locale, sealTiers[tier].en, sealTiers[tier].ko)}</option>)}</select></label>
    <div className="profile-two-up"><label>{tx(locale, "Starts", "시작일")}<input type="date" value={form.startedAt} onChange={(event) => setForm({ ...form, startedAt: event.target.value })} /></label><label>{tx(locale, "Ends (last day)", "종료일 (마지막 날)")}<input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label></div>
    <button className="button button-blue" type="button" onClick={() => void save()} disabled={saving}><Save size={14} /> {saving ? tx(locale, "Saving…", "저장 중…") : tx(locale, "Save membership", "멤버십 저장")}</button>
    {message && <span className="save-confirm" role="status">{message}</span>}
    {error && <span className="form-error" role="alert">{error}</span>}
  </div>;
}
