"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { useLanguage } from "./i18n-provider";
import { db } from "./firebase-client";

export type SiteContentRecord = Record<string, string | boolean>;

export const defaultSiteContent: SiteContentRecord = {
  "home.hero.line1.en": "A network",
  "home.hero.line1.ko": "관계가 계속되는",
  "home.hero.emphasis.en": "that stays",
  "home.hero.emphasis.ko": "아티스트",
  "home.hero.line3.en": "connected.",
  "home.hero.line3.ko": "네트워크.",
  "home.hero.lede.en": "A relationship that starts in an exhibition and keeps going after.",
  "home.hero.lede.ko": "전시에서 시작된 관계가 그 이후에도 이어집니다.",
  "home.hero.subline.en": "A global artist network built around connection and continuity.",
  "home.hero.subline.ko": "연결과 지속을 중심으로 움직이는 글로벌 아티스트 네트워크.",
  "home.hero.primary.en": "Trace the connections",
  "home.hero.primary.ko": "연결 따라가기",
  "home.hero.secondary.en": "Meet the artists",
  "home.hero.secondary.ko": "아티스트 만나기",
  "home.intro.title.en": "Artists enter through practice, remain through relationship.",
  "home.intro.title.ko": "아티스트는 실천으로 들어와 관계로 남습니다.",
  "home.intro.body.en": "u.a.u is an artist unit built around relationships formed through UNFRAME — extending beyond exhibitions into ongoing exchange, collaboration and practice.",
  "home.intro.body.ko": "u.a.u는 UNFRAME을 통해 형성된 관계를 중심으로 움직이는 아티스트 유닛입니다. 전시를 넘어 지속적인 교류와 협업, 실천으로 이어갑니다.",
  "home.intro.cta.en": "How we connect",
  "home.intro.cta.ko": "우리가 연결되는 방식",
  "home.radar.title.en": "A signal worth following.",
  "home.radar.title.ko": "따라가 볼 만한 신호.",
  "home.radar.cta.en": "Enter Radar",
  "home.radar.cta.ko": "Radar 들어가기",
  "home.join.title.en": "There is room for",
  "home.join.title.ko": "여기에는 자리가 있습니다",
  "home.join.cta.en": "Find your way in",
  "home.join.cta.ko": "당신의 방식으로 들어오기",
  "home.section.radar": true,
  "home.section.connection": true,
  "home.section.recap": true,
  "home.section.selection": true,
  "home.section.artists": true,
  "home.section.works": true,
  "home.section.journal": true,
  "home.section.faq": true,
  "home.section.join": true,
};

const SiteContentContext = createContext<{ content: SiteContentRecord; loading: boolean }>({ content: defaultSiteContent, loading: true });

function normalizeContent(data?: DocumentData): SiteContentRecord {
  return Object.entries(defaultSiteContent).reduce<SiteContentRecord>((result, [key, fallback]) => {
    const value = data?.[key];
    result[key] = typeof value === typeof fallback ? value as string | boolean : fallback;
    return result;
  }, { ...defaultSiteContent });
}

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState(defaultSiteContent);
  const [previewContent, setPreviewContent] = useState<SiteContentRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(db));

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    return onSnapshot(doc(db, "site_content", "home"), (snapshot) => {
      setContent(normalizeContent(snapshot.data()));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.data?.type === "uau-site-preview-content") setPreviewContent(normalizeContent(event.data.content));
      if (event.data?.type === "uau-site-preview-content-clear") setPreviewContent(null);
    };
    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, []);

  useEffect(() => {
    const active = previewContent ?? content;
    const sectionNames = ["radar", "connection", "recap", "selection", "artists", "works", "journal", "faq", "join"];
    sectionNames.forEach((name) => {
      document.documentElement.toggleAttribute(`data-hide-home-${name}`, active[`home.section.${name}`] === false);
    });
    return () => sectionNames.forEach((name) => document.documentElement.removeAttribute(`data-hide-home-${name}`));
  }, [content, previewContent]);

  const value = useMemo(() => ({ content: previewContent ?? content, loading }), [content, loading, previewContent]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}

export function SiteCopy({ contentKey, fallback, className }: { contentKey: string; fallback: string; className?: string }) {
  const { locale } = useLanguage();
  const { content } = useSiteContent();
  const value = content[`${contentKey}.${locale}`] ?? fallback;
  return <span className={className} data-uau-editable="true" data-uau-edit-scope="siteContent" data-uau-edit-key={contentKey} data-uau-edit-language={locale}>{String(value)}</span>;
}

export function SiteSection({ contentKey, children }: { contentKey: string; children: React.ReactNode }) {
  const { content } = useSiteContent();
  return content[contentKey] === false ? null : <>{children}</>;
}
