import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import { UauSeal } from "../components/uau-seal";
import { getServerLocale } from "../server-locale";
import { tx } from "../i18n-shared";
import { imwebMembershipUrl, membershipPlans } from "../membership-plan";
import "./membership.css";

export const metadata: Metadata = {
  title: "Membership",
  description: "U.A.U artist membership: a seal beside your name and a turn in the home Member Spotlight.",
  alternates: { canonical: "/membership" },
};

export default function MembershipPage() {
  const locale = getServerLocale();
  return <main><div className="page-wrap membership-page">
    <header className="membership-intro"><span>{tx(locale, "U.A.U / MEMBERSHIP", "U.A.U / 멤버십")}</span><h1>{tx(locale, <>Free to begin. <em>Exposure and tools</em> for members.</>, <>기본은 무료로, <em>노출과 도구</em>는 멤버에게.</>)}</h1><p>{tx(locale, "Growth rewards you earn by recording your practice stay open to everyone. What you pay for and what you earn are kept apart.", "활동으로 여는 성장 보상(오디오 도슨트, 무빙 커버 등)은 지금처럼 모두에게 열려 있습니다. 돈으로 사는 것과 활동으로 얻는 것을 섞지 않습니다.")}</p></header>
    <section className="membership-plans" aria-label={tx(locale, "Plans", "구성")}>{membershipPlans.map((plan) => <article className={`membership-plan is-${plan.id}`} key={plan.id}>
      <span className="membership-plan-kicker">{tx(locale, plan.kicker.en, plan.kicker.ko)}</span>
      <h2>{tx(locale, plan.label.en, plan.label.ko)}{plan.id !== "verified" && <UauSeal membership={{ tier: plan.id }} size={28} locale={locale} />}</h2>
      <p className="membership-plan-price"><strong>{plan.price ? tx(locale, plan.price.en, plan.price.ko) : tx(locale, "Price announced soon", "가격 안내 예정")}</strong> · {tx(locale, plan.term.en, plan.term.ko)}</p>
      <ul>{plan.benefits.map((benefit) => <li key={benefit.en} className={benefit.ready ? undefined : "is-coming"}><Check size={13} aria-hidden="true" />{tx(locale, benefit.en, benefit.ko)}{!benefit.ready && <small>{tx(locale, "coming", "준비 중")}</small>}</li>)}</ul>
    </article>)}</section>
    <section className="membership-how"><div><span>{tx(locale, "HOW IT WORKS", "이용 방법")}</span><h2>{tx(locale, "A one-year pass, no auto-renewal.", "자동 결제 없는 1년권.")}</h2></div><ol>
      <li>{tx(locale, "Get approved as a U.A.U artist first. Verification is free.", "먼저 U.A.U 인증 작가로 승인을 받으세요. 인증은 무료입니다.")}</li>
      <li>{tx(locale, "Buy the membership pass in the UNFRAME shop. Enter the email you use on U.A.U in the order form.", "UNFRAME 스토어에서 멤버십 1년권을 결제하세요. 주문서에 U.A.U 가입 이메일을 꼭 적어 주세요.")}</li>
      <li>{tx(locale, "Once the payment is confirmed, the team turns on your seal and spotlight. They switch off by themselves when the year ends.", "결제가 확인되면 운영팀이 인장과 스포트라이트를 켭니다. 1년이 지나면 자동으로 꺼집니다.")}</li>
    </ol>
      <div className="membership-actions">{imwebMembershipUrl ? <a className="button button-blue" href={imwebMembershipUrl} target="_blank" rel="noreferrer">{tx(locale, "Buy the membership pass", "멤버십 1년권 결제하기")} <ArrowUpRight size={15} /></a> : <span className="membership-soon">{tx(locale, "The payment page opens soon.", "결제 페이지를 준비하고 있습니다.")}</span>}<Link className="underlined-link" href="/join">{tx(locale, "Not verified yet? Join U.A.U", "아직 인증 전이라면 · U.A.U 참여 안내")}</Link></div>
    </section>
  </div></main>;
}
