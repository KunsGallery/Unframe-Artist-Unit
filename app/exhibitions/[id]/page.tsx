"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { Breadcrumb, DemoNotice, MetaLine } from "../../components";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";
import { normalizeExhibition, usePublishedArtists, usePublishedGalleries, type ExhibitionRecord } from "../../organizations";

export default function ExhibitionDetailPage() {
  const { locale } = useLanguage();
  const id = useParams<{ id: string }>()?.id;
  const [exhibition, setExhibition] = useState<ExhibitionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { galleries } = usePublishedGalleries();
  const { artists } = usePublishedArtists();
  useEffect(() => {
    if (!db || !id) { setLoading(false); return; }
    return onSnapshot(doc(db, "exhibitions", id), (snapshot) => {
      setExhibition(snapshot.exists() && snapshot.data().published === true ? normalizeExhibition(snapshot.id, snapshot.data()) : null);
      setLoading(false);
    }, () => setLoading(false));
  }, [id]);
  if (loading) return <main className="page-wrap inner-page"><p>{tx(locale, "Opening exhibition…", "전시를 불러오는 중…")}</p></main>;
  if (!exhibition) return <main className="page-wrap inner-page"><p>{tx(locale, "This exhibition is not public.", "이 전시는 공개되어 있지 않습니다.")}</p><Link href="/projects">{tx(locale, "All exhibitions", "모든 전시")}</Link></main>;
  const gallery = galleries.find((item) => item.id === exhibition.galleryId);
  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={exhibition.title} /><Link className="back-link" href="/projects"><ArrowLeft size={15} /> {tx(locale, "Exhibitions", "전시")}</Link><div className="public-record-heading"><MetaLine>EXHIBITION · {exhibition.year}</MetaLine><h1>{exhibition.title}</h1><p>{exhibition.description}</p>{gallery && <Link href={`/galleries/${gallery.id}`} className="text-link">{gallery.name} <ArrowUpRight size={14} /></Link>}</div><section className="public-record-section"><h2>{tx(locale, "Participating artists", "참여 아티스트")}</h2><div className="public-record-list">{exhibition.artistSlugs.map((slug) => { const artist = artists.find((item) => item.slug === slug); return artist ? <Link className="public-record-row" href={`/artist/${slug}`} key={slug}><span>ARTIST</span><div><h2>{artist.artistName || artist.displayName}</h2><p>{artist.practice || ""}</p></div><ArrowUpRight size={18} /></Link> : null; })}</div>{exhibition.artistSlugs.length === 0 && <p>{tx(locale, "Participants will be listed after confirmation.", "참여자가 확인되면 이곳에 표시됩니다.")}</p>}</section></div></main>;
}
