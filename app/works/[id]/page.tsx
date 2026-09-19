import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react";
import { ArtImage, Breadcrumb, DemoNotice, BookmarkButton, MetaLine } from "../../components";
import { artists, artworks } from "../../data";
import { artworkText, tx } from "../../i18n-shared";
import { getServerLocale } from "../../server-locale";
import { notFound } from "next/navigation";

export default async function WorkDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = getServerLocale();
  const work = artworks.find(w => w.id === id);
  if (!work) notFound();
  const copy = artworkText(locale, work.id)!;
  const artist = artists.find(a => a.slug === work.artistSlug);
  if (!artist) notFound();
  return <main><DemoNotice /><div className="page-wrap inner-page work-detail"><Breadcrumb current={work.title} /><Link className="back-link" href="/works"><ArrowLeft size={15} /> {tx(locale, "All works", "모든 작품")}</Link><section className="work-detail-grid"><div className={`detail-work-art ${work.accent}`}><ArtImage className="detail-work-image" position={work.imagePosition} label={work.title} /></div><div className="work-detail-copy"><MetaLine>{copy.medium} · {work.year}</MetaLine><h1>{work.title}</h1><Link href={`/${artist.slug}`} className="work-artist-link">{artist.name} <ArrowUpRight size={15} /></Link><div className="work-detail-rule" /><div className="work-facts"><div><span>{tx(locale, "Status", "상태")}</span><strong>{copy.status}</strong></div><div><span>{tx(locale, "Dimensions", "규격")}</span><strong>120 × 90 cm</strong></div><div><span>{tx(locale, "Price", "가격")}</span><strong>{locale === "ko" && work.price === "Price on request" ? "가격 문의" : work.price}</strong></div></div><p>{tx(locale, "This work is part of the artist's ongoing research into the distance between an image and the body that remembers it.", "이 작품은 이미지와 그것을 기억하는 몸 사이의 거리를 탐구하는 아티스트의 지속적인 리서치의 일부입니다.")}</p><div className="work-detail-actions"><BookmarkButton label={tx(locale, "Save work", "작품 저장")} /><a className="button button-blue" href={`mailto:hello@uau.unframe.kr?subject=Inquiry about ${work.title}`}><Mail size={15} /> {tx(locale, "Ask about this work", "이 작품 문의하기")}</a></div></div></section><section className="work-detail-footer"><span>{tx(locale, "Part of the u.a.u demonstration archive", "u.a.u 데모 아카이브의 일부")}</span><Link href={`/${artist.slug}`} className="text-link">{tx(locale, "Visit artist profile", "아티스트 프로필 보기")} <ArrowUpRight size={14} /></Link></section></div></main>;
}
