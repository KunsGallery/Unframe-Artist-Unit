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
import { usePublishedExhibitions, type GalleryRecord } from "../../organizations";

export default function GalleryDetailPage() {
  const { locale } = useLanguage();
  const id = useParams<{ id: string }>()?.id;
  const [gallery, setGallery] = useState<GalleryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { exhibitions } = usePublishedExhibitions();
  useEffect(() => {
    if (!db || !id) { setLoading(false); return; }
    return onSnapshot(doc(db, "galleries", id), (snapshot) => {
      setGallery(snapshot.exists() && snapshot.data().published === true ? ({ id: snapshot.id, ...snapshot.data() } as GalleryRecord) : null);
      setLoading(false);
    }, () => setLoading(false));
  }, [id]);
  if (loading) return <main className="page-wrap inner-page"><p>{tx(locale, "Opening gallery…", "갤러리를 불러오는 중…")}</p></main>;
  if (!gallery) return <main className="page-wrap inner-page"><p>{tx(locale, "This gallery is not public.", "이 갤러리는 공개되어 있지 않습니다.")}</p><Link href="/galleries">{tx(locale, "All galleries", "모든 갤러리")}</Link></main>;
  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={gallery.name} /><Link className="back-link" href="/galleries"><ArrowLeft size={15} /> {tx(locale, "All galleries", "모든 갤러리")}</Link><div className="public-record-heading"><MetaLine>GALLERY · {gallery.city}</MetaLine><h1>{gallery.name}</h1><p>{gallery.description}</p>{gallery.websiteUrl && <a className="text-link" href={gallery.websiteUrl} target="_blank" rel="noopener noreferrer">{tx(locale, "Gallery website", "갤러리 웹사이트")} <ArrowUpRight size={14} /></a>}</div><section className="public-record-section"><h2>{tx(locale, "Exhibitions", "전시")}</h2><div className="public-record-list">{exhibitions.filter((item) => item.galleryId === id).map((item) => <Link className="public-record-row" href={`/exhibitions/${item.id}`} key={item.id}><span>{item.year}</span><div><h2>{item.title}</h2><p>{item.description}</p></div><ArrowUpRight size={18} /></Link>)}</div></section></div></main>;
}
