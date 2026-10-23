// Artist contact purposes, shared by the contact form and the inquiries API.
export const inquiryPurposes = [
  { id: "work", en: "Artwork purchase or loan", ko: "작품 구매·대여" },
  { id: "curation", en: "Exhibition / curatorial proposal", ko: "전시·기획 제안" },
  { id: "collaboration", en: "Collaboration", ko: "협업 제안" },
  { id: "other", en: "Other inquiry", ko: "기타 문의" },
] as const;

export type InquiryPurposeId = typeof inquiryPurposes[number]["id"];
