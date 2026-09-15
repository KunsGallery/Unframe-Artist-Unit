"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "./i18n-provider";
import { tx } from "./i18n-shared";

export function RotatingWord({ words }: { words: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion || words.length < 2) return;
    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % words.length);
    }, 2800);
    return () => window.clearInterval(intervalId);
  }, [reducedMotion, words.length]);

  return <span className="rotating-slot" aria-live="polite">
    {reducedMotion ? <span className="rotating-word">{words[0]}</span> : <AnimatePresence mode="wait">
      <motion.span key={words[activeIndex]} className="rotating-word" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -26 }} transition={{ duration: .45, ease: [0.22, 1, 0.36, 1] }}>{words[activeIndex]}</motion.span>
    </AnimatePresence>}
  </span>;
}

export function ConnectionMarquee({ items }: { items: string[] }) {
  const { locale } = useLanguage();
  const [paused, setPaused] = useState(false);
  const trackItems = [...items, ...items];

  return <section className="marquee-band page-wrap" aria-labelledby="open-threads-heading">
    <div className="marquee-heading">
      <div><span className="meta-line" id="open-threads-heading">{tx(locale, "OPEN THREADS", "열려 있는 실마리")}</span><p>{tx(locale, "People, places, and practices in motion.", "움직이고 있는 사람, 장소, 실천.")}</p></div>
      <button className="marquee-control" type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? tx(locale, "Play", "재생") : tx(locale, "Pause", "일시정지")}</button>
    </div>
    <p className="sr-only">{tx(locale, "Open threads", "열려 있는 실마리")}: {items.join(", ")}</p>
    <div className={paused ? "marquee-viewport is-paused" : "marquee-viewport"} aria-hidden="true">
      <div className="marquee-track">{trackItems.map((item, index) => <span key={`${item}-${index}`}>{item}<b>↗</b></span>)}</div>
    </div>
  </section>;
}

export type FlowCard = {
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  href: string;
  tone: string;
};

export function FlowCards({ cards }: { cards: FlowCard[] }) {
  return <div className="flow-cards">
    {cards.map((card, index) => <motion.section className={`flow-card ${card.tone}`} key={card.eyebrow} initial={{ opacity: 0, y: 42, rotate: index % 2 ? 2.5 : -2.5 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .65, delay: index * .04, ease: [0.22, 1, 0.36, 1] }}>
      <span className="flow-card-number">0{index + 1}</span>
      <div><span className="meta-line">{card.eyebrow}</span><h2>{card.title}</h2><p>{card.body}</p><a className="text-link" href={card.href}>{card.action} <span aria-hidden="true">↗</span></a></div>
    </motion.section>)}
  </div>;
}
