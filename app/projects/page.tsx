"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Breadcrumb, DemoNotice, MetaLine, PageSection } from "../components";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { usePublishedExhibitions, usePublishedGalleries } from "../organizations";

export default function ProjectsPage() {
  const { locale } = useLanguage();
  const { exhibitions, loading, error } = usePublishedExhibitions();
  const { galleries } = usePublishedGalleries();

  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={tx(locale, "Exhibitions & projects", "전시와 프로젝트")} />
    <div className="public-record-heading"><MetaLine>U.A.U / ARCHIVE</MetaLine><h1>{tx(locale, "Where practices meet.", "서로 다른 작업이 만나는 곳.")}</h1><p>{tx(locale, "Published exhibitions from the galleries and artists in the unit.", "유닛의 갤러리와 아티스트가 함께한 공개 전시입니다.")}</p></div>
    <PageSection sectionId="list">{error && <p role="alert">{tx(locale, "Exhibitions could not be loaded.", "전시를 불러오지 못했습니다.")}</p>}{loading && <p>{tx(locale, "Opening the archive…", "아카이브를 불러오는 중…")}</p>}<div className="public-record-list">{exhibitions.map((exhibition) => <Link href={`/exhibitions/${exhibition.id}`} className="public-record-row" key={exhibition.id}><span>{exhibition.year}</span><div><h2>{exhibition.title}</h2><p>{galleries.find((item) => item.id === exhibition.galleryId)?.name || "u.a.u"} · {exhibition.artistSlugs.length} {tx(locale, "artists", "명 참여")}</p></div><ArrowUpRight size={18} /></Link>)}</div>{!loading && !error && exhibitions.length === 0 && <div className="empty-state"><h2>{tx(locale, "No public exhibitions yet.", "아직 공개된 전시가 없습니다.")}</h2><p>{tx(locale, "Confirmed exhibitions will appear here as the archive grows.", "확인된 전시가 공개되면 이곳에 표시됩니다.")}</p><Link href="/galleries" className="text-link">{tx(locale, "Explore galleries", "갤러리 둘러보기")}</Link></div>}</PageSection>
  </div></main>;
}
