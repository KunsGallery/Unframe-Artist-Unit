"use client";

import { Plus, Trash2 } from "lucide-react";
import { MetaLine } from "../../components";
import { tx } from "../../i18n-shared";
import { inquiryPurposes } from "../../inquiry-purposes";
import { R2ImageUploader } from "../../components/r2-image-uploader";
import { R2VideoUploader } from "../../components/r2-video-uploader";
import type { ArtistInspiration, ArtistSiteArchiveEntry, ArtistSiteWork } from "../../profile";
import type { ProfileForm, SetProfileField } from "./profile-form";

// Public-site builder record sections of the profile editor.
type SectionProps = { form: ProfileForm; setField: SetProfileField; locale: "en" | "ko" };

function workUpdater({ form, setField }: SectionProps) {
  return (index: number, field: keyof ArtistSiteWork, value: string) => setField("siteWorks", form.siteWorks.map((work, workIndex) => workIndex === index ? { ...work, [field]: value } : work));
}

function archiveUpdater({ form, setField }: SectionProps) {
  return (index: number, key: keyof ArtistSiteArchiveEntry, value: string) => setField("siteArchive", form.siteArchive.map((entry, itemIndex) => itemIndex === index ? { ...entry, [key]: value } : entry));
}

export function SelectedWorksEditor(props: SectionProps) {
  const { form, setField, locale } = props;
  const updateWork = workUpdater(props);
  const addWork = () => setField("siteWorks", [...form.siteWorks, { id: `work-${Date.now()}`, title: "", year: "", medium: "", imageUrl: "" }]);
  const removeWork = (index: number) => setField("siteWorks", form.siteWorks.filter((_, workIndex) => workIndex !== index));
  return <div id="artist-works" className="builder-records"><div className="builder-records-heading"><div><MetaLine>{tx(locale, "PUBLIC RECORDS", "공개 기록")}</MetaLine><h3>{tx(locale, "Give the room something real to hold.", "공간에 실제 기록을 남겨보세요.")}</h3></div><p>{tx(locale, "Add selected works and exhibitions. They will appear on your public page in the order you save them.", "대표 작품과 전시를 추가하세요. 저장한 순서대로 공개 페이지에 나타납니다.")}</p></div><div className="builder-record-grid"><section><div className="builder-record-head"><strong>{tx(locale, "Selected works", "대표 작품")}</strong><button type="button" onClick={addWork}>+ {tx(locale, "Add work", "작품 추가")}</button></div>{form.siteWorks.length === 0 && <p className="builder-record-empty">{tx(locale, "No works added yet.", "아직 추가된 작품이 없습니다.")}</p>}{form.siteWorks.map((work, index) => <div className="builder-record-card" key={work.id}><div className="builder-record-card-top"><span>0{index + 1}</span><button type="button" onClick={() => removeWork(index)}>{tx(locale, "Remove", "삭제")}</button></div><label>{tx(locale, "Title", "제목")}<input value={work.title} onChange={(event) => updateWork(index, "title", event.target.value)} placeholder={tx(locale, "The work title", "작품 제목")} /></label><div className="profile-two-up"><label>{tx(locale, "Year", "연도")}<input value={work.year || ""} onChange={(event) => updateWork(index, "year", event.target.value)} placeholder="2026" /></label><label>{tx(locale, "Medium", "매체")}<input value={work.medium || ""} onChange={(event) => updateWork(index, "medium", event.target.value)} placeholder={tx(locale, "Oil on linen", "린넨에 유채")} /></label></div><R2ImageUploader value={work.imageUrl || ""} assetType="work" entityId={work.id} label={tx(locale, "Work image", "작품 이미지")} description={tx(locale, "Choose a clear image that shows this work well.", "작품을 잘 보여주는 이미지를 선택하세요.")} onChange={(url, variants) => setField("siteWorks", form.siteWorks.map((item, itemIndex) => itemIndex === index ? { ...item, imageUrl: url, displayImageUrl: variants?.displayImageUrl || "", thumbnailImageUrl: variants?.thumbnailImageUrl || "", displayImageWidth: variants?.displayImageWidth || 0, thumbnailImageWidth: variants?.thumbnailImageWidth || 0 } : item))} /></div>)}</section><section className="builder-cv-shortcut"><h3>{tx(locale, "Exhibition history", "전시 이력")}</h3><p>{tx(locale, "Edit all exhibitions in the CV section so categories and dates stay consistent.", "전시 이력은 위의 이력 편집기에서 한 번만 입력하세요. 카테고리와 일정이 공개 페이지와 PDF에 함께 반영됩니다.")}</p><a className="text-link" href="#artist-cv">{tx(locale, "Edit CV", "이력 편집하기")} ↗</a></section></div></div>;
}

export function StudioRecordsEditor(props: SectionProps) {
  const { form, setField, locale } = props;
  const updateArchive = archiveUpdater(props);
  const updateInspiration = (index: number, key: keyof ArtistInspiration, value: string) => setField("siteInspirations", form.siteInspirations.map((entry, itemIndex) => itemIndex === index ? { ...entry, [key]: value } : entry));
  return <div className="builder-extra-records"><section><div className="builder-record-head"><strong>Studio Archive</strong><button type="button" onClick={() => setField("siteArchive", [...form.siteArchive, { id: `archive-${Date.now()}`, title: "", note: "" }])}><Plus size={14}/> {tx(locale, "Add process note", "과정 기록 추가")}</button></div><p>{tx(locale, "스케치·재료 실험·습작 등 완성작의 바깥을 기록해요. 공개 여부는 페이지 섹션에서 선택합니다.", "스케치·재료 실험·습작 등 완성작의 바깥을 기록해요. 공개 여부는 페이지 섹션에서 선택합니다.")}</p>{form.siteArchive.map((entry, index) => <div className="builder-record-card" key={entry.id}><div className="builder-record-card-top"><span>0{index + 1}</span><button type="button" onClick={() => setField("siteArchive", form.siteArchive.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={13}/> {tx(locale, "Remove", "삭제")}</button></div><label>{tx(locale, "Entry title", "기록 제목")}<input value={entry.title} onChange={(event) => updateArchive(index, "title", event.target.value)} placeholder={tx(locale, "A study in blue", "색을 찾던 날")} /></label><label>{tx(locale, "Process note", "과정 메모")}<textarea rows={3} value={entry.note} onChange={(event) => updateArchive(index, "note", event.target.value)} placeholder={tx(locale, "What changed during this experiment?", "이 과정에서 발견한 점을 적어보세요.")}/></label><label>{tx(locale, "Process image URL (optional)", "과정 이미지 URL (선택)")}<input type="url" value={entry.imageUrl || ""} onChange={(event) => updateArchive(index, "imageUrl", event.target.value)} placeholder="https://" /></label></div>)}</section><section><div className="builder-record-head"><strong>Influence & Inspiration</strong><button type="button" onClick={() => setField("siteInspirations", [...form.siteInspirations, { id: `inspiration-${Date.now()}`, title: "" }])}><Plus size={14}/> {tx(locale, "Add reference", "영감 추가")}</button></div><p>{tx(locale, "영향을 준 책·영화·음악·작가를 링크와 함께 큐레이션해요.", "영향을 준 책·영화·음악·작가를 링크와 함께 큐레이션해요.")}</p>{form.siteInspirations.map((entry, index) => <div className="builder-record-card" key={entry.id}><div className="builder-record-card-top"><span>0{index + 1}</span><button type="button" onClick={() => setField("siteInspirations", form.siteInspirations.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={13}/> {tx(locale, "Remove", "삭제")}</button></div><label>{tx(locale, "Title", "제목")}<input value={entry.title} onChange={(event) => updateInspiration(index, "title", event.target.value)} /></label><div className="profile-two-up"><label>{tx(locale, "Creator", "만든 사람")}<input value={entry.creator || ""} onChange={(event) => updateInspiration(index, "creator", event.target.value)} /></label><label>{tx(locale, "Kind", "종류")}<input value={entry.kind || ""} onChange={(event) => updateInspiration(index, "kind", event.target.value)} placeholder="책 · 음악 · 작가" /></label></div><label>{tx(locale, "Link", "링크")}<input type="url" value={entry.url || ""} onChange={(event) => updateInspiration(index, "url", event.target.value)} placeholder="https://" /></label><label>{tx(locale, "Why it matters", "작업과의 연결")}<textarea rows={2} value={entry.note || ""} onChange={(event) => updateInspiration(index, "note", event.target.value)} /></label></div>)}</section></div>;
}

export function ContactPurposesEditor({ form, setField, locale }: SectionProps) {
  return <div className="builder-contact-settings"><div><MetaLine>{tx(locale, "CONTACT & COLLABORATION", "문의와 협업")}</MetaLine><h3>{tx(locale, "Open a useful way to reach you.", "필요한 연락의 문을 열어두세요.")}</h3><p>{tx(locale, "개인 이메일을 공개하지 않고, 문의는 U.A.U 받은 편지함으로 받습니다.", "개인 이메일을 공개하지 않고, 문의는 U.A.U 받은 편지함으로 받습니다.")}</p></div><div className="builder-contact-options">{inquiryPurposes.map((purpose) => <label key={purpose.id}><input type="checkbox" checked={form.contactPurposes.includes(purpose.id)} onChange={() => setField("contactPurposes", form.contactPurposes.includes(purpose.id) ? form.contactPurposes.filter((item) => item !== purpose.id) : [...form.contactPurposes, purpose.id])}/>{tx(locale,purpose.en,purpose.ko)}</label>)}</div></div>;
}

export function StudioVideoSettings(props: SectionProps) {
  const { form, locale } = props;
  const updateArchive = archiveUpdater(props);
  return <section className="studio-video-settings"><MetaLine>{tx(locale, "IN THE STUDIO / VIDEO LOOPS", "IN THE STUDIO / 작업 과정 영상")}</MetaLine><p>{tx(locale, "각 작업 기록에 짧은 MP4 또는 WebM 영상을 연결해요. 공개 페이지의 ‘Studio Archive’ 섹션을 켜면 방문자에게 표시됩니다.", "각 작업 기록에 짧은 MP4 또는 WebM 영상을 연결해요. 공개 페이지의 ‘Studio Archive’ 섹션을 켜면 방문자에게 표시됩니다.")}</p>{form.siteArchive.length ? form.siteArchive.map((entry, index) => <div className="studio-video-row" key={entry.id}><span>{entry.title || `기록 ${index + 1}`}</span><R2VideoUploader value={entry.videoUrl} entityId={entry.id} onChange={(url) => updateArchive(index, "videoUrl", url)} /></div>) : <p>{tx(locale, "먼저 Studio Archive에 과정 기록을 추가해 주세요.", "먼저 Studio Archive에 과정 기록을 추가해 주세요.")}</p>}</section>;
}

export function WorkDimensionsSettings(props: SectionProps) {
  const { form, locale } = props;
  const updateWork = workUpdater(props);
  return <section className="work-dimensions-settings"><MetaLine>{tx(locale, "WORK DETAILS / INQUIRY CONTEXT", "작품 정보 / 문의에 함께 전달")}</MetaLine><p>{tx(locale, "Add dimensions so they travel with an inquiry about a specific work.", "작품 문의를 보낼 때 제목·연도·매체와 함께 규격도 전달돼요.")}</p>{form.siteWorks.map((work, index) => <label key={work.id}>{work.title || `${tx(locale, "Work", "작품")} ${index + 1}`}<input value={work.dimensions || ""} onChange={(event) => updateWork(index, "dimensions", event.target.value)} placeholder="116.8 × 91 cm" /></label>)}</section>;
}
