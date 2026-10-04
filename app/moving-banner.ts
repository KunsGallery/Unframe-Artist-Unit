export type BannerPlacement = "hero" | "about" | "works" | "contact";
export type MovingBannerConfig = { enabled: boolean; placement: BannerPlacement; textKo: string; textEn: string; href: string; speed: "slow" | "normal" | "fast"; direction: "left" | "right" };
export const emptyMovingBanner: MovingBannerConfig = { enabled: false, placement: "hero", textKo: "", textEn: "", href: "", speed: "normal", direction: "left" };
export function bannerHref(value: string): string {
  const text = value.trim();
  if (/^\/(?!\/)/.test(text) && !/[\\\s]/.test(text)) return text;
  try { const url = new URL(text); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : ""; } catch { return ""; }
}
export function normalizeMovingBanner(value: unknown): MovingBannerConfig {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { enabled: data.enabled === true, placement: ["hero", "about", "works", "contact"].includes(String(data.placement)) ? data.placement as BannerPlacement : "hero", textKo: typeof data.textKo === "string" ? data.textKo.slice(0, 640) : "", textEn: typeof data.textEn === "string" ? data.textEn.slice(0, 640) : "", href: typeof data.href === "string" ? bannerHref(data.href) : "", speed: data.speed === "slow" || data.speed === "fast" ? data.speed : "normal", direction: data.direction === "right" ? "right" : "left" };
}
