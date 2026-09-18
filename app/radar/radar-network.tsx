"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Focus, Minus, Pause, Play, Plus, Search, X } from "lucide-react";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

type NodeType = "hub" | "artist" | "project" | "gallery" | "curator";
type RadarNode = {
  id: string;
  name: string;
  nameKo: string;
  sub: string;
  subKo: string;
  type: NodeType;
  x: number;
  y: number;
  description: string;
  descriptionKo: string;
  links: string[];
};

const nodes: RadarNode[] = [
  { id: "uau", name: "u.a.u", nameKo: "u.a.u", sub: "artist unit", subKo: "아티스트 유닛", type: "hub", x: 0.5, y: 0.49, description: "A living map of practices, projects, and the people who keep them moving.", descriptionKo: "실천과 프로젝트, 그리고 그것을 계속 움직이는 사람들의 살아 있는 지도입니다.", links: ["salon", "glasshouse", "seo", "mina"] },
  { id: "salon", name: "UNFRAME Salon 04", nameKo: "UNFRAME 살롱 04", sub: "project / Seoul", subKo: "프로젝트 / 서울", type: "project", x: 0.25, y: 0.27, description: "A room where painting, textile, and sound stayed in conversation.", descriptionKo: "회화와 텍스타일, 사운드가 대화를 이어간 방입니다.", links: ["uau", "seo", "han"] },
  { id: "glasshouse", name: "Glasshouse Gallery", nameKo: "Glasshouse Gallery", sub: "gallery / Berlin", subKo: "갤러리 / 베를린", type: "gallery", x: 0.78, y: 0.25, description: "A gallery looking for artists whose practices leave a trace after the show.", descriptionKo: "전시가 끝난 뒤에도 흔적을 남기는 실천을 찾는 갤러리입니다.", links: ["uau", "mina", "yoon"] },
  { id: "seo", name: "Seo Yujin", nameKo: "서유진", sub: "artist / mixed media", subKo: "아티스트 / 혼합 매체", type: "artist", x: 0.18, y: 0.64, description: "Works between residue, distance, and the material memory of a room.", descriptionKo: "잔여와 거리, 방이 가진 물질적 기억 사이를 작업합니다.", links: ["uau", "salon", "jun"] },
  { id: "mina", name: "Mina Choi", nameKo: "최미나", sub: "curator / Seoul", subKo: "큐레이터 / 서울", type: "curator", x: 0.72, y: 0.65, description: "Builds exhibitions from the questions that remain unresolved.", descriptionKo: "해결되지 않은 질문에서 전시를 만들어갑니다.", links: ["uau", "glasshouse", "after"] },
  { id: "han", name: "Han Mira", nameKo: "한미라", sub: "artist / textile", subKo: "아티스트 / 텍스타일", type: "artist", x: 0.37, y: 0.14, description: "A textile practice attentive to touch, repetition, and shared time.", descriptionKo: "촉감과 반복, 함께 보내는 시간에 주목하는 텍스타일 작업을 합니다.", links: ["salon", "after"] },
  { id: "yoon", name: "Yoon Doyun", nameKo: "윤도윤", sub: "artist / sound", subKo: "아티스트 / 사운드", type: "artist", x: 0.9, y: 0.49, description: "Turns listening into a way of finding one another.", descriptionKo: "듣는 일을 서로를 발견하는 방식으로 바꿉니다.", links: ["glasshouse", "after"] },
  { id: "jun", name: "Jun Lee", nameKo: "이준", sub: "collector / Seoul", subKo: "컬렉터 / 서울", type: "gallery", x: 0.11, y: 0.34, description: "Collects works that open a longer conversation at home.", descriptionKo: "집에서 더 긴 대화를 열어주는 작품을 수집합니다.", links: ["seo"] },
  { id: "after", name: "After the Salon", nameKo: "After the Salon", sub: "project / ongoing", subKo: "프로젝트 / 진행 중", type: "project", x: 0.55, y: 0.84, description: "The next meeting is already taking shape between the first one and the next.", descriptionKo: "첫 만남과 다음 만남 사이에서 다음 장면이 만들어지고 있습니다.", links: ["mina", "han", "yoon"] },
];

const edges = nodes.flatMap((node) => node.links.map((target) => [node.id, target] as const)).filter(([a, b], index, all) => all.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a)) === index);

export function RadarNetwork() {
  const { locale } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const panRef = useRef({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef<{ id?: string; x: number; y: number; pan: boolean }>({ x: 0, y: 0, pan: false });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | NodeType>("all");
  const [selectedId, setSelectedId] = useState("uau");
  const [pulse, setPulse] = useState(true);
  const [, redraw] = useState(0);

  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const visible = useMemo(() => nodes.filter((node) => {
    const text = `${node.name} ${node.nameKo} ${node.sub} ${node.subKo}`.toLowerCase();
    return (filter === "all" || node.type === filter) && (!query || text.includes(query.toLowerCase()));
  }), [filter, query]);
  const visibleIds = useMemo(() => new Set(visible.map((node) => node.id)), [visible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const resize = () => {
      const rect = viewport.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = (time = 0) => {
      const rect = viewport.getBoundingClientRect();
      const { x: panX, y: panY, zoom } = panRef.current;
      context.clearRect(0, 0, rect.width, rect.height);
      context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--paper-deep").trim() || "#eee8dc";
      context.fillRect(0, 0, rect.width, rect.height);
      context.save();
      context.translate(rect.width / 2 + panX, rect.height / 2 + panY);
      context.scale(zoom, zoom);
      const scale = Math.min(rect.width, rect.height) * 0.88;
      const point = (node: RadarNode) => ({ x: (node.x - 0.5) * scale, y: (node.y - 0.5) * scale });
      context.strokeStyle = "rgba(24,24,24,.08)";
      context.lineWidth = 1 / zoom;
      [0.27, 0.48, 0.7].forEach((ring) => { context.beginPath(); context.arc(0, 0, scale * ring, 0, Math.PI * 2); context.stroke(); });
      edges.forEach(([a, b]) => {
        const source = nodes.find((node) => node.id === a)!;
        const target = nodes.find((node) => node.id === b)!;
        const focus = selectedId === a || selectedId === b;
        context.beginPath(); context.moveTo(point(source).x, point(source).y); context.lineTo(point(target).x, point(target).y);
        context.strokeStyle = focus ? "rgba(31,65,232,.68)" : "rgba(24,24,24,.18)";
        context.lineWidth = (focus ? 2 : 1) / zoom; context.stroke();
        if (pulse && focus) { const progress = ((time / 2200) + (a.length + b.length) / 10) % 1; const p = point(source); const q = point(target); context.beginPath(); context.arc(p.x + (q.x - p.x) * progress, p.y + (q.y - p.y) * progress, 3 / zoom, 0, Math.PI * 2); context.fillStyle = "#1f41e8"; context.fill(); }
      });
      nodes.forEach((node) => {
        if (!visibleIds.has(node.id)) return;
        const p = point(node); const active = node.id === selectedId; const neighbor = selected.links.includes(node.id) || node.links.includes(selectedId);
        const radius = node.type === "hub" ? 31 : active ? 22 : 15;
        context.beginPath(); context.arc(p.x, p.y, radius, 0, Math.PI * 2);
        context.fillStyle = node.type === "hub" ? "#1f41e8" : active ? "#1f41e8" : neighbor ? "#c5d0ff" : "#fffaf1"; context.fill();
        context.strokeStyle = node.type === "hub" || active ? "#1f41e8" : "rgba(24,24,24,.35)"; context.lineWidth = 1 / zoom; context.stroke();
        context.fillStyle = node.type === "hub" || active ? "#fff" : "#181818"; context.font = `${node.type === "hub" ? 13 : 10}px Arial`; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(locale === "ko" ? node.nameKo : node.name, p.x, p.y);
        context.font = "9px Arial"; context.fillStyle = "rgba(24,24,24,.6)"; context.textBaseline = "top"; context.fillText(locale === "ko" ? node.subKo : node.sub, p.x, p.y + radius + 7);
      });
      context.restore();
      frameRef.current = requestAnimationFrame(draw);
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(viewport);
    frameRef.current = requestAnimationFrame(draw);
    return () => { observer.disconnect(); if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [locale, selected, selectedId, visibleIds, pulse]);

  function localPoint(event: ReactPointerEvent) { const rect = viewportRef.current!.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
  function hitNode(point: { x: number; y: number }) { const rect = viewportRef.current!.getBoundingClientRect(); const { x: panX, y: panY, zoom } = panRef.current; const scale = Math.min(rect.width, rect.height) * 0.88; return nodes.find((node) => { if (!visibleIds.has(node.id)) return false; const x = rect.width / 2 + panX + (node.x - .5) * scale * zoom; const y = rect.height / 2 + panY + (node.y - .5) * scale * zoom; return Math.hypot(point.x - x, point.y - y) < (node.type === "hub" ? 39 : 27); }); }
  function onPointerDown(event: ReactPointerEvent) { const point = localPoint(event); const node = hitNode(point); dragRef.current = { id: node?.id, x: event.clientX, y: event.clientY, pan: !node }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); if (node) setSelectedId(node.id); }
  function onPointerMove(event: ReactPointerEvent) { if (!dragRef.current.pan) return; panRef.current.x += event.clientX - dragRef.current.x; panRef.current.y += event.clientY - dragRef.current.y; dragRef.current.x = event.clientX; dragRef.current.y = event.clientY; redraw((value) => value + 1); }
  function zoomBy(value: number) { panRef.current.zoom = Math.min(1.7, Math.max(.65, panRef.current.zoom + value)); redraw((n) => n + 1); }
  function recenter() { panRef.current = { x: 0, y: 0, zoom: 1 }; redraw((n) => n + 1); }

  return <section className="radar-network-shell" aria-labelledby="radar-network-title">
    <div className="radar-network-head"><div><span className="radar-network-kicker">{tx(locale, "U.A.U / LIVING NETWORK", "U.A.U / 살아 있는 관계망")}</span><h2 id="radar-network-title" className="site-copy-preline">{tx(locale, "Follow the\nthread.", "실마리를\n따라가세요.")}</h2></div><p>{tx(locale, "A visual field of artists, projects, and rooms connected through the unit. Start at the centre, then let the next name pull you in.", "유닛을 통해 연결된 아티스트와 프로젝트, 공간의 필드입니다. 중심에서 시작해 다음 이름이 끌어당기는 방향으로 움직여보세요.")}</p></div>
    <div className="radar-network-toolbar"><label className="radar-network-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx(locale, "Search a name or thread", "이름 또는 연결 검색")} /></label><div className="radar-network-tabs">{(["all", "artist", "project", "gallery", "curator"] as const).map((item) => <button className={filter === item ? "active" : ""} key={item} type="button" onClick={() => setFilter(item)}>{item === "all" ? tx(locale, "All", "전체") : item === "artist" ? tx(locale, "Artists", "아티스트") : item === "project" ? tx(locale, "Projects", "프로젝트") : item === "gallery" ? tx(locale, "Rooms", "공간") : tx(locale, "Curators", "큐레이터")}</button>)}</div><button className="radar-network-pulse" type="button" onClick={() => setPulse((value) => !value)}>{pulse ? <Pause size={14} /> : <Play size={14} />} {tx(locale, "Pulse", "펄스")}</button></div>
    <div className="radar-network-stage"><div className="radar-network-canvas-wrap" ref={viewportRef}><canvas className="radar-network-canvas" ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { dragRef.current.pan = false; }} onWheel={(event) => { event.preventDefault(); zoomBy(event.deltaY > 0 ? -.06 : .06); }} aria-label={tx(locale, "Interactive relationship network", "인터랙티브 관계 네트워크")} /><div className="radar-network-controls"><button type="button" onClick={() => zoomBy(.1)} aria-label={tx(locale, "Zoom in", "확대")}><Plus size={15} /></button><button type="button" onClick={() => zoomBy(-.1)} aria-label={tx(locale, "Zoom out", "축소")}><Minus size={15} /></button><button type="button" onClick={recenter} aria-label={tx(locale, "Recenter", "중앙으로")}><Focus size={15} /></button></div></div><aside className="radar-network-inspector">{selected && <><button className="radar-network-close" type="button" onClick={() => setSelectedId("uau")} aria-label={tx(locale, "Close details", "상세 닫기")}><X size={15} /></button><span className={`radar-network-type type-${selected.type}`}>{selected.type}</span><h3>{locale === "ko" ? selected.nameKo : selected.name}</h3><p className="radar-network-sub">{locale === "ko" ? selected.subKo : selected.sub}</p><p>{locale === "ko" ? selected.descriptionKo : selected.description}</p><div className="radar-network-connections"><span>{tx(locale, "Connected threads", "연결된 실마리")}</span>{selected.links.map((id) => { const linked = nodes.find((node) => node.id === id)!; return <button type="button" key={id} onClick={() => setSelectedId(id)}>{locale === "ko" ? linked.nameKo : linked.name} <span>↗</span></button>; })}</div></>}</aside></div>
    <div className="radar-network-mobile-list">{visible.map((node) => <button type="button" key={node.id} onClick={() => setSelectedId(node.id)}><span>{locale === "ko" ? node.nameKo : node.name}</span><small>{locale === "ko" ? node.subKo : node.sub}</small></button>)}</div>
  </section>;
}
