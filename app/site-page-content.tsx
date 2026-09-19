"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { db } from "./firebase-client";
import { getSitePageId, type SitePageId } from "./site-pages";

export type LocalizedPageCopy = { en: string; ko: string };

export type SitePageContent = {
  eyebrow: LocalizedPageCopy;
  title: LocalizedPageCopy;
  emphasis: LocalizedPageCopy;
  description: LocalizedPageCopy;
  primaryLabel: LocalizedPageCopy;
  primaryHref: string;
  secondaryLabel: LocalizedPageCopy;
  secondaryHref: string;
  sectionOrder: string[];
  hiddenSections: string[];
};

const copy = (en: string, ko: string): LocalizedPageCopy => ({ en, ko });

export const defaultSitePageContent: Record<SitePageId, SitePageContent> = {
  home: {
    eyebrow: copy("U.A.U / UNFRAME ARTIST UNIT", "U.A.U / UNFRAME ARTIST UNIT"),
    title: copy("A network", "관계가 계속되는"),
    emphasis: copy("that stays", "아티스트"),
    description: copy("A relationship that starts in an exhibition and keeps going after.", "전시에서 시작된 관계가 그 이후에도 이어집니다."),
    primaryLabel: copy("Trace the connections", "연결 따라가기"),
    primaryHref: "/connections",
    secondaryLabel: copy("Meet the artists", "아티스트 만나기"),
    secondaryHref: "/artists",
    sectionOrder: ["radar", "connection", "recap", "selection", "artists", "works", "journal", "faq", "join"],
    hiddenSections: [],
  },
  artists: {
    eyebrow: copy("THE UNIT / 06 ARTISTS", "유닛 / 아티스트 06명"),
    title: copy("Artists, in their", "아티스트는 각자의"),
    emphasis: copy("own rhythm.", "리듬으로."),
    description: copy("Independent practices connected through UNFRAME, each with their own pace, place, and way of working.", "UNFRAME을 통해 연결된 독립적인 실천들. 각자의 속도와 장소, 작업 방식으로 움직입니다."),
    primaryLabel: copy("Explore artists", "아티스트 둘러보기"),
    primaryHref: "/artists",
    secondaryLabel: copy("Follow connections", "연결 따라가기"),
    secondaryHref: "/connections",
    sectionOrder: ["directory"],
    hiddenSections: [],
  },
  "artist-detail": {
    eyebrow: copy("THE UNIT / ARTIST PROFILE", "유닛 / 아티스트 프로필"),
    title: copy("A practice has", "작업에는"),
    emphasis: copy("its own weather.", "고유한 날씨가 있습니다."),
    description: copy("Meet the artist, the archive, and the relationships gathered around the practice.", "작가와 아카이브, 그리고 작업 주변에 모인 관계를 만나보세요."),
    primaryLabel: copy("Explore artists", "아티스트 둘러보기"),
    primaryHref: "/artists",
    secondaryLabel: copy("See connections", "연결 보기"),
    secondaryHref: "/connections",
    sectionOrder: ["works", "exhibitions", "statement"],
    hiddenSections: [],
  },
  works: {
    eyebrow: copy("THE ARCHIVE / 08 WORKS", "아카이브 / 작품 08점"),
    title: copy("Works to", "천천히"),
    emphasis: copy("spend time with.", "머물러 볼 작품."),
    description: copy("Images, objects, moving images, and the stories that gather around them. Discover by attention, not only by outcome.", "이미지와 오브제, 영상, 그리고 그 주변에 모이는 이야기들. 결과만이 아니라 주의 깊게 바라보며 발견하세요."),
    primaryLabel: copy("Discover all works", "모든 작품 보기"),
    primaryHref: "/works",
    secondaryLabel: copy("Meet the artists", "아티스트 만나기"),
    secondaryHref: "/artists",
    sectionOrder: ["filters", "archive"],
    hiddenSections: [],
  },
  "work-detail": {
    eyebrow: copy("THE ARCHIVE / WORK", "아카이브 / 작품"),
    title: copy("Stay with", "작품 곁에"),
    emphasis: copy("the image.", "머물러 보세요."),
    description: copy("A work is also a route back to the artist, the project, and the people around it.", "작품은 작가와 프로젝트, 그 주변의 사람들에게 돌아가는 경로이기도 합니다."),
    primaryLabel: copy("Ask about this work", "이 작품 문의하기"),
    primaryHref: "#inquire",
    secondaryLabel: copy("Visit the artist", "작가 프로필 보기"),
    secondaryHref: "/artists",
    sectionOrder: ["work", "context"],
    hiddenSections: [],
  },
  projects: {
    eyebrow: copy("THE ARCHIVE / PROJECTS IN MOTION", "아카이브 / 진행 중인 프로젝트"),
    title: copy("Where a connection", "연결이"),
    emphasis: copy("becomes a project.", "프로젝트가 되는 곳."),
    description: copy("Projects hold the in-between: why people met, what they are trying, and what remains unresolved.", "프로젝트는 그 사이를 담습니다. 사람들이 만난 이유, 시도하는 것, 아직 풀리지 않은 것."),
    primaryLabel: copy("Explore projects", "프로젝트 둘러보기"),
    primaryHref: "/projects",
    secondaryLabel: copy("See connections", "연결 아카이브 보기"),
    secondaryHref: "/connections",
    sectionOrder: ["list", "manifesto"],
    hiddenSections: [],
  },
  "project-detail": {
    eyebrow: copy("PROJECT ARCHIVE / IN PROCESS", "프로젝트 아카이브 / 진행 중"),
    title: copy("A room can stay", "모두가 떠난 뒤에도"),
    emphasis: copy("open after everyone leaves.", "방은 열려 있을 수 있습니다."),
    description: copy("Follow the participants, timeline, and questions that keep the project moving.", "참여자와 타임라인, 프로젝트를 계속 움직이는 질문을 따라가세요."),
    primaryLabel: copy("Explore connections", "연결 보기"),
    primaryHref: "/connections",
    secondaryLabel: copy("All projects", "모든 프로젝트"),
    secondaryHref: "/projects",
    sectionOrder: ["context", "participants", "timeline"],
    hiddenSections: [],
  },
  connections: {
    eyebrow: copy("THE RELATIONSHIP ARCHIVE", "관계 아카이브"),
    title: copy("Nothing happens", "아무 일도"),
    emphasis: copy("alone.", "혼자 일어나지 않습니다."),
    description: copy("Follow the people, places, and projects that keep a practice moving. Every line starts with a real encounter.", "실천을 계속 움직이는 사람과 장소, 프로젝트를 따라가세요. 모든 선은 실제 만남에서 시작됩니다."),
    primaryLabel: copy("Start exploring", "탐색 시작하기"),
    primaryHref: "/artists",
    secondaryLabel: copy("Open Radar", "Radar 열기"),
    secondaryHref: "/radar",
    sectionOrder: ["map", "call"],
    hiddenSections: [],
  },
  radar: {
    eyebrow: copy("U.A.U RADAR / EDITORIAL SIGNALS", "U.A.U RADAR / 편집자의 신호"),
    title: copy("Things worth", "움직여볼 만한"),
    emphasis: copy("moving toward.", "신호들."),
    description: copy("A considered list of exhibitions, opportunities, conversations, and rooms we think should stay open.", "계속 열어둘 만한 전시, 기회, 대화, 공간을 u.a.u가 선별해 소개합니다."),
    primaryLabel: copy("For artists", "아티스트를 위한 기회"),
    primaryHref: "/radar#opportunities",
    secondaryLabel: copy("Save a date", "일정 저장"),
    secondaryHref: "/radar#events",
    sectionOrder: ["calendar", "opportunities", "note"],
    hiddenSections: [],
  },
  about: {
    eyebrow: copy("U.A.U / THE CONNECTION", "U.A.U / 연결의 시작"),
    title: copy("Stay", "남고"),
    emphasis: copy("connected.", "연결됩니다."),
    description: copy("A network that grows through exhibitions, artists, audiences, conversations, and the records that remain.", "전시와 작가, 관객과 대화, 그리고 남겨진 기록을 통해 계속 자라는 네트워크입니다."),
    primaryLabel: copy("Meet the artists", "아티스트 만나기"),
    primaryHref: "/artists",
    secondaryLabel: copy("Follow the thread", "실마리 따라가기"),
    secondaryHref: "/connections",
    sectionOrder: ["story"],
    hiddenSections: [],
  },
  join: {
    eyebrow: copy("JOIN U.A.U", "u.a.u 함께하기"),
    title: copy("There is more than", "들어오는 방법은"),
    emphasis: copy("one way in.", "하나가 아닙니다."),
    description: copy("Start with an account, a practice, a curiosity, or a reason to keep a door open.", "계정과 실천, 호기심, 혹은 계속 문을 열어둘 이유에서 시작하세요."),
    primaryLabel: copy("Apply as an artist", "아티스트로 신청하기"),
    primaryHref: "/login",
    secondaryLabel: copy("Explore the archive", "아카이브 둘러보기"),
    secondaryHref: "/artists",
    sectionOrder: ["options", "note"],
    hiddenSections: [],
  },
};

function isLocalizedPageCopy(value: unknown): value is LocalizedPageCopy {
  return Boolean(value && typeof value === "object" && typeof (value as LocalizedPageCopy).en === "string" && typeof (value as LocalizedPageCopy).ko === "string");
}

export function getDefaultSitePageContent(pageId: SitePageId) {
  return defaultSitePageContent[pageId];
}

export function normalizeSitePageContent(data: DocumentData | undefined, pageId: SitePageId): SitePageContent {
  const fallback = defaultSitePageContent[pageId];
  const source = data?.content && typeof data.content === "object" ? data.content as Record<string, unknown> : {};
  const localize = (key: keyof Pick<SitePageContent, "eyebrow" | "title" | "emphasis" | "description" | "primaryLabel" | "secondaryLabel">) => isLocalizedPageCopy(source[key]) ? source[key] : fallback[key];
  return {
    eyebrow: localize("eyebrow"),
    title: localize("title"),
    emphasis: localize("emphasis"),
    description: localize("description"),
    primaryLabel: localize("primaryLabel"),
    primaryHref: typeof source.primaryHref === "string" ? source.primaryHref : fallback.primaryHref,
    secondaryLabel: localize("secondaryLabel"),
    secondaryHref: typeof source.secondaryHref === "string" ? source.secondaryHref : fallback.secondaryHref,
    sectionOrder: Array.isArray(source.sectionOrder) && source.sectionOrder.every((item) => typeof item === "string") ? source.sectionOrder as string[] : fallback.sectionOrder,
    hiddenSections: Array.isArray(source.hiddenSections) && source.hiddenSections.every((item) => typeof item === "string") ? source.hiddenSections as string[] : fallback.hiddenSections,
  };
}

const SitePageContentContext = createContext<{ content: SitePageContent; pageId: SitePageId; loading: boolean }>({ content: defaultSitePageContent.home, pageId: "home", loading: true });

export function SitePageContentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageId = getSitePageId(pathname || "/");
  const [content, setContent] = useState(() => defaultSitePageContent[pageId]);
  const [previewContent, setPreviewContent] = useState<{ pageId: SitePageId; content: SitePageContent } | null>(null);
  const [loading, setLoading] = useState(Boolean(db));

  useEffect(() => {
    setContent(defaultSitePageContent[pageId]);
    if (!db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(doc(db, "site_page_settings", pageId), (snapshot) => {
      setContent(normalizeSitePageContent(snapshot.data(), pageId));
      setLoading(false);
    }, () => {
      setContent(defaultSitePageContent[pageId]);
      setLoading(false);
    });
  }, [pageId]);

  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "uau-site-preview-page-content") return;
      const nextPageId = event.data.pageId;
      if (typeof nextPageId !== "string" || !(nextPageId in defaultSitePageContent)) return;
      setPreviewContent({ pageId: nextPageId as SitePageId, content: normalizeSitePageContent({ content: event.data.content }, nextPageId as SitePageId) });
    };
    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, []);

  const activeContent = previewContent?.pageId === pageId ? previewContent.content : content;
  const value = useMemo(() => ({ content: activeContent, pageId, loading }), [activeContent, loading, pageId]);
  return <SitePageContentContext.Provider value={value}>{children}</SitePageContentContext.Provider>;
}

export function useSitePageContent() {
  return useContext(SitePageContentContext);
}
