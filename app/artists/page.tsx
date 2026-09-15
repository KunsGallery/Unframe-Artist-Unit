"use client";

import Link from "next/link";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { artists } from "../data";
import { Breadcrumb, DemoNotice, MetaLine, VerifiedMark } from "../components";

export default function ArtistsPage() {
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState("All practices");
  const filtered = useMemo(() => artists.filter(a => `${a.name} ${a.city} ${a.country} ${a.discipline} ${a.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()) && (discipline === "All practices" || a.discipline === discipline)), [query, discipline]);
  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current="Artists" /><div className="page-intro"><MetaLine>THE UNIT / 06 ARTISTS</MetaLine><h1>Artists, in their<br /><em>own rhythm.</em></h1><p>Independent practices connected through UNFRAME, each with their own pace, place, and way of working.</p></div><div className="filter-bar"><label className="search-field"><span className="sr-only">Search artists</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, practice, place…" /><span>⌕</span></label><select value={discipline} onChange={e => setDiscipline(e.target.value)} aria-label="Filter by practice"><option>All practices</option><option>Painting</option><option>Textile / Installation</option><option>Sound</option><option>Sculpture</option><option>Moving image</option><option>Ceramics</option></select><button className="filter-button"><SlidersHorizontal size={15} /> More filters</button></div><p className="result-count">{filtered.length} artists in the demonstration archive</p><div className="artist-directory">{filtered.map((artist, index) => <Link href={`/${artist.slug}`} className="directory-row" key={artist.slug}><span className="artist-index">0{index + 1}</span><span className={`artist-avatar large ${artist.tone}`}>{artist.initials}</span><span className="directory-main"><strong>{artist.name} {artist.verified && <VerifiedMark compact />}</strong><span>{artist.discipline} · {artist.stage}</span></span><span className="directory-location">{artist.city}<small>{artist.country}</small></span><span className="directory-tags">{artist.tags.map(tag => <span key={tag}>{tag}</span>)}</span><ArrowUpRight size={17} /></Link>)}{filtered.length === 0 && <div className="empty-state"><h3>No artist found.</h3><p>Try a different name, place, or practice.</p></div>}</div></div></main>;
}
