"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { db } from "./firebase-client";

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
  };
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
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSiteSettings);
  const [loading, setLoading] = useState(Boolean(db));

  useEffect(() => {
    if (!db) {
      setLoading(false);
      applySiteSettings(defaultSiteSettings);
      return;
    }
    return onSnapshot(doc(db, "site_settings", "public"), (snapshot) => {
      const next = normalizeSettings(snapshot.data());
      setSettings(next);
      applySiteSettings(next);
      setLoading(false);
    }, () => {
      setLoading(false);
      applySiteSettings(defaultSiteSettings);
    });
  }, []);

  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.data?.type !== "uau-site-preview-settings") return;
      applySiteSettings(normalizeSettings(event.data.settings));
    };
    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, []);

  const value = useMemo(() => ({ settings, loading }), [loading, settings]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
