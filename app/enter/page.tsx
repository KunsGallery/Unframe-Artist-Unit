import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DemoNotice, MetaLine } from "../components";
import { entryRoles } from "../entry-data";
import { getServerLocale } from "../server-locale";
import { tx } from "../i18n-shared";

export default function EnterPage() {
  const locale = getServerLocale();
  return <main><DemoNotice /><div className="page-wrap inner-page entry-page"><section className="entry-hero"><MetaLine>{tx(locale, "ENTER THE UNIT / FIND YOUR ROOM", "유닛에 들어오기 / 당신의 공간 찾기")}</MetaLine><h1>{tx(locale, <>There is more than<br /><em>one way in.</em></>, <>들어오는 방법은<br /><em>하나가 아닙니다.</em></>)}</h1><p>{tx(locale, "U.A.U is a living network for people who make, notice, frame, gather, and keep art moving. Choose the door that sounds closest to you.", "U.A.U는 만들고, 바라보고, 맥락을 만들고, 모으고, 예술을 계속 움직이는 사람들을 위한 살아 있는 네트워크입니다. 당신과 가장 가까운 문을 골라보세요.")}</p></section><section className="entry-role-list" aria-label={tx(locale, "Choose an entry point", "진입점 선택")}>{entryRoles.map((role, index) => <Link className="entry-role-row" href={`/enter/${role.value}`} key={role.value}><span className="entry-role-index">0{index + 1}</span><div><MetaLine>{tx(locale, role.eyebrowEn, role.eyebrowKo)}</MetaLine><h2>{tx(locale, role.en, role.ko)}</h2></div><ArrowUpRight size={18} /></Link>)}</section><section className="entry-note"><MetaLine>{tx(locale, "THE FIRST QUESTION", "첫 번째 질문")}</MetaLine><p>{tx(locale, "After you enter, we ask one small thing: what word is closest to you right now? Your answer shapes what we place in front of you.", "들어온 뒤에는 작은 질문 하나를 드립니다. 지금 당신과 가장 가까운 단어는 무엇인가요? 당신의 답이 다음에 놓일 것을 결정합니다.")}</p></section></div></main>;
}
