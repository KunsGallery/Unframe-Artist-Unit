"use client";

import Link from "next/link";
import { ArrowUpRight, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { artworks } from "../data";
import { ArtImage, BookmarkButton, Breadcrumb, DemoNotice, MetaLine, SectionHeading } from "../components";

export default function WorksPage() {
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("All works");
  const filtered = useMemo(() => artworks.filter(w => `${w.title} ${w.artist} ${w.medium}`.toLowerCase().includes(query.toLowerCase()) && (availability === "All works" || w.status === availability)), [query, availability]);
  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current="Works" /><div className="page-intro split-intro"><div><MetaLine>THE ARCHIVE / {artworks.length.toString().padStart(2, "0")} WORKS</MetaLine><h1>Works to<br /><em>spend time with.</em></h1></div><p>Images, objects, moving images, and the stories that gather around them. Discover by attention, not only by outcome.</p></div><div className="filter-bar"><label className="search-field"><span className="sr-only">Search works</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search works, artists, mediums…" /><span>⌕</span></label><select value={availability} onChange={e => setAvailability(e.target.value)} aria-label="Filter by availability"><option>All works</option><option>Available</option><option>Price on request</option></select><button className="filter-button" onClick={() => setQuery(artworks[Math.floor(Math.random() * artworks.length)].title)}><Shuffle size={15} /> Shuffle u.a.u</button></div><SectionHeading title={`${filtered.length} works`} action="Viewing guide" href="#guide" /><div className="works-grid archive-grid">{filtered.map(work => <Link href={`/works/${work.id}`} className="work-card" key={work.id}><ArtImage className={`work-art ${work.accent}`} position={work.imagePosition} label={work.title} /><div className="work-info"><div><strong>{work.title}</strong><span>{work.artist} · {work.year}</span></div><BookmarkButton label="" /></div><div className="work-meta"><MetaLine>{work.medium}</MetaLine><span className="availability">{work.status}</span></div></Link>)}</div>{filtered.length === 0 && <div className="empty-state"><h3>The archive is quiet here.</h3><p>Try another search or shuffle the unit.</p></div>}</div></main>;
}
