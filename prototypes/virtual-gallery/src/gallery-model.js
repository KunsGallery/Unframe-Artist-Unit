export const GALLERY_STORAGE_KEY = 'uau-vgallery-draft-v2';
export const EXHIBITION_ID = 'han-mira-light-stays-demo';

export const DEFAULT_GALLERY = {
  id: EXHIBITION_ID,
  title: '빛이 머무는 자리',
  artist: '한미라',
  description: '작품 6점을 두 개의 방에서 감상하는 U.A.U 가상 전시장 시제품입니다.',
  venue: 'U.A.U 가상 전시장',
  period: '상시 관람',
  posterAssetId: null,
  posterUrl: '/art/work-1.png',
};

export const PLACEMENTS = [
  { id: 'r1-left-1', type: 'wall', room: 1, label: '1룸 · 왼쪽 벽 · 입구 쪽', x: -5.85, y: 2.38, z: 6.1, rotation: Math.PI / 2 },
  { id: 'r1-left-2', type: 'wall', room: 1, label: '1룸 · 왼쪽 벽 · 안쪽', x: -5.85, y: 2.38, z: -1.1, rotation: Math.PI / 2 },
  { id: 'r1-left-center', type: 'wall', room: 1, label: '1룸 · 왼쪽 벽 · 중앙', x: -5.85, y: 2.38, z: 2.5, rotation: Math.PI / 2 },
  { id: 'r1-right-1', type: 'wall', room: 1, label: '1룸 · 오른쪽 벽 · 입구 쪽', x: 5.85, y: 2.38, z: 6.1, rotation: -Math.PI / 2 },
  { id: 'r1-right-2', type: 'wall', room: 1, label: '1룸 · 오른쪽 벽 · 안쪽', x: 5.85, y: 2.38, z: -1.1, rotation: -Math.PI / 2 },
  { id: 'r1-right-center', type: 'wall', room: 1, label: '1룸 · 오른쪽 벽 · 중앙', x: 5.85, y: 2.38, z: 2.5, rotation: -Math.PI / 2 },
  { id: 'r1-divider-left', type: 'wall', room: 1, label: '1룸 · 연결 벽 · 문 왼쪽', x: -3.9, y: 2.38, z: -4.89, rotation: 0 },
  { id: 'r1-divider-right', type: 'wall', room: 1, label: '1룸 · 연결 벽 · 문 오른쪽', x: 3.9, y: 2.38, z: -4.89, rotation: 0 },
  { id: 'r1-back-left', type: 'wall', room: 1, label: '1룸 · 안쪽 벽 · 왼쪽', x: -3.7, y: 2.38, z: 9.86, rotation: Math.PI },
  { id: 'r1-back-right', type: 'wall', room: 1, label: '1룸 · 안쪽 벽 · 오른쪽', x: 3.7, y: 2.38, z: 9.86, rotation: Math.PI },
  { id: 'r2-left-1', type: 'wall', room: 2, label: '2룸 · 왼쪽 벽 · 입구 쪽', x: -5.85, y: 2.38, z: -8.9, rotation: Math.PI / 2 },
  { id: 'r2-left-2', type: 'wall', room: 2, label: '2룸 · 왼쪽 벽 · 안쪽', x: -5.85, y: 2.38, z: -16.1, rotation: Math.PI / 2 },
  { id: 'r2-left-center', type: 'wall', room: 2, label: '2룸 · 왼쪽 벽 · 중앙', x: -5.85, y: 2.38, z: -12.5, rotation: Math.PI / 2 },
  { id: 'r2-right-1', type: 'wall', room: 2, label: '2룸 · 오른쪽 벽 · 입구 쪽', x: 5.85, y: 2.38, z: -8.9, rotation: -Math.PI / 2 },
  { id: 'r2-right-2', type: 'wall', room: 2, label: '2룸 · 오른쪽 벽 · 안쪽', x: 5.85, y: 2.38, z: -16.1, rotation: -Math.PI / 2 },
  { id: 'r2-right-center', type: 'wall', room: 2, label: '2룸 · 오른쪽 벽 · 중앙', x: 5.85, y: 2.38, z: -12.5, rotation: -Math.PI / 2 },
  { id: 'r2-divider-left', type: 'wall', room: 2, label: '2룸 · 연결 벽 · 문 왼쪽', x: -3.9, y: 2.38, z: -5.11, rotation: Math.PI },
  { id: 'r2-divider-right', type: 'wall', room: 2, label: '2룸 · 연결 벽 · 문 오른쪽', x: 3.9, y: 2.38, z: -5.11, rotation: Math.PI },
  { id: 'r2-back-left', type: 'wall', room: 2, label: '2룸 · 안쪽 벽 · 왼쪽', x: -3.7, y: 2.38, z: -19.86, rotation: 0 },
  { id: 'r2-back-right', type: 'wall', room: 2, label: '2룸 · 안쪽 벽 · 오른쪽', x: 3.7, y: 2.38, z: -19.86, rotation: 0 },
  { id: 'r1-floor-left', type: 'floor', room: 1, label: '1룸 · 바닥 · 왼쪽 받침대', x: -2, y: 0, z: 2.5, rotation: 0 },
  { id: 'r1-floor-right', type: 'floor', room: 1, label: '1룸 · 바닥 · 오른쪽 받침대', x: 2, y: 0, z: 2.5, rotation: 0 },
  { id: 'r2-floor-left', type: 'floor', room: 2, label: '2룸 · 바닥 · 왼쪽 받침대', x: -2, y: 0, z: -12.5, rotation: 0 },
  { id: 'r2-floor-right', type: 'floor', room: 2, label: '2룸 · 바닥 · 오른쪽 받침대', x: 2, y: 0, z: -12.5, rotation: 0 },
];

export const DEFAULT_WORKS = [
  { id: 'sample-1', title: '푸른 숨', year: '2026', room: 1, type: 'image', placementId: 'r1-left-center', mediumUrl: '/art/work-1-medium.jpg', originalUrl: '/art/work-1.png' },
  { id: 'sample-2', title: '겹쳐진 시간', year: '2026', room: 1, type: 'image', placementId: 'r1-right-center', mediumUrl: '/art/work-2-medium.jpg', originalUrl: '/art/work-2.png' },
  { id: 'sample-3', title: '흐름의 표면', year: '2025', room: 1, type: 'image', placementId: 'r1-divider-left', mediumUrl: '/art/work-3-medium.jpg', originalUrl: '/art/work-3.png' },
  { id: 'sample-4', title: '고요의 형태', year: '2026', room: 1, type: 'image', placementId: 'r1-divider-right', mediumUrl: '/art/work-4-medium.jpg', originalUrl: '/art/work-4.png' },
  { id: 'sample-5', title: '빛의 자리', year: '2025', room: 2, type: 'image', placementId: 'r2-back-left', mediumUrl: '/art/work-5-medium.jpg', originalUrl: '/art/work-5.png' },
  { id: 'sample-6', title: '남겨진 파동', year: '2026', room: 2, type: 'image', placementId: 'r2-back-right', mediumUrl: '/art/work-6-medium.jpg', originalUrl: '/art/work-6.png' },
];

export function placementFor(work) {
  return PLACEMENTS.find((placement) => placement.id === work?.placementId) ?? PLACEMENTS[0];
}

export function wallAdjustmentLimits(placementId, size = 1) {
  const placement = PLACEMENTS.find((item) => item.id === placementId);
  if (!placement || placement.type !== 'wall') return { along: 0, height: 0 };
  const scale = Math.min(1.3, Math.max(0.65, Number(size) || 1));
  const halfWidth = 1.35 * scale;
  const halfHeight = 1.53 * scale;
  const tangent = { x: Math.cos(placement.rotation), z: -Math.sin(placement.rotation) };
  const project = (x, z) => x * tangent.x + z * tangent.z;
  const isSideWall = Math.abs(placement.x) > 5;
  const isDivider = placement.id.includes('divider');
  const roomCenterZ = placement.room === 1 ? 2.5 : -12.5;
  let [lowX, highX] = isDivider
    ? (placement.x < 0 ? [-6, -1.8] : [1.8, 6])
    : (placement.id.includes('back-') ? (placement.x < 0 ? [-6, 0] : [0, 6]) : [-6, 6]);
  let [lowZ, highZ] = isSideWall ? [roomCenterZ - 7.5, roomCenterZ + 7.5] : [placement.z, placement.z];
  let lower = isSideWall ? Math.min(project(placement.x, lowZ), project(placement.x, highZ)) : Math.min(project(lowX, placement.z), project(highX, placement.z));
  let upper = isSideWall ? Math.max(project(placement.x, lowZ), project(placement.x, highZ)) : Math.max(project(lowX, placement.z), project(highX, placement.z));
  const center = project(placement.x, placement.z);
  let negativeRoom = center - lower - halfWidth - 0.08;
  let positiveRoom = upper - center - halfWidth - 0.08;
  const segmentKey = isDivider ? `divider-${placement.x < 0 ? 'left' : 'right'}`
    : isSideWall ? `side-${placement.x < 0 ? 'left' : 'right'}`
      : `back-${placement.x < 0 ? 'left' : 'right'}`;
  const peers = PLACEMENTS.filter((item) => {
    if (item.id === placement.id || item.type !== 'wall' || item.room !== placement.room) return false;
    const peerSegment = item.id.includes('divider') ? `divider-${item.x < 0 ? 'left' : 'right'}`
      : Math.abs(item.x) > 5 ? `side-${item.x < 0 ? 'left' : 'right'}`
        : `back-${item.x < 0 ? 'left' : 'right'}`;
    return peerSegment === segmentKey;
  }).map((item) => project(item.x, item.z));
  for (const peer of peers) {
    const clearance = Math.abs(peer - center) - halfWidth * 2 - 0.16;
    if (peer < center) negativeRoom = Math.min(negativeRoom, clearance);
    else positiveRoom = Math.min(positiveRoom, clearance);
  }
  return {
    along: Math.max(0, Math.min(negativeRoom, positiveRoom)),
    height: Math.max(0, Math.min(placement.y - halfHeight, 5 - placement.y - halfHeight) - 0.08),
  };
}

export function placementsFor(type, works, currentId) {
  const placementType = type === 'object' ? 'floor' : 'wall';
  const occupied = new Set(works.filter((work) => work.id !== currentId).map((work) => work.placementId));
  return PLACEMENTS.filter((placement) => placement.type === placementType && !occupied.has(placement.id));
}

export function youtubeVideoId(value = '') {
  try {
    const url = new URL(value.trim());
    if (url.hostname === 'youtu.be') {
      const shortId = url.pathname.slice(1).split('/')[0];
      return /^[\w-]{11}$/.test(shortId) ? shortId : null;
    }
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) return null;
    if (url.pathname === '/watch') {
      const videoId = url.searchParams.get('v');
      return /^[\w-]{11}$/.test(videoId || '') ? videoId : null;
    }
    const match = url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
