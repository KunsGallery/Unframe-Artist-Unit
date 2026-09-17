"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "./i18n-provider";

type CursorKind = "work" | "artist" | "trace" | "next";

const cursorLabels: Record<CursorKind, { en: string; ko: string }> = {
  work: { en: "VIEW WORK", ko: "작품 보기" },
  artist: { en: "MEET ARTIST", ko: "아티스트 만나기" },
  trace: { en: "TRACE", ko: "따라가기" },
  next: { en: "NEXT", ko: "다음" },
};

export function ContextCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const { locale } = useLanguage();

  useEffect(() => {
    const cursor = cursorRef.current;
    const label = labelRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!cursor || !label || !finePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    let x = -100;
    let y = -100;

    const updateTarget = (target: EventTarget | null) => {
      const element = target instanceof Element
        ? target.closest<HTMLElement>("[data-cursor]")
        : null;
      const kind = element?.dataset.cursor as CursorKind | undefined;
      const copy = kind ? cursorLabels[kind] : undefined;

      cursor.classList.toggle("is-targeted", Boolean(copy));
      label.textContent = copy ? copy[locale] : "";
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;

      x = event.clientX;
      y = event.clientY;
      cursor.classList.add("is-visible");
      updateTarget(event.target);

      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        cursor.style.setProperty("--cursor-x", `${x}px`);
        cursor.style.setProperty("--cursor-y", `${y}px`);
        frame = 0;
      });
    };

    const leave = () => {
      cursor.classList.remove("is-visible", "is-targeted");
      label.textContent = "";
    };

    document.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    window.addEventListener("blur", leave);

    return () => {
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
      window.removeEventListener("blur", leave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [locale]);

  return (
    <div ref={cursorRef} className="context-cursor" aria-hidden="true">
      <span className="context-cursor-ring" />
      <span className="context-cursor-dot" />
      <span ref={labelRef} className="context-cursor-label" />
    </div>
  );
}
