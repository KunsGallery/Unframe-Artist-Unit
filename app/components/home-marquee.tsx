"use client";

import { useState, type CSSProperties } from "react";
import { Asterisk, Pause, Play } from "lucide-react";
import { SiteCopy, useSiteContent } from "../site-content";
import { useLanguage } from "../i18n-provider";
import { sanitizeRichText } from "../rich-text";
import { tx } from "../i18n-shared";

export function HomeMarquee() {
  const { content } = useSiteContent();
  const { locale } = useLanguage();
  const [paused, setPaused] = useState(false);
  const duration = content["home.marquee.speed"] === "slow" ? 65 : content["home.marquee.speed"] === "fast" ? 28 : 45;
  const reverse = content["home.marquee.direction"] === "right";
  const lines = [1, 2, 3, 4].map((line) => ({ key: `home.marquee.line${line}`, value: String(content[`home.marquee.line${line}.${locale}`] || "") })).filter((line) => line.value.trim());
  if (!lines.length) return null;
  return <section className={`catalogue-marquee${paused ? " is-paused" : ""}`} aria-label={tx(locale, "U.A.U moving manifesto", "U.A.U 흐르는 문구")} style={{ "--marquee-duration": `${duration}s`, "--marquee-direction": reverse ? "reverse" : "normal" } as CSSProperties}>
    <div className="catalogue-marquee-window"><div className="catalogue-marquee-track">
      {[0, 1].map((copy) => <div className="catalogue-marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>{lines.map((line) => <div className="catalogue-marquee-phrase" key={line.key}>{copy === 0 ? <SiteCopy contentKey={line.key} fallback={line.value} /> : <span dangerouslySetInnerHTML={{ __html: sanitizeRichText(line.value) }} />}<Asterisk aria-hidden="true" size={26} /></div>)}</div>)}
    </div></div>
    <button type="button" className="catalogue-marquee-toggle" aria-pressed={paused} aria-label={paused ? tx(locale, "Resume moving text", "흐르는 문구 재생") : tx(locale, "Pause moving text", "흐르는 문구 일시정지")} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
  </section>;
}
