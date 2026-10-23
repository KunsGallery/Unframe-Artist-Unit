import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getServerLocale } from "./server-locale";
import { tx } from "./i18n-shared";

export const metadata = { title: "U.A.U", robots: { index: false, follow: false } };

export default function NotFound() {
  const locale = getServerLocale();
  return <main className="page-wrap inner-page status-page">
    <span className="status-code">404</span>
    <h1>{tx(locale, "This room isn't here.", "찾으시는 공간이 없습니다.")}</h1>
    <p>{tx(locale, "The page may have moved, or it is no longer public.", "주소가 바뀌었거나 더 이상 공개되지 않는 페이지일 수 있어요.")}</p>
    <div className="status-actions"><Link className="button button-blue" href="/artists">{tx(locale, "Explore artists", "아티스트 둘러보기")} <ArrowUpRight size={16} /></Link><Link className="underlined-link" href="/">{tx(locale, "Back to u.a.u", "u.a.u 홈으로")}</Link></div>
  </main>;
}
