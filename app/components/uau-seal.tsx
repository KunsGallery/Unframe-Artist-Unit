import { activeSealTier, sealTiers, sealVariant } from "../membership-seal";
import { tx, type Locale } from "../i18n-shared";

const paper = "#f4f0e8";
// Hand-cut outline so the seal reads as carved stone rather than a UI box.
const outline = "M3 4.5 L24 3 L45 4 L44.5 24 L45.5 44.5 L24 45 L3.5 44 L4 24 Z";
const glyph = { textAnchor: "middle" as const, fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fill: paper };

function FullCells({ rings }: { rings: 1 | 2 }) {
  if (rings === 1) return <>
    <path d="M6.5 7 L41.5 6.5 L41 41.5 L7 41 Z" fill="none" stroke={paper} strokeWidth=".8" />
    <path d="M24 8v32M8 24h32" stroke={paper} strokeWidth=".8" />
    <text x="15" y="20.5" fontSize="12" {...glyph}>U</text>
    <text x="33" y="20.5" fontSize="12" {...glyph}>A</text>
    <path d="M11 36.5v-6.5h6.5" fill="none" stroke={paper} strokeWidth="2" />
    <rect x="15" y="33" width="3.5" height="3.5" fill={paper} />
    <text x="33" y="37.5" fontSize="12" {...glyph}>U</text>
  </>;
  return <>
    <path d="M6 6.5 L42 6 L41.5 42 L6.5 41.5 Z" fill="none" stroke={paper} strokeWidth=".8" />
    <path d="M8 8.5 L40 8 L39.5 40 L8.5 39.5 Z" fill="none" stroke={paper} strokeWidth=".8" />
    <path d="M24 9v30M9 24h30" stroke={paper} strokeWidth=".8" />
    <text x="15.5" y="20" fontSize="11" {...glyph}>U</text>
    <text x="32.5" y="20" fontSize="11" {...glyph}>A</text>
    <path d="M11.5 35.5v-6h6" fill="none" stroke={paper} strokeWidth="1.8" />
    <rect x="15.3" y="32.3" width="3.2" height="3.2" fill={paper} />
    <text x="32.5" y="36.5" fontSize="11" {...glyph}>U</text>
  </>;
}

export function UauSeal({ membership, size = 18, locale, className }: { membership: unknown; size?: number; locale: Locale; className?: string }) {
  const tier = activeSealTier(membership);
  if (!tier) return null;
  const style = sealTiers[tier];
  const variant = sealVariant(size);
  const startedAt = (membership as { startedAt?: string }).startedAt;
  const name = tx(locale, style.en, style.ko);
  const label = startedAt ? `${name} · ${tx(locale, `since ${startedAt.slice(0, 4)}`, `${startedAt.slice(0, 4)}년부터`)}` : name;
  return <svg className={className ? `uau-seal ${className}` : "uau-seal"} data-tier={tier} role="img" aria-label={label} width={size} height={size} viewBox="0 0 48 48">
    <title>{label}</title>
    <path d={outline} fill={style.color} />
    {variant === "full" && <FullCells rings={style.rings} />}
    {variant === "letter" && style.rings === 2 && <path d="M7 7.5 L41 7 L40.5 41 L7.5 40.5 Z" fill="none" stroke={paper} strokeWidth="2" />}
    {variant === "letter" && <text x="24" y={style.rings === 2 ? 32 : 33} fontSize={style.rings === 2 ? 20 : 24} {...glyph}>U</text>}
    {variant === "mini" && <text x="24" y="34" fontSize="26" {...glyph}>U</text>}
  </svg>;
}
