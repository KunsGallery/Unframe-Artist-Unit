// Membership page copy and prices. Prices are yearly passes with no
// auto-renewal. Benefits marked ready: false show as "coming" so the page
// never promises a tool that is not built yet.
import type { MembershipTier } from "./membership-seal";

type Copy = { en: string; ko: string };
export type PlanId = "verified" | MembershipTier;
export type Plan = { id: PlanId; label: Copy; yearly: number; note: Copy; who: Copy };
// A cell is true (included), false (not included) or a short value such as the seal colour.
export type BenefitRow = Copy & { ready: boolean; cells: Record<PlanId, boolean | Copy> };

const c = (en: string, ko: string): Copy => ({ en, ko });

// Set NEXT_PUBLIC_IMWEB_MEMBERSHIP_URL to the Imweb "U.A.U membership 1 year" product page.
export const imwebMembershipUrl = process.env.NEXT_PUBLIC_IMWEB_MEMBERSHIP_URL || "";
export const foundingSeats = 100;

export const membershipPlans: Plan[] = [
  { id: "verified", label: c("Verified artist", "인증 작가"), yearly: 0, note: c("Free, for every approved artist", "승인된 작가 모두, 무료"), who: c("Your page, records and inquiries.", "작가 페이지와 기록, 문의까지.") },
  { id: "member", label: c("Member", "멤버"), yearly: 59000, note: c("About ₩4,900 a month, a cup of coffee", "한 달 약 4,900원, 커피 한 잔"), who: c("A seal beside your name and a turn on the home page.", "이름 옆 인장과 홈 화면의 차례.") },
  { id: "founding", label: c("Founding member", "창립 멤버"), yearly: 35000, note: c(`First ${foundingSeats} only · about ₩2,900 a month`, `선착순 ${foundingSeats}명 · 한 달 약 2,900원`), who: c("Every member benefit, the ink seal, and this price for as long as you renew.", "멤버 혜택 전부와 먹 인장, 그리고 이어서 갱신하는 동안 이 가격.") },
];

const all = { verified: true, member: true, founding: true };
const paid = { verified: false, member: true, founding: true };

export const benefitRows: BenefitRow[] = [
  { ...c("Artist page and templates", "작가 페이지와 템플릿"), ready: true, cells: all },
  { ...c("U.A.U artist number", "U.A.U 작가 번호"), ready: true, cells: all },
  { ...c("Works, CV and exhibition records", "작품·CV·전시 기록"), ready: true, cells: all },
  { ...c("Inquiries with email alerts", "문의 받기와 이메일 알림"), ready: true, cells: all },
  { ...c("Fair listing order, reshuffled at 10:00 and 18:00", "공정 순서 목록 노출 (10시·18시 교체)"), ready: true, cells: all },
  { ...c("Growth rewards earned by activity", "활동으로 여는 성장 보상"), ready: true, cells: all },
  { ...c("Seal beside your name", "이름 옆 인장"), ready: true, cells: { verified: false, member: c("Blue", "블루"), founding: c("Ink", "먹") } },
  { ...c("Home Member Spotlight", "홈 멤버 스포트라이트"), ready: true, cells: paid },
  { ...c("Views, inquiries and saves statistics", "조회수·문의·저장 통계"), ready: false, cells: paid },
  { ...c("Portfolio PDF without watermark", "워터마크 없는 포트폴리오 PDF"), ready: false, cells: paid },
  { ...c("Early alerts for curator briefs and open calls", "큐레이터 브리프·오픈콜 우선 알림"), ready: false, cells: paid },
  { ...c("Listed as a founding member in the year-end Recap", "연말 Recap 창립 멤버 수록"), ready: false, cells: { verified: false, member: false, founding: true } },
  { ...c("Price kept while you renew without a break", "끊기지 않고 갱신하면 가입 가격 유지"), ready: true, cells: paid },
];

export function formatWon(amount: number, locale: "en" | "ko") {
  if (!amount) return locale === "ko" ? "무료" : "Free";
  return `₩${amount.toLocaleString("en-US")}`;
}
