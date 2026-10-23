import { ImageResponse } from "next/og";
import { readPublicDocument } from "../../server/public-firestore";
import { siteUrl } from "../../site-url";

export const alt = "u.a.u artist page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const paper = "#F4F0E8";
const ink = "#171817";
const muted = "#6D6A62";
const blue = "#1438EE";
const maxImageBytes = 6 * 1024 * 1024;

// Satori needs TTF/OTF, and the default font has no Hangul. Google Fonts returns a
// TrueType subset holding only the characters on the card.
async function loadFont(family: string, weight: number, text: string) {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`, { signal: AbortSignal.timeout(4000) }).then((response) => response.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return response.ok ? await response.arrayBuffer() : null;
  } catch { return null; }
}

// Satori decodes PNG and JPEG only; uploads keep their original format beside the WebP variants.
async function loadImage(candidates: unknown[]) {
  for (const candidate of candidates) {
    const url = String(candidate || "");
    if (!/^https:\/\//.test(url)) continue;
    try {
      // Originals can exceed the 2MB data-cache limit; the rendered card is cached instead.
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      const type = response.headers.get("content-type") || "";
      if (!response.ok || !/^image\/(png|jpeg)$/.test(type) || Number(response.headers.get("content-length") || 0) > maxImageBytes) continue;
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > maxImageBytes) continue;
      return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
    } catch { /* Try the next image. */ }
  }
  return null;
}

export default async function ArtistOpenGraphImage({ params }: { params: { slug: string } }) {
  const profile = await readPublicDocument("public_profiles", params.slug);
  const name = String(profile?.artistName || profile?.displayName || "UNFRAME ARTIST UNIT");
  const detail = profile ? [profile.practice, [profile.basedInCity, profile.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ") : "A gallery that stays connected.";
  const works = (profile?.siteWorks as Array<Record<string, unknown>> | undefined) || [];
  const image = profile ? await loadImage([profile.siteCoverImageUrl, ...works.filter((work) => work.title).map((work) => work.imageUrl), profile.profileImageUrl]) : null;
  const host = new URL(siteUrl).host;
  const label = "u.a.u / UNFRAME ARTIST UNIT";
  const footer = profile ? `${host}/artist/${params.slug}` : host;
  const [serif, sans] = await Promise.all([loadFont("Noto+Serif+KR", 600, name), loadFont("Noto+Sans+KR", 500, `${label}${detail}${footer}`)]);
  const fonts = [serif && { name: "Serif", data: serif, weight: 600 as const }, sans && { name: "Sans", data: sans, weight: 500 as const }].filter((font): font is NonNullable<typeof font> => Boolean(font));
  const nameSize = name.length > 22 ? 64 : name.length > 12 ? 84 : 104;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: paper, color: ink }}>
      {image && <div style={{ width: 520, height: "100%", display: "flex", background: "#E8E0D3" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" width={520} height={630} style={{ width: 520, height: 630, objectFit: "cover" }} />
      </div>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", borderLeft: image ? `1px solid ${ink}` : "none" }}>
        <div style={{ display: "flex", fontFamily: "Sans", fontSize: 22, letterSpacing: 3, color: blue }}>{label}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: nameSize, lineHeight: 1.05, letterSpacing: -2 }}>{name}</div>
          {detail && <div style={{ display: "flex", marginTop: 28, fontFamily: "Sans", fontSize: 28, color: muted }}>{detail}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", fontFamily: "Sans", fontSize: 22, color: muted }}>
          <div style={{ width: 56, height: 3, background: blue, marginRight: 20 }} />
          {footer}
        </div>
      </div>
    </div>,
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
