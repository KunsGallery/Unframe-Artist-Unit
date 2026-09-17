"use client";

import Link from "next/link";
import { ChevronDown, MoveUpRight } from "lucide-react";
import { useState } from "react";
import type { Locale } from "../i18n-shared";

type FaqItem = { question: string; answer: string };

const faqCopy: Record<Locale, {
  kicker: string;
  title: string;
  intro: string;
  categories: Array<{ label: string; items: FaqItem[] }>;
  ctaTitle: string;
  ctaCopy: string;
  ctaLink: string;
}> = {
  en: {
    kicker: "U.A.U / QUESTIONS THAT COME UP",
    title: "Frequently asked.",
    intro: "A few useful starting points for finding your way into the unit.",
    categories: [
      {
        label: "Starting here",
        items: [
          { question: "What is u.a.u?", answer: "u.a.u is a relationship-first artist unit. We connect artists, curators, galleries, collectors, and directors through work that keeps moving after the room closes." },
          { question: "Who can join the unit?", answer: "Artists, curators, galleries, collectors, directors, and people building meaningful projects around art are all welcome to find their way in." },
          { question: "Do I need to be a professional artist?", answer: "No. You can join at the stage that feels right for your practice. Some spaces and opportunities may later ask for a verified artist profile." },
          { question: "Is u.a.u only for people in Korea?", answer: "No. The unit is designed to move across cities and languages. You can begin locally and build relationships wherever your practice takes you." },
        ],
      },
      {
        label: "Your profile",
        items: [
          { question: "What can I do with my profile?", answer: "You can introduce your practice, publish selected works, share your CV and statement, and shape a public artist page that feels like your own room." },
          { question: "Can I build a personal artist website?", answer: "Yes. Eligible artists can choose a visual template, add their works and story, and publish a small virtual gallery through their profile tools." },
          { question: "What is the difference between a profile and a virtual gallery?", answer: "Your profile is the living record of your practice. A virtual gallery is a more focused space for presenting a body of work or an exhibition." },
        ],
      },
      {
        label: "Connections",
        items: [
          { question: "How are connections made?", answer: "Connections grow through exhibitions, projects, salons, saved works, and conversations. We make those relationships visible without reducing them to a popularity score." },
          { question: "Can I find artists by medium or interest?", answer: "Yes. The directory is being shaped around disciplines, materials, places, and the kinds of questions artists are asking." },
          { question: "How do I propose a project or exhibition?", answer: "Start by joining the unit and introducing what you want to make. From there, you can open a thread, invite people, or contact the u.a.u team." },
        ],
      },
      {
        label: "Safety & privacy",
        items: [
          { question: "Who can see my information?", answer: "You choose what becomes public. Private account information stays protected, while published profile and work details are shown only when you make them live." },
          { question: "Can I remove or unpublish my page?", answer: "Yes. You can unpublish your public page and manage your profile details from your dashboard." },
          { question: "How does u.a.u handle moderation?", answer: "We review reports, protect personal information, and work to keep the unit open without allowing harassment, impersonation, or harmful content." },
        ],
      },
    ],
    ctaTitle: "Still looking for an answer?",
    ctaCopy: "Tell us what you are trying to make. We will help you find the next thread.",
    ctaLink: "Find your way in",
  },
  ko: {
    kicker: "U.A.U / 자주 나오는 질문",
    title: "자주 묻는 질문.",
    intro: "유닛에 들어오는 방법을 찾을 때 도움이 되는 몇 가지 시작점입니다.",
    categories: [
      {
        label: "먼저 알아두기",
        items: [
          { question: "u.a.u는 무엇인가요?", answer: "u.a.u는 관계를 중심으로 움직이는 아티스트 유닛입니다. 방이 닫힌 뒤에도 이어지는 작업을 통해 아티스트, 큐레이터, 갤러리, 컬렉터, 디렉터를 연결합니다." },
          { question: "누가 유닛에 참여할 수 있나요?", answer: "아티스트, 큐레이터, 갤러리, 컬렉터, 디렉터, 그리고 예술을 중심으로 의미 있는 프로젝트를 만들고 있는 사람이라면 누구나 자신의 방식으로 들어올 수 있습니다." },
          { question: "전문 아티스트가 아니어도 되나요?", answer: "물론입니다. 자신의 실천에 맞는 단계에서 시작하면 됩니다. 일부 공간과 기회는 이후 인증 아티스트 프로필을 요청할 수 있습니다." },
          { question: "한국에서만 참여할 수 있나요?", answer: "아닙니다. 유닛은 도시와 언어 사이를 오갈 수 있도록 만들어지고 있습니다. 가까운 곳에서 시작해 작업이 향하는 곳마다 관계를 만들어갈 수 있습니다." },
        ],
      },
      {
        label: "나의 프로필",
        items: [
          { question: "프로필에서는 무엇을 할 수 있나요?", answer: "자신의 실천을 소개하고, 작품과 CV, 작가 노트를 공개하며, 자신의 방처럼 느껴지는 개별 아티스트 페이지를 만들 수 있습니다." },
          { question: "개인 아티스트 웹사이트를 만들 수 있나요?", answer: "가능합니다. 조건을 충족한 아티스트는 시각적 템플릿을 고르고 작품과 이야기를 더해 대시보드에서 작은 버츄얼 갤러리를 공개할 수 있습니다." },
          { question: "프로필과 버츄얼 갤러리는 어떻게 다른가요?", answer: "프로필은 작업의 흐름을 기록하는 살아 있는 페이지입니다. 버츄얼 갤러리는 특정 작품군이나 전시를 더 집중해서 보여주는 공간입니다." },
        ],
      },
      {
        label: "연결 만들기",
        items: [
          { question: "연결은 어떻게 만들어지나요?", answer: "연결은 전시, 프로젝트, 살롱, 저장한 작품, 대화를 통해 자랍니다. 우리는 관계를 단순한 인기 점수로 줄이지 않고 그 흐름이 보이도록 합니다." },
          { question: "재료나 관심사로 아티스트를 찾을 수 있나요?", answer: "가능합니다. 디렉터리는 장르와 재료, 장소, 그리고 아티스트가 던지는 질문을 중심으로 계속 확장될 예정입니다." },
          { question: "프로젝트나 전시를 제안하려면 어떻게 하나요?", answer: "먼저 유닛에 참여하고 만들고 싶은 것을 소개해 주세요. 이후 스레드를 열거나 사람을 초대하거나 u.a.u 팀에 직접 제안할 수 있습니다." },
        ],
      },
      {
        label: "안전과 개인정보",
        items: [
          { question: "내 정보는 누가 볼 수 있나요?", answer: "무엇을 공개할지는 직접 선택합니다. 비공개 계정 정보는 보호되며, 공개한 프로필과 작품 정보만 페이지에 표시됩니다." },
          { question: "페이지를 삭제하거나 비공개로 바꿀 수 있나요?", answer: "가능합니다. 대시보드에서 공개 페이지를 비활성화하고 프로필 정보를 관리할 수 있습니다." },
          { question: "u.a.u는 어떻게 콘텐츠를 관리하나요?", answer: "신고를 검토하고 개인정보를 보호하며, 괴롭힘·사칭·유해 콘텐츠가 생기지 않도록 열린 유닛의 기준을 계속 다듬어갑니다." },
        ],
      },
    ],
    ctaTitle: "아직 답을 찾지 못했나요?",
    ctaCopy: "무엇을 만들고 있는지 알려주세요. 다음 연결을 함께 찾아볼게요.",
    ctaLink: "나의 방식으로 들어오기",
  },
};

export function HomeFaq({ locale }: { locale: Locale }) {
  const copy = faqCopy[locale];
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const category = copy.categories[categoryIndex];

  function selectCategory(index: number) {
    setCategoryIndex(index);
    setOpenIndex(0);
  }

  return (
    <section className="home-faq page-wrap" aria-labelledby="home-faq-title">
      <div className="home-faq-heading">
        <span className="home-faq-kicker">{copy.kicker}</span>
        <h2 id="home-faq-title">{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>
      <div className="home-faq-layout">
        <div className="home-faq-categories" role="tablist" aria-label={locale === "ko" ? "FAQ 카테고리" : "FAQ categories"}>
          {copy.categories.map((item, index) => (
            <button
              aria-selected={categoryIndex === index}
              className={categoryIndex === index ? "active" : ""}
              key={item.label}
              onClick={() => selectCategory(index)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="home-faq-list" role="tabpanel">
          {category.items.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${categoryIndex}-${index}`;
            return (
              <div className={`home-faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
                <button
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  className="home-faq-question"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  type="button"
                >
                  <span>{item.question}</span>
                  <ChevronDown size={16} />
                </button>
                <div className="home-faq-answer" hidden={!isOpen} id={panelId}>
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="home-faq-cta">
        <strong>{copy.ctaTitle}</strong>
        <p>{copy.ctaCopy}</p>
        <Link className="button button-blue" href="/join">
          {copy.ctaLink} <MoveUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
