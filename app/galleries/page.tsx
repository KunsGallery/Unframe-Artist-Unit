"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Breadcrumb, DemoNotice, MetaLine } from "../components";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { usePublishedGalleries } from "../organizations";

export default function GalleriesPage() {
  const { locale } = useLanguage();
  const { galleries, error, loading } = usePublishedGalleries();

  return <main><DemoNotice /><div className="page-wrap inner-page">
    <Breadcrumb current={tx(locale, "Galleries", "갤러리")} />
    <div className="public-record-heading"><MetaLine>U.A.U / GALLERIES</MetaLine><h1>{tx(locale, "Spaces that keep a relationship open.", "관계를 이어가는 공간들.")}</h1></div>
    {error && <p role="alert">{tx(locale, "Galleries could not be loaded.", "갤러리를 불러오지 못했습니다.")}</p>}
    {loading && <p>{tx(locale, "Opening galleries…", "갤러리를 불러오는 중…")}</p>}
    <div className="public-record-list">{galleries.map((gallery) => <Link href={`/galleries/${gallery.id}`} key={gallery.id} className="public-record-row"><span>{gallery.city || "u.a.u"}</span><div><h2>{gallery.name}</h2><p>{gallery.description}</p></div><ArrowUpRight size={18} /></Link>)}</div>
    {!loading && !error && galleries.length === 0 && <div className="empty-state"><h2>{tx(locale, "No public galleries yet.", "아직 공개된 갤러리가 없습니다.")}</h2><p>{tx(locale, "Confirmed gallery records will appear here.", "확인된 갤러리 기록이 이곳에 표시됩니다.")}</p></div>}
  </div></main>;
}
