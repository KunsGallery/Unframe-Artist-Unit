"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { db } from "./firebase-client";
import { getSitePageId, type SitePageId } from "./site-pages";

export const fontPresets = {
  uau: { label: "u.a.u editorial", heading: '"Baskerville", "Iowan Old Style", "Times New Roman", serif', body: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  classic: { label: "Classic serif", heading: 'Georgia, "Times New Roman", serif', body: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  modern: { label: "Modern sans", heading: '"Helvetica Neue", Helvetica, Arial, sans-serif', body: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  grotesk: { label: "Grotesk + serif", heading: '"Arial Narrow", "Helvetica Neue", Helvetica, Arial, sans-serif', body: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  noto: {
    label: "Noto editorial · KR/EN",
    heading: '"Noto Serif KR", "Iowan Old Style", serif',
    body: '"Noto Sans KR", "Helvetica Neue", Arial, sans-serif',
    cssUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@400;500;600;700&display=swap",
  },
  editorial: {
    label: "Cormorant + Manrope · KR/EN",
    heading: '"Cormorant Garamond", "Noto Serif KR", serif',
    body: '"Manrope", "Noto Sans KR", sans-serif',
    cssUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Manrope:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@400;500;600;700&display=swap",
  },
  neutral: {
    label: "Noto sans · clear",
    heading: '"Noto Sans KR", "Helvetica Neue", Arial, sans-serif',
    body: '"Noto Sans KR", "Helvetica Neue", Arial, sans-serif',
    cssUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap",
  },
} as const;

export type FontPreset = keyof typeof fontPresets;

export type SiteSettings = {
  displayScale: number;
  bodyScale: number;
  contentWidth: number;
  sectionSpace: number;
  headingLeading: number;
  heroHeight: number;
  heroGap: number;
  heroCopyScale: number;
  bodyLeading: number;
  gridGap: number;
  radius: number;
  imageSaturation: number;
  fontPreset: FontPreset;
  fontScale: number;
  headingWeight: number;
  letterSpacing: number;
  headingFontUrl: string;
  bodyFontUrl: string;
  imageOverrides: Record<string, string>;
};

export const defaultSiteSettings: SiteSettings = {
  displayScale: 1,
  bodyScale: 1,
  contentWidth: 1280,
  sectionSpace: 1,
  headingLeading: 0.84,
  heroHeight: 690,
  heroGap: 100,
  heroCopyScale: 1,
  bodyLeading: 1.45,
  gridGap: 22,
  radius: 0,
  imageSaturation: 0.9,
  fontPreset: "uau",
  fontScale: 1,
  headingWeight: 400,
  letterSpacing: -0.045,
  headingFontUrl: "",
  bodyFontUrl: "",
  imageOverrides: {},
};

const SiteSettingsContext = createContext<{ settings: SiteSettings; loading: boolean }>({ settings: defaultSiteSettings, loading: true });

function normalizeSettings(data?: DocumentData): SiteSettings {
  return {
    displayScale: typeof data?.displayScale === "number" ? data.displayScale : defaultSiteSettings.displayScale,
    bodyScale: typeof data?.bodyScale === "number" ? data.bodyScale : defaultSiteSettings.bodyScale,
    contentWidth: typeof data?.contentWidth === "number" ? data.contentWidth : defaultSiteSettings.contentWidth,
    sectionSpace: typeof data?.sectionSpace === "number" ? data.sectionSpace : defaultSiteSettings.sectionSpace,
    headingLeading: typeof data?.headingLeading === "number" ? data.headingLeading : defaultSiteSettings.headingLeading,
    heroHeight: typeof data?.heroHeight === "number" ? data.heroHeight : defaultSiteSettings.heroHeight,
    heroGap: typeof data?.heroGap === "number" ? data.heroGap : defaultSiteSettings.heroGap,
    heroCopyScale: typeof data?.heroCopyScale === "number" ? data.heroCopyScale : defaultSiteSettings.heroCopyScale,
    bodyLeading: typeof data?.bodyLeading === "number" ? data.bodyLeading : defaultSiteSettings.bodyLeading,
    gridGap: typeof data?.gridGap === "number" ? data.gridGap : defaultSiteSettings.gridGap,
    radius: typeof data?.radius === "number" ? data.radius : defaultSiteSettings.radius,
    imageSaturation: typeof data?.imageSaturation === "number" ? data.imageSaturation : defaultSiteSettings.imageSaturation,
    fontPreset: typeof data?.fontPreset === "string" && data.fontPreset in fontPresets ? data.fontPreset as FontPreset : defaultSiteSettings.fontPreset,
    fontScale: typeof data?.fontScale === "number" ? data.fontScale : defaultSiteSettings.fontScale,
    headingWeight: typeof data?.headingWeight === "number" ? data.headingWeight : defaultSiteSettings.headingWeight,
    letterSpacing: typeof data?.letterSpacing === "number" ? data.letterSpacing : defaultSiteSettings.letterSpacing,
    headingFontUrl: typeof data?.headingFontUrl === "string" ? data.headingFontUrl : defaultSiteSettings.headingFontUrl,
    bodyFontUrl: typeof data?.bodyFontUrl === "string" ? data.bodyFontUrl : defaultSiteSettings.bodyFontUrl,
    imageOverrides: data?.imageOverrides && typeof data.imageOverrides === "object"
      ? Object.entries(data.imageOverrides).reduce<Record<string, string>>((result, [key, value]) => {
        if (typeof value === "string" && value.startsWith("https://")) result[key] = value;
        return result;
      }, {})
      : defaultSiteSettings.imageOverrides,
  };
}

export const normalizeSiteSettings = normalizeSettings;

function isAllowedFontUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost");
  } catch {
    return false;
  }
}

function isAllowedStylesheetUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost");
  } catch {
    return false;
  }
}

function fontFormatForUrl(value: string) {
  try {
    const extension = new URL(value).pathname.split(".").pop()?.toLowerCase();
    if (extension === "woff2") return "woff2";
    if (extension === "woff") return "woff";
    if (extension === "ttf") return "truetype";
    if (extension === "otf") return "opentype";
  } catch {
    // The URL has already been validated by isAllowedFontUrl.
  }
  return "woff2";
}

export function applySiteSettings(settings: SiteSettings) {
  const root = document.documentElement;
  root.style.setProperty("--site-display-scale", String(settings.displayScale));
  root.style.setProperty("--site-body-scale", String(settings.bodyScale));
  root.style.setProperty("--site-content-width", `${settings.contentWidth}px`);
  root.style.setProperty("--site-section-space", String(settings.sectionSpace));
  root.style.setProperty("--site-heading-leading", String(settings.headingLeading));
  root.style.setProperty("--site-hero-height", `${settings.heroHeight}px`);
  root.style.setProperty("--site-hero-gap", `${settings.heroGap}px`);
  root.style.setProperty("--site-hero-copy-scale", String(settings.heroCopyScale));
  root.style.setProperty("--site-body-leading", String(settings.bodyLeading));
  root.style.setProperty("--site-grid-gap", `${settings.gridGap}px`);
  root.style.setProperty("--site-radius", `${settings.radius}px`);
  root.style.setProperty("--site-image-saturation", String(settings.imageSaturation));
  const preset = fontPresets[settings.fontPreset] ?? fontPresets.uau;
  root.style.setProperty("--site-heading-font", preset.heading);
  root.style.setProperty("--site-body-font", preset.body);
  root.style.setProperty("--site-font-scale", String(settings.fontScale));
  root.style.setProperty("--site-heading-weight", String(settings.headingWeight));
  root.style.setProperty("--site-letter-spacing", `${settings.letterSpacing}em`);
  const presetStyleId = "uau-font-preset";
  let presetStyle = document.getElementById(presetStyleId) as HTMLLinkElement | null;
  const presetCssUrl = "cssUrl" in preset && isAllowedStylesheetUrl(preset.cssUrl) ? preset.cssUrl : "";
  if (presetCssUrl) {
    presetStyle ??= Object.assign(document.createElement("link"), { id: presetStyleId, rel: "stylesheet" });
    presetStyle.href = presetCssUrl;
    if (!presetStyle.parentNode) document.head.appendChild(presetStyle);
  } else if (presetStyle) {
    presetStyle.remove();
  }
  const styleId = "uau-r2-fonts";
  let fontStyle = document.getElementById(styleId) as HTMLStyleElement | null;
  const headingFontUrl = isAllowedFontUrl(settings.headingFontUrl) ? settings.headingFontUrl : "";
  const bodyFontUrl = isAllowedFontUrl(settings.bodyFontUrl) ? settings.bodyFontUrl : "";
  if (headingFontUrl || bodyFontUrl) {
    fontStyle ??= Object.assign(document.createElement("style"), { id: styleId });
    const heading = headingFontUrl ? `@font-face{font-family:uau-r2-heading;src:url(${JSON.stringify(headingFontUrl)}) format("${fontFormatForUrl(headingFontUrl)}");font-display:swap;}` : "";
    const body = bodyFontUrl ? `@font-face{font-family:uau-r2-body;src:url(${JSON.stringify(bodyFontUrl)}) format("${fontFormatForUrl(bodyFontUrl)}");font-display:swap;}` : "";
    fontStyle.textContent = `${heading}${body}`;
    if (!fontStyle.parentNode) document.head.appendChild(fontStyle);
    root.style.setProperty("--site-heading-font", headingFontUrl ? "uau-r2-heading, var(--serif)" : preset.heading);
    root.style.setProperty("--site-body-font", bodyFontUrl ? "uau-r2-body, var(--sans)" : preset.body);
  } else if (fontStyle) {
    fontStyle.remove();
  }
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageId = getSitePageId(pathname || "/");
  const [baseSettings, setBaseSettings] = useState(defaultSiteSettings);
  const [pageSettings, setPageSettings] = useState<SiteSettings | null>(null);
  const [previewSettings, setPreviewSettings] = useState<{ pageId?: SitePageId; settings: SiteSettings } | null>(null);
  const [loading, setLoading] = useState(Boolean(db));

  useEffect(() => {
    if (!db) {
      setLoading(false);
      applySiteSettings(defaultSiteSettings);
      return;
    }
    return onSnapshot(doc(db, "site_settings", "public"), (snapshot) => {
      const next = normalizeSettings(snapshot.data());
      setBaseSettings(next);
      setLoading(false);
    }, () => {
      setLoading(false);
      applySiteSettings(defaultSiteSettings);
    });
  }, []);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, "site_page_settings", pageId), (snapshot) => {
      setPageSettings(snapshot.exists() ? normalizeSettings(snapshot.data()) : null);
    }, () => setPageSettings(null));
  }, [pageId]);

  useEffect(() => {
    const resolved = previewSettings && (!previewSettings.pageId || previewSettings.pageId === pageId) ? previewSettings.settings : pageSettings ?? baseSettings;
    applySiteSettings(resolved);
    if (window.parent !== window) window.parent.postMessage({ type: "uau-editor-route", pageId, pathname }, window.location.origin);
  }, [baseSettings, pageId, pageSettings, pathname, previewSettings]);

  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "uau-site-preview-settings") return;
      const nextPageId = typeof event.data.pageId === "string" ? event.data.pageId as SitePageId : undefined;
      const nextSettings = normalizeSettings(event.data.settings);
      setPreviewSettings({ pageId: nextPageId, settings: nextSettings });
      applySiteSettings(nextSettings);
    };
    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, []);

  const settings = previewSettings && (!previewSettings.pageId || previewSettings.pageId === pageId) ? previewSettings.settings : pageSettings ?? baseSettings;
  const value = useMemo(() => ({ settings, loading }), [loading, settings]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
