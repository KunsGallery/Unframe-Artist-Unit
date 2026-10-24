// Paid U.A.U membership shown as a seal beside the artist's name. Only reviewers
// write `membership` on public_profiles; the free founding number is separate.
// To restyle a tier or add one later, change `sealTiers` only.

export type MembershipTier = "member" | "founding";
// Dates are KST calendar days ("YYYY-MM-DD"), so the client SDK and the REST
// reader see the same value.
export type PaidMembership = { tier: MembershipTier; startedAt?: string; expiresAt?: string };
export type SealVariant = "full" | "letter" | "mini";

export const sealTiers: Record<MembershipTier, { color: string; rings: 1 | 2; en: string; ko: string }> = {
  member: { color: "#1438ee", rings: 1, en: "U.A.U Member", ko: "U.A.U 멤버" },
  founding: { color: "#171817", rings: 2, en: "U.A.U Founding Member", ko: "U.A.U 창립 멤버" },
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const koreaOffsetMs = 9 * 60 * 60 * 1000;

function isTier(value: unknown): value is MembershipTier {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(sealTiers, value);
}

function koreaDay(now: Date) {
  return new Date(now.getTime() + koreaOffsetMs).toISOString().slice(0, 10);
}

export function activeSealTier(membership: unknown, now = new Date()): MembershipTier | null {
  if (!membership || typeof membership !== "object") return null;
  const { tier, startedAt, expiresAt } = membership as Record<string, unknown>;
  if (!isTier(tier)) return null;
  const today = koreaDay(now);
  if (typeof startedAt === "string" && datePattern.test(startedAt) && startedAt > today) return null;
  if (typeof expiresAt === "string" && datePattern.test(expiresAt) && expiresAt < today) return null;
  return tier;
}

// ≥40px shows the four cells, 13–39px a single "U" (founding keeps its ring), ≤12px "U" only.
export function sealVariant(size: number): SealVariant {
  if (size >= 40) return "full";
  return size >= 13 ? "letter" : "mini";
}

export function normalizeMembership(input: { tier: string; startedAt?: string; expiresAt?: string }): PaidMembership | null {
  if (!input.tier) return null;
  if (!isTier(input.tier)) throw new Error("Unknown membership tier.");
  const startedAt = input.startedAt?.trim() || undefined;
  const expiresAt = input.expiresAt?.trim() || undefined;
  for (const value of [startedAt, expiresAt]) if (value && !datePattern.test(value)) throw new Error("Use YYYY-MM-DD dates.");
  if (startedAt && expiresAt && expiresAt < startedAt) throw new Error("The end date is before the start date.");
  return { tier: input.tier, ...(startedAt ? { startedAt } : {}), ...(expiresAt ? { expiresAt } : {}) };
}
