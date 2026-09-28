"use client";

import { Plus, Trash2 } from "lucide-react";
import { artistCvCategories, artistCvCategoryLabels, type ArtistCvCategory } from "../artist/cv";
import type { ArtistSiteExhibition } from "../profile";
import { tx } from "../i18n-shared";

export function ArtistCvEditor({ entries, legacyText, locale, onEntriesChange, onLegacyTextChange }: {
  entries: ArtistSiteExhibition[];
  legacyText: string;
  locale: "en" | "ko";
  onEntriesChange: (entries: ArtistSiteExhibition[]) => void;
  onLegacyTextChange: (value: string) => void;
}) {
  function update(index: number, values: Partial<ArtistSiteExhibition>) {
    onEntriesChange(entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...values } : entry));
  }

  function add() {
    onEntriesChange([...entries, { id: `cv-${Date.now()}`, category: undefined, year: "", eventDate: "", title: "", venue: "", location: "", externalUrl: "" }]);
  }

  return <section className="artist-cv-editor" aria-labelledby="artist-cv-editor-title">
    <div className="artist-cv-editor-heading"><div><span>{tx(locale, "A CLEAR RECORD FOR EVERY READER", "작가와 작품을 찾는 사람 모두를 위한 기록")}</span><h2 id="artist-cv-editor-title">{tx(locale, "Artist CV", "작가 이력")}</h2><p>{tx(locale, "Add each exhibition or award once. Required fields are marked; add a link only when you have one.", "전시와 수상 이력을 항목별로 입력하세요. 필수 항목만 채우고 링크는 있을 때만 추가하면 됩니다.")}</p></div><button type="button" className="button button-outline" onClick={add}><Plus size={15}/>{tx(locale, "Add a record", "이력 추가")}</button></div>
    {entries.length === 0 && <div className="artist-cv-empty"><strong>{tx(locale, "Your CV begins with one record.", "첫 이력부터 차근차근 등록해 보세요.")}</strong><span>{tx(locale, "Personal and group exhibitions, art fairs, and awards will be arranged automatically.", "개인전·단체전·아트페어·수상 내역은 공개 페이지에서 자동으로 정리됩니다.")}</span></div>}
    <div className="artist-cv-editor-list">{entries.map((entry, index) => <fieldset className="artist-cv-entry" key={entry.id}><legend>{String(index + 1).padStart(2, "0")}</legend><button type="button" className="artist-cv-remove" onClick={() => onEntriesChange(entries.filter((_, entryIndex) => entryIndex !== index))} aria-label={tx(locale, `Remove record ${index + 1}`, `${index + 1}번 이력 삭제`)}><Trash2 size={14}/></button>
      <label><span>{tx(locale, "Category", "분류")} <small className="cv-required-label">{tx(locale, "Required", "필수")}</small></span><select required value={entry.category || ""} onChange={(event) => update(index, { category: (event.target.value || undefined) as ArtistCvCategory | undefined })}><option value="">{tx(locale, "Choose a category", "분류 선택")}</option>{artistCvCategories.map((category) => <option key={category} value={category}>{tx(locale, artistCvCategoryLabels[category].en, artistCvCategoryLabels[category].ko)}</option>)}</select></label>
      <label><span>{tx(locale, "Title", "전시·행사명")} <small className="cv-required-label">{tx(locale, "Required", "필수")}</small></span><input required value={entry.title} onChange={(event) => update(index, { title: event.target.value })} placeholder={tx(locale, "Exhibition or award title", "전시명 또는 수상명")}/></label>
      <div className="artist-cv-fields-row"><label><span>{tx(locale, "Date", "일정")} <small className="cv-required-label">{tx(locale, "Required", "필수")}</small></span><input required type="date" value={entry.eventDate || ""} onChange={(event) => update(index, { eventDate: event.target.value, year: event.target.value.slice(0, 4) })}/></label><label><span>{tx(locale, "Venue / organization", "전시장소 / 주최기관")} <small className="cv-required-label">{tx(locale, "Required", "필수")}</small></span><input required value={entry.venue || ""} onChange={(event) => update(index, { venue: event.target.value })} placeholder={tx(locale, "Gallery, fair, or awarding body", "갤러리·아트페어·수여 기관")}/></label></div>
      <div className="artist-cv-fields-row"><label>{tx(locale, "City / country (optional)", "도시 / 국가 (선택)")}<input value={entry.location || ""} onChange={(event) => update(index, { location: event.target.value })} placeholder={tx(locale, "Seoul, Korea", "서울, 한국")}/></label><label>{tx(locale, "Reference link (optional)", "관련 링크 (선택)")}<input type="url" value={entry.externalUrl || ""} onChange={(event) => update(index, { externalUrl: event.target.value })} placeholder="https://"/></label></div>
    </fieldset>)}</div>
    {legacyText.trim() && <details className="artist-cv-legacy"><summary>{tx(locale, "Previous free-form CV notes (kept safely)", "기존 자유형 CV 메모 (보존됨)")}</summary><p>{tx(locale, "Move these details into the records above when convenient. The old text will not be shown in the formatted CV.", "기존 문구는 보존되어 있어요. 편할 때 위 항목으로 옮겨주세요. 새 CV에는 고정 양식으로 정리한 이력만 표시됩니다.")}</p><textarea value={legacyText} onChange={(event) => onLegacyTextChange(event.target.value)} rows={5} aria-label={tx(locale, "Previous CV notes", "이전 CV 메모")}/></details>}
  </section>;
}
