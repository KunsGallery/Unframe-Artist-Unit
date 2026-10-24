// Membership page copy and prices. Prices stay null until they are decided;
// the page then shows "announced soon". Benefits marked ready: false show as
// "coming" so the page never promises a tool that is not built yet.
import type { MembershipTier } from "./membership-seal";

type Copy = { en: string; ko: string };
export type PlanBenefit = Copy & { ready: boolean };
export type Plan = { id: "verified" | MembershipTier; label: Copy; kicker: Copy; price: Copy | null; term: Copy; benefits: PlanBenefit[] };

const c = (en: string, ko: string): Copy => ({ en, ko });
const b = (en: string, ko: string, ready = true): PlanBenefit => ({ en, ko, ready });

// Set NEXT_PUBLIC_IMWEB_MEMBERSHIP_URL to the Imweb "U.A.U membership 1 year" product page.
export const imwebMembershipUrl = process.env.NEXT_PUBLIC_IMWEB_MEMBERSHIP_URL || "";

export const membershipPlans: Plan[] = [
  {
    id: "verified", label: c("Verified artist", "인증 작가"), kicker: c("VERIFIED · FREE", "VERIFIED · 무료"),
    price: c("Free", "₩0"), term: c("Every approved artist", "승인된 작가 모두"),
    benefits: [
      b("Artist page and templates", "작가 페이지와 템플릿"),
      b("U.A.U artist number", "U.A.U 작가 번호"),
      b("Works, CV and exhibition records", "작품·CV·전시 기록"),
      b("Inquiries with email alerts", "문의 받기와 이메일 알림"),
      b("Fair listing order (10:00 · 18:00)", "공정 순서로 목록 노출 (10시·18시)"),
      b("Growth rewards earned by activity", "활동으로 여는 성장 보상"),
    ],
  },
  {
    id: "member", label: c("Member", "멤버"), kicker: c("MEMBER · PAID", "MEMBER · 유료"),
    price: null, term: c("1-year pass", "1년 단위"),
    benefits: [
      b("Member seal beside your name", "이름 옆 멤버 인장"),
      b("Rotating home Member Spotlight", "홈 멤버 스포트라이트 순환 노출"),
      b("Views, inquiries and saves statistics", "조회수·문의·저장 통계", false),
      b("Portfolio PDF export without watermark", "포트폴리오 PDF 내보내기 (워터마크 없음)", false),
      b("Early alerts for curator briefs and open calls", "큐레이터 브리프·오픈콜 우선 알림", false),
    ],
  },
  {
    id: "founding", label: c("Founding member", "창립 멤버"), kicker: c("FOUNDING · FIRST 100", "FOUNDING · 창립 100인"),
    price: null, term: c("First year", "첫해"),
    benefits: [
      b("Every member benefit", "멤버 혜택 전부"),
      b("Ink founding seal, kept while you stay a member", "먹 창립 인장 (멤버십을 유지하는 동안)"),
      b("Considered for the year-end Recap as a founding member", "연말 Recap에 창립 멤버로 수록 검토", false),
    ],
  },
];
