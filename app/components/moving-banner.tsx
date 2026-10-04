"use client";
import { useState } from "react";
import { Asterisk, Pause, Play, ArrowUpRight } from "lucide-react";
import { normalizeMovingBanner, type BannerPlacement, type MovingBannerConfig } from "../moving-banner";
import { tx } from "../i18n-shared";
import "./moving-banner.css";

export function MovingBanner({ value, locale, placement }: { value?: unknown; locale: "ko" | "en"; placement?: BannerPlacement }) {
  const config = normalizeMovingBanner(value);
  const [paused, setPaused] = useState(false);
  const text = (locale === "ko" ? config.textKo : config.textEn).trim();
  const repeats = Math.max(2, Math.ceil(2400 / (text.length * 16 + 52)));
  const seconds = ((text.length * 16 + 52) * repeats) / (config.speed === "slow" ? 28 : config.speed === "fast" ? 65 : 42);
  if (!config.enabled || !text || (placement && config.placement !== placement)) return null;
  return <section className={`moving-banner${paused ? " is-paused" : ""}`} aria-label={tx(locale, "Moving message", "흐르는 문구")}>
    <div className="moving-banner-window"><div className="moving-banner-track" style={{ animationDuration: `${seconds}s`, animationDirection: config.direction === "right" ? "reverse" : "normal" }}>{[0, 1].map((copy) => <div className="moving-banner-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>{Array.from({ length: repeats }, (_, repeat) => <span className="moving-banner-phrase" key={repeat} aria-hidden={copy === 0 && repeat > 0 ? true : undefined}>{text}<Asterisk size={22} aria-hidden="true"/></span>)}</div>)}</div></div>
    {config.href && <a className="moving-banner-action" href={config.href} target={config.href.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" aria-label={tx(locale, "Open message link", "배너 링크 바로가기")}><ArrowUpRight size={20}/></a>}
    <button type="button" className="moving-banner-action" aria-pressed={paused} aria-label={paused ? tx(locale, "Resume moving text", "흐르는 문구 재생") : tx(locale, "Pause moving text", "흐르는 문구 일시정지")} onClick={() => setPaused(!paused)}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button>
  </section>;
}

export function MovingBannerEditor({ value, onChange, locale, listLabel = { ko: "작품 아래", en: "After works" }, disabled = false }: { value?: unknown; onChange: (value: MovingBannerConfig) => void; locale: "ko" | "en"; listLabel?: { ko: string; en: string }; disabled?: boolean }) {
  const config = { ...normalizeMovingBanner(value), href: value && typeof value === "object" && "href" in value && typeof value.href === "string" ? value.href : "" };
  const update = (patch: Partial<MovingBannerConfig>) => onChange({ ...config, ...patch });
  return <fieldset className="moving-banner-editor" disabled={disabled}><legend>{tx(locale, "Moving text", "흐르는 문구")}</legend>
    <label className="moving-banner-check"><input type="checkbox" checked={config.enabled} onChange={(e) => update({ enabled: e.target.checked })}/>{tx(locale, "Show moving banner", "흐르는 배너 표시하기")}</label>
    <p>{tx(locale, "Preview changes here before saving. Blank text is hidden in that language. Placement follows the named section; if it is absent, the banner appears before contact / at the bottom.", "아래 미리보기로 확인한 뒤 페이지 저장 버튼을 눌러주세요. 문구가 비어 있는 언어에서는 숨겨집니다. 선택한 섹션이 없으면 문의 앞 또는 페이지 하단에 표시됩니다.")}</p>
    <label>{tx(locale, "Position", "표시 위치")}<select value={config.placement} onChange={(e) => update({ placement: e.target.value as BannerPlacement })}><option value="hero">{tx(locale, "Below hero", "히어로 아래")}</option><option value="about">{tx(locale, "After introduction", "소개 아래")}</option><option value="works">{tx(locale, listLabel.en, listLabel.ko)}</option><option value="contact">{tx(locale, "Before contact / bottom", "문의 위 / 페이지 하단")}</option></select></label>
    <label>{tx(locale, "Korean message", "한국어 문구")}<textarea maxLength={640} rows={2} value={config.textKo} onChange={(e) => update({ textKo: e.target.value })}/></label>
    <label>{tx(locale, "English message", "영어 문구")}<textarea maxLength={640} rows={2} value={config.textEn} onChange={(e) => update({ textEn: e.target.value })}/></label>
    <label>{tx(locale, "Optional link", "바로가기 링크 (선택)")}<input value={config.href} onChange={(e) => onChange({ ...config, href: e.target.value })} placeholder="https://… 또는 /projects"/><small>{tx(locale, "Use https:// or a site path starting with /. External links open in a new tab.", "https:// 주소 또는 /로 시작하는 사이트 경로를 입력하세요. 외부 링크는 새 창에서 열립니다.")}</small></label>
    <div className="moving-banner-options"><label>{tx(locale, "Speed", "속도")}<select value={config.speed} onChange={(e) => update({ speed: e.target.value as MovingBannerConfig["speed"] })}><option value="slow">{tx(locale, "Slow", "천천히")}</option><option value="normal">{tx(locale, "Normal", "보통")}</option><option value="fast">{tx(locale, "Lively", "활기 있게")}</option></select></label><label>{tx(locale, "Direction", "방향")}<select value={config.direction} onChange={(e) => update({ direction: e.target.value as MovingBannerConfig["direction"] })}><option value="left">{tx(locale, "Left", "왼쪽으로")}</option><option value="right">{tx(locale, "Right", "오른쪽으로")}</option></select></label></div>
    <div className="moving-banner-preview"><span>{tx(locale, "Banner preview", "배너 미리보기")}</span><MovingBanner value={{ ...config, enabled: true }} locale={locale}/>{!(locale === "ko" ? config.textKo : config.textEn).trim() && <p>{tx(locale, "Enter a message to preview.", "문구를 입력하면 미리보기가 나타납니다.")}</p>}</div>
  </fieldset>;
}
