export type Locale = "en" | "ko";

export function tx<T>(locale: Locale, english: T, korean: T): T {
  return locale === "ko" ? korean : english;
}

const artistTranslations: Record<string, { discipline: string; stage: string; tags: string[]; bio: string }> = {
  "seo-yujin": { discipline: "Painting", stage: "Emerging", tags: ["Body", "Memory", "Color"], bio: "Seo Yujin works with the body as a soft archive — painting the distance between what is held and what can be said." },
  "han-mira": { discipline: "Textile / Installation", stage: "Mid-career", tags: ["Material", "Ritual", "Space"], bio: "Han Mira builds quiet architectures from textile, repetition, and the remembered gestures of a room." },
  "yoon-doyun": { discipline: "Sound", stage: "Emerging", tags: ["Time", "Archive", "Sound"], bio: "Yoon Doyun composes with field recordings, fragments, and the acoustic residue of places in transition." },
  "maria-novak": { discipline: "Sculpture", stage: "Emerging", tags: ["Material", "Body", "Narrative"], bio: "Maria Novak makes small monuments for the intimate and unresolved, balancing weight with a sense of play." },
  "kento-arai": { discipline: "Moving image", stage: "Mid-career", tags: ["Urban", "Memory", "Technology"], bio: "Kento Arai traces how cities remember through moving image, light, and the intervals between public and private." },
  "lee-eunchae": { discipline: "Ceramics", stage: "Emerging", tags: ["Nature", "Material", "Delicate"], bio: "Lee Eunchae listens to clay as a living material, making vessels that hold weather, touch, and pause." },
};

const artistKorean: Record<string, { discipline: string; stage: string; tags: string[]; bio: string }> = {
  "seo-yujin": { discipline: "회화", stage: "신진", tags: ["몸", "기억", "색채"], bio: "서유진은 몸을 부드러운 아카이브로 다룹니다. 간직된 것과 말할 수 있는 것 사이의 거리를 그립니다." },
  "han-mira": { discipline: "텍스타일 / 설치", stage: "중견", tags: ["물질", "의식", "공간"], bio: "한미라는 텍스타일과 반복, 한 공간에 남은 몸짓의 기억으로 고요한 구조를 만듭니다." },
  "yoon-doyun": { discipline: "사운드", stage: "신진", tags: ["시간", "아카이브", "소리"], bio: "윤도윤은 전환 중인 장소의 필드 레코딩과 파편, 음향적 잔여물로 작곡합니다." },
  "maria-novak": { discipline: "조각", stage: "신진", tags: ["물질", "몸", "서사"], bio: "마리아 노박은 친밀하고 미해결된 것들을 위한 작은 기념비를 만들며, 무게와 유희 사이의 균형을 찾습니다." },
  "kento-arai": { discipline: "영상", stage: "중견", tags: ["도시", "기억", "기술"], bio: "켄토 아라이는 영상과 빛, 공적 영역과 사적 영역 사이의 간격을 통해 도시가 기억하는 방식을 추적합니다." },
  "lee-eunchae": { discipline: "도예", stage: "신진", tags: ["자연", "물질", "섬세함"], bio: "이은채는 점토를 살아 있는 재료로 듣고, 날씨와 접촉, 멈춤을 담는 그릇을 만듭니다." },
};

const artworkTranslations: Record<string, { medium: string; status: string; title?: string }> = {
  "the-distance-between": { medium: "Oil and graphite on linen", status: "Available" },
  "soft-architecture-03": { medium: "Dyed cotton, thread", status: "Price on request" },
  "a-room-listening": { medium: "4-channel sound installation", status: "Available" },
  "small-weather": { medium: "Stoneware, ash glaze", status: "Available" },
};

const artworkKorean: Record<string, { medium: string; status: string }> = {
  "the-distance-between": { medium: "린넨에 유채와 흑연", status: "판매 가능" },
  "soft-architecture-03": { medium: "염색 면, 실", status: "가격 문의" },
  "a-room-listening": { medium: "4채널 사운드 설치", status: "판매 가능" },
  "small-weather": { medium: "석기, 재 유약", status: "판매 가능" },
};

const projectTranslations: Record<string, { meta: string; description: string; status: string }> = {
  "after-the-salon": { meta: "UNFRAME Salon 04 · 2026", description: "A conversation that kept moving after the exhibition closed.", status: "In process" },
  "soft-violence": { meta: "Research unit · 2025—26", description: "Three practices looking at how a surface can hold both care and resistance.", status: "Archive" },
};

const projectKorean: Record<string, { meta: string; description: string; status: string }> = {
  "after-the-salon": { meta: "UNFRAME 살롱 04 · 2026", description: "전시가 끝난 뒤에도 계속 움직인 대화.", status: "진행 중" },
  "soft-violence": { meta: "리서치 유닛 · 2025—26", description: "하나의 표면이 돌봄과 저항을 함께 품을 수 있는 방식을 바라보는 세 가지 실천.", status: "아카이브" },
};

export function artistText(locale: Locale, slug: string) {
  return locale === "ko" ? artistKorean[slug] : artistTranslations[slug];
}

export function artworkText(locale: Locale, id: string) {
  return locale === "ko" ? artworkKorean[id] : artworkTranslations[id];
}

export function projectText(locale: Locale, slug: string) {
  return locale === "ko" ? projectKorean[slug] : projectTranslations[slug];
}

export function countryText(locale: Locale, country: string) {
  if (locale !== "ko") return country;
  return ({ Korea: "한국", Germany: "독일", Czechia: "체코", Japan: "일본" } as Record<string, string>)[country] ?? country;
}

export function cityText(locale: Locale, city: string) {
  if (locale !== "ko") return city;
  return ({ Seoul: "서울", Berlin: "베를린", Busan: "부산", Prague: "프라하", Tokyo: "도쿄", Jeju: "제주" } as Record<string, string>)[city] ?? city;
}

export function getLocale(value?: string | null): Locale {
  return value === "ko" ? "ko" : "en";
}
