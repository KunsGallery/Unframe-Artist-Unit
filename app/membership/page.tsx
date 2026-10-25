import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Check, Minus } from "lucide-react";
import { UauSeal } from "../components/uau-seal";
import { getServerLocale } from "../server-locale";
import { tx, type Locale } from "../i18n-shared";
import { benefitRows, formatWon, foundingSeats, imwebMembershipUrl, membershipPlans, type BenefitRow, type PlanId } from "../membership-plan";
import { SealPreview } from "./seal-preview";
import "./membership.css";

export const metadata: Metadata = {
  title: "Membership",
  description: "U.A.U artist membership: a one-year pass from ₩35,000. A seal beside your name and a turn in the home Member Spotlight.",
  alternates: { canonical: "/membership" },
};

function BuyAction({ locale }: { locale: Locale }) {
  return imwebMembershipUrl
    ? <a className="button button-blue" href={imwebMembershipUrl} target="_blank" rel="noreferrer">{tx(locale, "Buy the one-year pass", "1년권 결제하기")} <ArrowUpRight size={15} /></a>
    : <span className="membership-soon">{tx(locale, "The payment page opens soon.", "결제 페이지를 준비하고 있습니다.")}</span>;
}

function Cell({ value, locale }: { value: BenefitRow["cells"][PlanId]; locale: Locale }) {
  if (value === true) return <Check size={16} aria-label={tx(locale, "Included", "포함")} />;
  if (value === false) return <Minus size={14} className="is-none" aria-label={tx(locale, "Not included", "없음")} />;
  return <span>{tx(locale, value.en, value.ko)}</span>;
}

export default function MembershipPage() {
  const locale = getServerLocale();
  const faq = [
    [tx(locale, "Will I be charged again automatically?", "자동으로 다시 결제되나요?"), tx(locale, "No. It is a one-year pass. When the year ends the seal switches off by itself, and you decide whether to buy another year.", "아니요. 1년권이라 자동 결제가 없습니다. 1년이 지나면 인장이 저절로 꺼지고, 다음 해를 이어 갈지는 직접 정하시면 됩니다.")],
    [tx(locale, "When does my seal appear?", "인장은 언제 켜지나요?"), tx(locale, "After the UNFRAME team confirms the payment, usually within a working day. Write the email you use on U.A.U in the order form so we can find your page.", "UNFRAME 팀이 결제를 확인한 뒤, 보통 영업일 하루 안에 켜집니다. 페이지를 찾을 수 있도록 주문서에 U.A.U 가입 이메일을 꼭 적어 주세요.")],
    [tx(locale, `What makes the founding ${foundingSeats} different?`, `창립 ${foundingSeats}인은 무엇이 다른가요?`), tx(locale, `They pay ₩35,000 a year instead of ₩59,000, wear the ink seal, and keep both for as long as they renew without a break. After ${foundingSeats} passes, founding closes for good.`, `연 59,000원 대신 35,000원을 내고, 먹 인장을 답니다. 끊기지 않고 갱신하는 동안 가격과 인장이 그대로 유지됩니다. ${foundingSeats}명이 차면 창립 멤버는 다시 열리지 않습니다.`)],
    [tx(locale, "Is this the same as my founding artist number?", "작가 번호의 '창립 작가'와 같은 건가요?"), tx(locale, "No. The founding number is free and given to the first approved artists. The ink seal belongs only to paid founding members.", "다릅니다. 작가 번호의 창립 표시는 먼저 승인된 작가에게 무료로 붙는 기록입니다. 먹 인장은 유료 창립 멤버에게만 붙습니다.")],
    [tx(locale, "Why is it this cheap?", "왜 이렇게 저렴한가요?"), tx(locale, "U.A.U has just begun, so we only charge for what is already built. When statistics and the PDF export open, the price for new members goes up. Members who renew without a break keep the price they joined at.", "U.A.U는 이제 막 시작했고, 지금 드릴 수 있는 만큼만 받습니다. 통계와 PDF 내보내기가 열리면 새로 가입하는 분의 가격은 오릅니다. 끊기지 않고 갱신하는 멤버는 가입할 때의 가격 그대로입니다.")],
    [tx(locale, "What about refunds?", "환불은 어떻게 하나요?"), tx(locale, "Refunds follow the UNFRAME shop policy shown on the order page.", "환불은 결제 페이지에 안내된 UNFRAME 스토어 정책을 따릅니다.")],
  ] as const;

  return <main><div className="page-wrap membership-page">
    <section className="membership-hero">
      <div className="membership-hero-copy">
        <h1>{tx(locale, <>A seal by your name,<br />for a cup of coffee.</>, <>커피 한 잔 값으로,<br />이름 옆에 인장을.</>)}</h1>
        <p>{tx(locale, `U.A.U membership is a one-year pass with no auto-renewal: ₩59,000 a year, or ₩35,000 for the first ${foundingSeats} founding members.`, `U.A.U 멤버십은 자동 결제 없는 1년권입니다. 멤버는 연 59,000원, 창립 멤버 ${foundingSeats}명은 연 35,000원입니다.`)}</p>
        <div className="membership-hero-actions"><BuyAction locale={locale} /><a className="underlined-link" href="#compare">{tx(locale, "Compare plans", "구성 비교")}</a></div>
      </div>
      <SealPreview locale={locale} />
    </section>

    <section className="membership-plans" aria-labelledby="plans-title">
      <h2 id="plans-title">{tx(locale, "Three ways to be here", "세 가지 자리")}</h2>
      <div className="membership-plan-row">{membershipPlans.map((plan) => <article className={`membership-plan is-${plan.id}`} key={plan.id}>
        <h3>{tx(locale, plan.label.en, plan.label.ko)}{plan.id !== "verified" && <UauSeal membership={{ tier: plan.id }} size={30} locale={locale} />}</h3>
        <p className="membership-plan-price"><strong>{formatWon(plan.yearly, locale)}</strong>{plan.yearly > 0 && <span>{tx(locale, " / year", " / 1년")}</span>}</p>
        <p className="membership-plan-note">{tx(locale, plan.note.en, plan.note.ko)}</p>
        <p className="membership-plan-who">{tx(locale, plan.who.en, plan.who.ko)}</p>
      </article>)}</div>
    </section>

    <section className="membership-compare" id="compare" aria-labelledby="compare-title">
      <div className="membership-section-head"><h2 id="compare-title">{tx(locale, "What changes", "무엇이 달라지나요")}</h2><p>{tx(locale, "Rows marked coming are being built. They switch on for members as soon as they open, at no extra cost.", "'준비 중' 표시는 만들고 있는 기능입니다. 열리는 대로 추가 비용 없이 멤버에게 켜집니다.")}</p></div>
      <div className="membership-table-wrap"><table className="membership-table">
        <thead><tr><th scope="col"><span className="sr-only">{tx(locale, "Benefit", "혜택")}</span></th>{membershipPlans.map((plan) => <th scope="col" key={plan.id} className={`is-${plan.id}`}>{tx(locale, plan.label.en, plan.label.ko)}<small>{formatWon(plan.yearly, locale)}</small></th>)}</tr></thead>
        <tbody>{benefitRows.map((row) => <tr key={row.en} className={row.ready ? undefined : "is-coming"}>
          <th scope="row">{tx(locale, row.en, row.ko)}{!row.ready && <em>{tx(locale, "coming", "준비 중")}</em>}</th>
          {membershipPlans.map((plan) => <td key={plan.id} className={`is-${plan.id}`}><Cell value={row.cells[plan.id]} locale={locale} /></td>)}
        </tr>)}</tbody>
      </table></div>
    </section>

    <section className="membership-split" aria-labelledby="split-title">
      <h2 id="split-title">{tx(locale, "What money buys, and what it does not", "돈으로 사는 것과 살 수 없는 것")}</h2>
      <div className="membership-split-cols">
        <div><h3>{tx(locale, "Membership buys", "멤버십으로 사는 것")}</h3><p>{tx(locale, "Exposure and tools: the seal, the spotlight turn, statistics and export.", "노출과 도구입니다. 인장, 스포트라이트 차례, 통계와 내보내기.")}</p></div>
        <div><h3>{tx(locale, "Activity earns", "활동으로만 얻는 것")}</h3><p>{tx(locale, "Growth rewards such as the audio docent and moving cover stay open to every artist who records their practice. They are never for sale.", "오디오 도슨트, 무빙 커버 같은 성장 보상은 활동을 기록하는 모든 작가에게 열려 있습니다. 돈으로 팔지 않습니다.")}</p></div>
        <div><h3>{tx(locale, "Nobody buys", "누구도 살 수 없는 것")}</h3><p>{tx(locale, "Review and approval. Every artist is verified the same way, member or not.", "심사와 승인입니다. 멤버든 아니든 모든 작가는 같은 기준으로 인증됩니다.")}</p></div>
      </div>
    </section>

    <section className="membership-how" aria-labelledby="how-title">
      <h2 id="how-title">{tx(locale, "How to join", "가입 방법")}</h2>
      <ol>
        <li><strong>{tx(locale, "Get verified", "인증 받기")}</strong>{tx(locale, "Apply as a U.A.U artist first. Verification is free.", "먼저 U.A.U 인증 작가로 승인을 받으세요. 인증은 무료입니다.")}</li>
        <li><strong>{tx(locale, "Buy the pass", "1년권 결제")}</strong>{tx(locale, "Buy the one-year pass in the UNFRAME shop and write your U.A.U email in the order form.", "UNFRAME 스토어에서 1년권을 결제하고, 주문서에 U.A.U 가입 이메일을 적어 주세요.")}</li>
        <li><strong>{tx(locale, "Seal on", "인장 켜짐")}</strong>{tx(locale, "The team confirms the payment and turns on your seal and spotlight. A year later they switch off by themselves.", "운영팀이 결제를 확인하고 인장과 스포트라이트를 켭니다. 1년 뒤에는 저절로 꺼집니다.")}</li>
      </ol>
      <div className="membership-actions"><BuyAction locale={locale} /><Link className="underlined-link" href="/join">{tx(locale, "Not verified yet? Join U.A.U", "아직 인증 전이라면 · U.A.U 참여 안내")}</Link></div>
    </section>

    <section className="membership-faq" aria-labelledby="faq-title">
      <h2 id="faq-title">{tx(locale, "Questions", "자주 묻는 질문")}</h2>
      <div>{faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    </section>
  </div></main>;
}
