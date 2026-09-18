"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { tx, type Locale } from "../i18n-shared";

type NodeType = "artist" | "project" | "exhibition";
type Filter = "all" | NodeType;

type ConnectionNode = {
  id: string;
  type: NodeType;
  name: string;
  detail: string;
  href: string;
  initials?: string;
  tone: string;
  className: string;
};

const nodes: ConnectionNode[] = [
  { id: "seo", type: "artist", name: "Seo Yujin", detail: "Painter · Seoul", href: "/seo-yujin", initials: "SY", tone: "tone-blue", className: "node-seo" },
  { id: "han", type: "artist", name: "Han Mira", detail: "Textile · Berlin", href: "/han-mira", initials: "HM", tone: "tone-ink", className: "node-han" },
  { id: "yoon", type: "artist", name: "Yoon Doyun", detail: "Sound · Busan", href: "/yoon-doyun", initials: "YD", tone: "tone-clay", className: "node-yoon" },
  { id: "salon", type: "exhibition", name: "UNFRAME Salon 04", detail: "Exhibition · Seoul", href: "/projects/after-the-salon", tone: "tone-blue", className: "node-salon" },
  { id: "maria", type: "artist", name: "Maria Novak", detail: "Sculptor · Prague", href: "/maria-novak", initials: "MN", tone: "tone-sand", className: "node-maria" },
];

const edges = [
  ["seo", "han"],
  ["seo", "salon"],
  ["han", "salon"],
  ["yoon", "salon"],
  ["maria", "salon"],
] as const;

function edgePath(from: string, to: string) {
  const paths: Record<string, string> = {
    "seo-han": "M220 100 C360 110 420 220 500 250",
    "seo-salon": "M220 100 C360 180 350 340 500 250",
    "han-salon": "M500 250 C610 170 650 110 790 112",
    "yoon-salon": "M500 250 C600 280 650 360 790 405",
    "maria-salon": "M220 100 C360 110 420 220 500 250 S650 400 790 405",
  };
  return paths[`${from}-${to}`] || paths[`${to}-${from}`] || "";
}

export function ConnectionMap({ locale }: { locale: Locale }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visibleNodes = useMemo(() => nodes.filter((node) => filter === "all" || node.type === filter || node.id === "salon"), [filter]);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges.filter(([from, to]) => visibleIds.has(from) && visibleIds.has(to));
  const filterLabels: Array<[Filter, string, string]> = [
    ["all", "All threads", "모든 실마리"],
    ["artist", "Artists", "아티스트"],
    ["exhibition", "Exhibitions", "전시"],
  ];

  return <>
    <div className="connection-toolbar"><span><i className="legend-dot" /> {tx(locale, `${visibleEdges.length} visible connections`, `보이는 연결 ${visibleEdges.length}개`)}</span><div className="connection-filters" role="group" aria-label={tx(locale, "Filter connections", "연결 필터")}>
      {filterLabels.map(([value, english, korean]) => <button type="button" className={filter === value ? "is-active" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)} key={value}>{tx(locale, english, korean)}</button>)}
    </div></div>
    <div className="connection-map" aria-label={tx(locale, "Interactive connection map", "인터랙티브 연결 지도")}><svg viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">{visibleEdges.map(([from, to]) => <path d={edgePath(from, to)} key={`${from}-${to}`} />)}</svg>{visibleNodes.map((node) => <Link className={`map-node ${node.className}`} href={node.href} key={node.id}>{node.initials ? <span className={`node-circle ${node.tone}`}>{node.initials}</span> : <span className="node-square">04</span>}<strong>{node.name}</strong><small>{tx(locale, node.detail, node.detail === "Painter · Seoul" ? "회화 · 서울" : node.detail === "Textile · Berlin" ? "텍스타일 · 베를린" : node.detail === "Sound · Busan" ? "사운드 · 부산" : node.detail === "Sculptor · Prague" ? "조각 · 프라하" : "전시 · 서울")}</small><ArrowUpRight className="map-node-arrow" size={13} /></Link>)}</div>
    <div className="connection-legend"><div><strong>{tx(locale, "Relationship types", "관계 유형")}</strong><span>{tx(locale, "Exhibited with", "함께 전시")}</span><span>{tx(locale, "Collaborated with", "함께 협업")}</span><span>{tx(locale, "Connected through", "연결 경로")}</span></div><div><strong>{tx(locale, "About the map", "이 지도에 대하여")}</strong><p>{tx(locale, "The map grows as relationships are added — between artists, exhibitions, projects, and the conversations around them.", "아티스트와 전시, 프로젝트, 그리고 그 주변의 대화 사이에 관계가 더해질수록 지도는 자랍니다.")}</p></div></div>
  </>;
}
