"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { tx, type Locale } from "../i18n-shared";
import { usePublishedArtists, usePublishedExhibitions, usePublishedGalleries } from "../organizations";

type NodeType = "gallery" | "exhibition" | "artist";
type Filter = "all" | NodeType;
type Node = { id: string; type: NodeType; name: string; href: string; x: number; y: number };

export function ConnectionMap({ locale }: { locale: Locale }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { galleries } = usePublishedGalleries();
  const { artists } = usePublishedArtists();
  const { exhibitions, loading, error } = usePublishedExhibitions();

  const { nodes, edges, height } = useMemo(() => {
    const referencedGalleries = galleries.filter((gallery) => exhibitions.some((exhibition) => exhibition.galleryId === gallery.id));
    const referencedArtists = artists.filter((artist) => exhibitions.some((exhibition) => exhibition.artistSlugs.includes(artist.slug)));
    const height = Math.max(380, Math.max(referencedGalleries.length, exhibitions.length, referencedArtists.length) * 105 + 100);
    const place = (count: number, index: number) => (height / (count + 1)) * (index + 1);
    const galleryNodes: Node[] = referencedGalleries.map((gallery, index) => ({ id: `g:${gallery.id}`, type: "gallery", name: gallery.name, href: `/galleries/${gallery.id}`, x: 125, y: place(referencedGalleries.length, index) }));
    const exhibitionNodes: Node[] = exhibitions.map((exhibition, index) => ({ id: `e:${exhibition.id}`, type: "exhibition", name: exhibition.title, href: `/exhibitions/${exhibition.id}`, x: 500, y: place(exhibitions.length, index) }));
    const artistNodes: Node[] = referencedArtists.map((artist, index) => ({ id: `a:${artist.slug}`, type: "artist", name: artist.artistName || artist.displayName, href: `/artist/${artist.slug}`, x: 875, y: place(referencedArtists.length, index) }));
    const edges: Array<[string, string]> = [];
    exhibitions.forEach((exhibition) => {
      if (galleryNodes.some((node) => node.id === `g:${exhibition.galleryId}`)) edges.push([`g:${exhibition.galleryId}`, `e:${exhibition.id}`]);
      exhibition.artistSlugs.forEach((slug) => {
        if (artistNodes.some((node) => node.id === `a:${slug}`)) edges.push([`e:${exhibition.id}`, `a:${slug}`]);
      });
    });
    return { nodes: [...galleryNodes, ...exhibitionNodes, ...artistNodes], edges, height };
  }, [artists, exhibitions, galleries]);

  const shown = filter === "all" ? nodes : nodes.filter((node) => node.type === filter);
  const shownIds = new Set(shown.map((node) => node.id));
  const shownEdges = edges.filter(([from, to]) => shownIds.has(from) && shownIds.has(to));
  if (loading) return <p>{tx(locale, "Opening connections…", "연결 기록을 불러오는 중…")}</p>;
  if (error) return <p role="alert">{tx(locale, "Connections could not be loaded.", "연결 기록을 불러오지 못했습니다.")}</p>;
  if (!edges.length) return <div className="empty-state"><h3>{tx(locale, "No published connections yet.", "아직 공개된 연결이 없습니다.")}</h3><p>{tx(locale, "Connections appear when a gallery publishes an exhibition with participating artists.", "갤러리가 참여 아티스트와 전시를 공개하면 관계가 이곳에 표시됩니다.")}</p><Link className="text-link" href="/projects">{tx(locale, "See exhibitions", "전시 보기")} <ArrowUpRight size={14} /></Link></div>;

  const labels: Array<[Filter, string, string]> = [["all", "All", "전체"], ["gallery", "Galleries", "갤러리"], ["exhibition", "Exhibitions", "전시"], ["artist", "Artists", "아티스트"]];
  return <div className="live-connections"><div className="connection-toolbar"><span>{tx(locale, `${shownEdges.length} visible links`, `보이는 연결 ${shownEdges.length}개`)}</span><div className="connection-filters" role="group" aria-label={tx(locale, "Filter connections", "연결 필터")}>{labels.map(([value, en, ko]) => <button key={value} type="button" className={filter === value ? "is-active" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>{tx(locale, en, ko)}</button>)}</div></div><div className="live-connection-canvas" tabIndex={0} aria-label={tx(locale, "Scrollable relationship diagram", "스크롤 가능한 관계도")}><svg viewBox={`0 0 1000 ${height}`} role="img" aria-label={tx(locale, "Published gallery, exhibition and artist connections", "공개된 갤러리·전시·아티스트 연결")}>
    {shownEdges.map(([from, to]) => { const start = nodes.find((node) => node.id === from); const end = nodes.find((node) => node.id === to); return start && end ? <line key={`${from}:${to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="live-connection-line" /> : null; })}
    {shown.map((node) => <a href={node.href} key={node.id} className={`live-connection-node is-${node.type}`}><circle cx={node.x} cy={node.y} r={node.type === "exhibition" ? 21 : 15} /><text x={node.x} y={node.y - 29} textAnchor="middle">{node.name.length > 21 ? `${node.name.slice(0, 20)}…` : node.name}</text><title>{node.name}</title></a>)}
  </svg></div><div className="live-connection-list"><h3>{tx(locale, "Recorded relationships", "기록된 관계")}</h3>{exhibitions.map((exhibition) => { const gallery = galleries.find((item) => item.id === exhibition.galleryId); return <div key={exhibition.id} className="live-connection-record"><span>{gallery?.name || "u.a.u"} → <Link href={`/exhibitions/${exhibition.id}`}>{exhibition.title}</Link></span><div>{exhibition.artistSlugs.map((slug) => { const artist = artists.find((item) => item.slug === slug); return artist ? <Link href={`/artist/${slug}`} key={slug}>{artist.artistName || artist.displayName}</Link> : null; })}</div></div>; })}</div></div>;
}
