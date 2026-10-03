"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Expand, X } from "lucide-react";
import type { ArtistSiteTemplate } from "../profile";
import { tx } from "../i18n-shared";
import "./artist-template-picker.css";

const choices: Array<{ value: ArtistSiteTemplate; title: string; en: string; ko: string }> = [
  { value: "gallery", title: "White Cube / 화이트 큐브", en: "An artwork-led opening and a spacious exhibition wall.", ko: "큰 대표 작품으로 시작하는 여백 있는 전시형 페이지." },
  { value: "editorial", title: "Journal / 저널", en: "Asymmetric images, an artist's story, and a dark statement section.", ko: "비대칭 이미지와 이야기, 검은 작가노트 섹션이 있는 매거진형." },
  { value: "archive", title: "Archive / 아카이브", en: "A compact introduction and a three-column artwork index.", ko: "간결한 소개와 3열 작품 목록으로 탐색하기 쉬운 아카이브형." },
];

export function ArtistTemplatePicker({ value, onChange, locale }: { value: ArtistSiteTemplate; onChange: (value: ArtistSiteTemplate) => void; locale: "en" | "ko" }) {
  const [expanded, setExpanded] = useState<ArtistSiteTemplate | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (expanded && !dialog.current?.open) dialog.current?.showModal();
    if (!expanded && dialog.current?.open) dialog.current.close();
  }, [expanded]);
  const selected = choices.find((item) => item.value === expanded);
  return <div className="artist-template-picker">
    <p>{tx(locale, "Compare the Pring examples, then choose a layout. Your content and section order stay unchanged.", "프링 예시를 보고 디자인을 선택하세요. 입력한 내용과 섹션 순서는 그대로 유지됩니다.")}</p>
    <div className="artist-template-options">{choices.map((item) => <article key={item.value} className={value === item.value ? "is-selected" : ""}>
      <button type="button" className="artist-template-image" onClick={() => setExpanded(item.value)} aria-label={tx(locale, `Enlarge ${item.title} example`, `${item.title} 시안 크게 보기`)}><img src={`/assets/artist-templates/${item.value}.jpg`} alt={tx(locale, `Pring artist page in the ${item.title} layout`, `프링의 ${item.title} 작가 페이지 시안`)} loading="lazy" width="960" height="1600"/><span><Expand size={14}/>{tx(locale, "View full example", "전체 시안 보기")}</span></button>
      <div className="artist-template-description"><h3>{item.title}</h3><p>{tx(locale, item.en, item.ko)}</p><button type="button" aria-pressed={value === item.value} onClick={() => onChange(item.value)}>{value === item.value && <Check size={16}/>} {tx(locale, value === item.value ? "Selected" : "Choose this design", value === item.value ? "선택한 디자인" : "이 디자인 선택")}</button></div>
    </article>)}</div>
    <small>{tx(locale, "Pring is a design example only. Empty sections are hidden on your public page; virtual exhibition availability is managed separately.", "프링은 디자인 예시입니다. 빈 섹션은 공개 페이지에서 숨겨지며, 버추얼 전시 이용 여부는 별도로 관리됩니다.")}</small>
    <dialog ref={dialog} className="artist-template-lightbox" onClose={() => setExpanded(null)} aria-label={selected?.title || tx(locale, "Design example", "디자인 시안")}><div><strong>{selected?.title}</strong><button type="button" onClick={() => setExpanded(null)} aria-label={tx(locale, "Close example", "시안 닫기")}><X size={20}/></button></div>{expanded && <img src={`/assets/artist-templates/${expanded}.jpg`} alt={tx(locale, "Full artist page design example", "작가 페이지 전체 디자인 시안")}/>}</dialog>
  </div>;
}
