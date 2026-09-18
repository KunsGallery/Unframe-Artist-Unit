import Link from "next/link";
import { ArrowRight, ArrowUpRight, LockKeyhole } from "lucide-react";
import { DemoNotice, MetaLine } from "../../components";
import { entryContent, entryRoles, type EntryRole } from "../../entry-data";
import { getServerLocale } from "../../server-locale";
import { tx } from "../../i18n-shared";

export default async function EntryRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role: rawRole } = await params;
  const role = (entryRoles.some((item) => item.value === rawRole) ? rawRole : "artist") as EntryRole;
  const locale = getServerLocale();
  const content = entryContent[role];
  const label = entryRoles.find((item) => item.value === role)!;
  const gated = rawRole === "project" || ["curator", "gallery"].includes(role) || ["director", "institution"].includes(rawRole);
  const ctaEn = role === "collector" ? "Start noticing" : role === "artist" ? "Build my page" : "Request access";
  const ctaKo = role === "collector" ? "관심사 시작하기" : role === "artist" ? "내 페이지 만들기" : "접근 권한 신청";
  return <main><DemoNotice /><div className="page-wrap inner-page entry-detail-page"><Link className="back-link" href="/enter">← {tx(locale, "All entry points", "모든 진입점")}</Link><section className="entry-detail-hero"><div><MetaLine>{tx(locale, label.eyebrowEn, label.eyebrowKo)}</MetaLine><h1>{tx(locale, content.titleEn, content.titleKo)}</h1><p>{tx(locale, content.bodyEn, content.bodyKo)}</p><div className="entry-detail-actions"><Link className="button button-blue" href="/login">{tx(locale, ctaEn, ctaKo)} <ArrowRight size={16} /></Link><Link className="text-link" href="/artists">{tx(locale, "Browse the archive first", "먼저 아카이브 둘러보기")} <ArrowUpRight size={14} /></Link></div></div><div className="entry-detail-stamp"><span>{role === "collector" ? "KEEP" : role === "artist" ? "MAKE" : "FRAME"}</span><small>{tx(locale, "Your first room", "당신의 첫 공간")}</small></div></section><section className="entry-feature-list"><MetaLine>{tx(locale, "WHAT OPENS HERE", "여기서 열리는 것")}</MetaLine>{content.featuresEn.map((feature, index) => <div className="entry-feature-row" key={feature}><span>0{index + 1}</span><p>{tx(locale, feature, content.featuresKo[index])}</p></div>)}</section><section className="entry-detail-note"><div>{gated && <LockKeyhole size={16} />}</div><p>{tx(locale, content.noteEn, content.noteKo)}</p></section></div></main>;
}
