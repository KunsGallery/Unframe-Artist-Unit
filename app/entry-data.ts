export type EntryRole = "artist" | "collector" | "curator" | "gallery" | "project";

export const entryRoles: Array<{ value: EntryRole; en: string; ko: string; eyebrowEn: string; eyebrowKo: string }> = [
  { value: "artist", en: "Artist", ko: "아티스트", eyebrowEn: "Make / share / continue", eyebrowKo: "만들고 / 나누고 / 이어가기" },
  { value: "collector", en: "Collector", ko: "컬렉터", eyebrowEn: "Find / keep / return", eyebrowKo: "찾고 / 간직하고 / 돌아가기" },
  { value: "curator", en: "Curator", ko: "큐레이터", eyebrowEn: "Frame / connect / ask", eyebrowKo: "맥락을 만들고 / 연결하고 / 질문하기" },
  { value: "gallery", en: "Gallery", ko: "갤러리", eyebrowEn: "Gather / host / discover", eyebrowKo: "모으고 / 만들고 / 발견하기" },
  { value: "project", en: "Project director", ko: "프로젝트 디렉터", eyebrowEn: "Move / invite / leave a trace", eyebrowKo: "움직이고 / 초대하고 / 흔적 남기기" },
];

export const intentWords: Record<EntryRole, { en: string[]; ko: string[] }> = {
  artist: { en: ["Make", "Share", "Continue", "Be seen"], ko: ["만들기", "나누기", "이어가기", "알려지기"] },
  collector: { en: ["Find", "Keep", "Follow", "Remember"], ko: ["찾기", "간직하기", "따라가기", "기억하기"] },
  curator: { en: ["Frame", "Connect", "Ask", "Discover"], ko: ["맥락 만들기", "연결하기", "질문하기", "발견하기"] },
  gallery: { en: ["Gather", "Host", "Discover", "Build"], ko: ["모으기", "열기", "발견하기", "만들기"] },
  project: { en: ["Move", "Invite", "Produce", "Leave a trace"], ko: ["움직이기", "초대하기", "제작하기", "흔적 남기기"] },
};

export const collectorPreferenceGroups = [
  { key: "media", en: "What do you want to spend time with?", ko: "어떤 매체와 시간을 보내고 싶나요?", options: ["Painting", "Sculpture", "Sound", "Moving image", "Installation", "Textile"] },
  { key: "materials", en: "What kind of material stays with you?", ko: "어떤 재료가 오래 남나요?", options: ["Linen", "Clay", "Metal", "Light", "Paper", "Found material"] },
  { key: "themes", en: "What keeps your attention?", ko: "무엇이 당신의 주의를 오래 붙잡나요?", options: ["Body", "Memory", "Place", "Ritual", "Technology", "Nature"] },
  { key: "regions", en: "Where do you want the thread to travel?", ko: "어디에서 이어지는 실마리를 찾고 싶나요?", options: ["Seoul", "Busan", "Berlin", "Tokyo", "Jeju", "Anywhere"] },
] as const;

export const entryContent: Record<EntryRole, { titleEn: string; titleKo: string; bodyEn: string; bodyKo: string; featuresEn: string[]; featuresKo: string[]; noteEn: string; noteKo: string }> = {
  artist: {
    titleEn: "A page that changes with your practice.", titleKo: "작업과 함께 변하는 페이지.",
    bodyEn: "Build an artist identity, keep an archive, place your work in an imagined room, and let the right people find the thread.", bodyKo: "아티스트 정체성을 만들고, 작품을 아카이브하고, 상상한 공간에 작품을 놓아보세요. 필요한 사람들이 그 실마리를 찾을 수 있도록.",
    featuresEn: ["Artist page builder and work archive", "AI spatial preview for every artist", "Verified artist gallery and advanced controls for approved members"], featuresKo: ["아티스트 페이지 빌더와 작품 아카이브", "모든 아티스트가 사용하는 AI 공간 프리뷰", "인증 멤버십 아티스트를 위한 확장 갤러리"],
    noteEn: "Every artist starts with the same room. Your practice decides what it becomes.", noteKo: "모든 아티스트는 같은 방에서 시작합니다. 그 방이 무엇이 될지는 작업이 결정합니다.",
  },
  collector: {
    titleEn: "A way back to what kept your attention.", titleKo: "마음을 붙잡은 작품으로 돌아가는 방법.",
    bodyEn: "Save artists and works, tell us what you notice, and receive thoughtful recommendations with a reason to return.", bodyKo: "아티스트와 작품을 저장하고, 무엇을 오래 바라보는지 알려주세요. 다시 돌아올 이유가 있는 추천을 받아보세요.",
    featuresEn: ["Saved works and artist follows", "Recommendations shaped by your attention", "Real-time and digest alerts for new work and exhibitions"], featuresKo: ["저장한 작품과 팔로우한 아티스트", "당신의 관심에서 시작하는 추천", "새 작품과 전시를 위한 실시간·다이제스트 알림"],
    noteEn: "Not a feed that shouts. A constellation that remembers.", noteKo: "소리치는 피드가 아니라, 기억하는 별자리입니다.",
  },
  curator: {
    titleEn: "Find the practice that belongs in the room.", titleKo: "그 방에 어울리는 실천을 찾습니다.",
    bodyEn: "Shape a curatorial brief, discover artists by practice and connection, and send a proposal from the archive itself.", bodyKo: "기획 브리프를 만들고, 작업과 연결을 기준으로 아티스트를 발견한 뒤 아카이브에서 바로 제안하세요.",
    featuresEn: ["Curatorial brief and artist matching", "Artist proposals with context attached", "Project and exhibition participant maps"], featuresKo: ["큐레이터 브리프와 아티스트 매칭", "맥락이 연결된 아티스트 제안", "프로젝트·전시 참여자 맵"],
    noteEn: "Curator access opens after a short U.A.U review.", noteKo: "큐레이터 기능은 짧은 U.A.U 검토 후 열립니다.",
  },
  gallery: {
    titleEn: "Discover who could move with your programme.", titleKo: "당신의 프로그램과 함께 움직일 사람을 찾습니다.",
    bodyEn: "Describe the direction of a room, meet artists already in the unit, and begin a proposal without rebuilding the context from zero.", bodyKo: "전시와 프로그램의 방향을 적고, 유닛 안의 아티스트를 만나보세요. 맥락을 처음부터 다시 만들지 않고 제안을 시작할 수 있습니다.",
    featuresEn: ["Programme briefs for your next room", "Discover artists by medium, place, and practice", "Invite artists into projects and exhibitions"], featuresKo: ["다음 공간을 위한 프로그램 브리프", "매체·장소·실천으로 아티스트 발견", "프로젝트와 전시에 아티스트 초대"],
    noteEn: "Gallery access is reserved for approved partners.", noteKo: "갤러리 기능은 승인된 파트너에게 열립니다.",
  },
  project: {
    titleEn: "Make the project legible after the room empties.", titleKo: "방이 비워진 뒤에도 프로젝트가 읽히도록.",
    bodyEn: "Gather the people, works, places, and questions around a project into a living page that keeps moving.", bodyKo: "프로젝트를 둘러싼 사람, 작품, 장소와 질문을 계속 움직이는 하나의 페이지에 모읍니다.",
    featuresEn: ["Project pages with connected participants", "Open-call and invitation workflows", "A neural-style map of what the project touched"], featuresKo: ["참여자와 연결된 프로젝트 페이지", "공모와 초대 워크플로우", "프로젝트가 닿은 곳을 보여주는 연결 맵"],
    noteEn: "Project director access opens after approval.", noteKo: "프로젝트 디렉터 기능은 승인 후 열립니다.",
  },
};
