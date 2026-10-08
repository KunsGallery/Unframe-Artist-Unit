"use client";

// Adapted from ThreeUI Community Interface Lines, Copyright (c) 2026 Meng To.
// MIT license and unmodified source: third-party/threeui/.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

type Settings = { speed: number; density: number; opacity: number };
type Props = {
  backgroundColor?: string; lineColor?: string; size?: number; connectionLength?: number;
  animated?: boolean; desktop?: Partial<Settings>; mobile?: Partial<Settings>;
};
const defaults = { speed: .4, density: .5, opacity: .25 };
const mobileDefaults = { speed: .25, density: .3, opacity: .18 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ArtistNetworkBackground({ backgroundColor = "var(--paper)", lineColor = "var(--muted)", size = 1, connectionLength = 1, animated = true, desktop, mobile }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [available, setAvailable] = useState(false);
  const pausedRef = useRef(false);
  const syncRef = useRef<(() => void) | null>(null);
  useEffect(() => { pausedRef.current = paused; syncRef.current?.(); }, [paused]);
  const { locale } = useLanguage();
  const speed = desktop?.speed ?? defaults.speed, density = desktop?.density ?? defaults.density, opacity = desktop?.opacity ?? defaults.opacity;
  const mobileSpeed = mobile?.speed ?? mobileDefaults.speed, mobileDensity = mobile?.density ?? mobileDefaults.density, mobileOpacity = mobile?.opacity ?? mobileDefaults.opacity;

  useEffect(() => {
    const canvas = canvasRef.current, section = canvas?.parentElement?.parentElement;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setAvailable(true);
    const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const smallQuery = matchMedia("(max-width: 640px)");
    let width = 0, height = 0, frame = 0, last = 0, visible = false, elapsed = 0, samples = 0, slow = 0, staticFallback = false;
    let particles: { x: number; y: number; vx: number; vy: number }[] = [];
    let exclusion: { left: number; top: number; right: number; bottom: number }[] = [];
    const settings = () => smallQuery.matches ? { speed: mobileSpeed, density: mobileDensity, opacity: mobileOpacity } : { speed, density, opacity };
    const render = (delta = 0) => {
      ctx.clearRect(0, 0, width, height);
      const s = settings(), length = 120 * clamp(connectionLength, .25, 3);
      ctx.lineWidth = .75 * clamp(size, .35, 2.5);
      ctx.strokeStyle = getComputedStyle(canvas).color;
      ctx.lineCap = "butt";
      for (const p of particles) {
        p.x += p.vx * delta * clamp(s.speed, 0, 3); p.y += p.vy * delta * clamp(s.speed, 0, 3);
        if (p.x < 0 || p.x > width) { p.x = clamp(p.x, 0, width); p.vx *= -1; }
        if (p.y < 0 || p.y > height) { p.y = clamp(p.y, 0, height); p.vy *= -1; }
      }
      // Keep the actual HTML copy clear without a visible overlay panel.
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, width, height);
      for (const r of exclusion) ctx.rect(r.left, r.top, r.right - r.left, r.bottom - r.top);
      ctx.clip("evenodd");
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const p = particles[i], q = particles[j], distance = Math.hypot(p.x - q.x, p.y - q.y);
        if (distance >= length) continue;
        ctx.globalAlpha = (.28 + (1 - distance / length) * .42) * clamp(s.opacity, 0, 1);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      // Interface Lines' original square nodes are omitted: the links stay quiet.
      ctx.restore();
    };
    const shouldRun = () => visible && !document.hidden && animated && !pausedRef.current && !reduceQuery.matches && !staticFallback && settings().speed > 0;
    const tick = (time: number) => {
      frame = 0;
      if (!shouldRun()) return;
      const interval = smallQuery.matches ? 1000 / 24 : 1000 / 30;
      const gap = last ? time - last : 0;
      if (!last || gap >= interval - 1) {
        if (last && smallQuery.matches) { samples++; elapsed += gap; if (gap > 80) slow++; }
        render(last ? Math.min(gap, 80) / (1000 / 60) : 0); last = time;
        if (elapsed > 4000 && samples > 30 && slow / samples > .35) staticFallback = true;
      }
      if (shouldRun()) frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      setReduced(reduceQuery.matches);
      if (shouldRun()) frame = requestAnimationFrame(tick);
    };
    syncRef.current = sync;
    const resize = () => {
      const rect = section.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const oldWidth = width, oldHeight = height;
      width = rect.width; height = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr)); canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((smallQuery.matches ? 30 : 70) * clamp(settings().density, .05, 2));
      particles = Array.from({ length: count }, (_, i) => {
        const p = particles[i];
        return p && oldWidth && oldHeight ? { ...p, x: p.x / oldWidth * width, y: p.y / oldHeight * height } : { x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5 };
      });
      exclusion = Array.from(section.querySelectorAll<HTMLElement>(".intro-title, .intro-copy, .artist-network-toggle")).map((element) => {
        const r = element.getBoundingClientRect();
        return { left: r.left - rect.left - 18, top: r.top - rect.top - 18, right: r.right - rect.left + 18, bottom: r.bottom - rect.top + 18 };
      });
      render(); sync();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    const sizing = new ResizeObserver(resize);
    observer.observe(section); sizing.observe(section);
    section.querySelectorAll(".intro-title, .intro-copy").forEach(element => sizing.observe(element));
    document.addEventListener("visibilitychange", sync);
    reduceQuery.addEventListener("change", sync); smallQuery.addEventListener("change", resize);
    window.addEventListener("resize", resize);
    resize();
    return () => {
      syncRef.current = null;
      cancelAnimationFrame(frame); observer.disconnect(); sizing.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduceQuery.removeEventListener("change", sync); smallQuery.removeEventListener("change", resize);
      window.removeEventListener("resize", resize);
    };
  }, [animated, speed, density, opacity, mobileSpeed, mobileDensity, mobileOpacity, size, connectionLength, lineColor]);

  return <>
    <div className="artist-network-background" aria-hidden="true" style={{ background: backgroundColor, color: lineColor } as CSSProperties}><canvas ref={canvasRef} /></div>
    {available && animated && !reduced && <button type="button" className="artist-network-toggle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}{paused ? tx(locale, "Turn background motion on", "배경 움직임 켜기") : tx(locale, "Turn background motion off", "배경 움직임 끄기")}</button>}
  </>;
}
