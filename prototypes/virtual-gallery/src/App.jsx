import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Expand, Info, Lightbulb, Map, MoveDown, MoveUp, Settings2, X, ImagePlus, Box, Film, Save, Trash2, Pencil, Upload, Smartphone, List, ExternalLink, UserRound, BookOpen, FileDown, Plus, Check } from 'lucide-react';
import { GalleryScene } from './GalleryScene';
import { DEFAULT_GALLERY, DEFAULT_WORKS, EXHIBITION_ID, GALLERY_STORAGE_KEY, PLACEMENTS, placementsFor, wallAdjustmentLimits, youtubeVideoId } from './gallery-model';
import { deleteAssets, readAsset, writeAssets } from './gallery-storage';
import './intro.css';
import './editor.css';
import './work-options.css';

const ceilings = [
  { value: 'luminous', label: '광천장', detail: '천장 전체가 은은하게 빛나요' },
  { value: 'plain', label: '일반 천장', detail: '깔끔한 화이트 큐브' },
  { value: 'glass', label: '유리천장', detail: '맑은 하늘과 햇빛, 창틀 그림자' },
];
const emptyDraft = { id: null, title: '', year: String(new Date().getFullYear()), description: '', audioFile: null, removedAudioAssetId: null, type: 'image', placementId: '', youtubeUrl: '', file: null, wallAlong: 0, wallHeight: 0, size: 1, presentation: 'frame', canvasThickness: 2.5, canvasEdge: 'image', beamShape: 'circle', beamAngle: 38 };

async function makeMediumImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d', { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('미리보기 이미지를 변환하지 못했습니다.')), 'image/webp', 0.82));
}

function readDraft() {
  try {
    const value = JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY));
    if (value?.gallery && Array.isArray(value.works)) return value;
  } catch { /* Start with the sample exhibition when there is no local draft. */ }
  return { gallery: DEFAULT_GALLERY, works: DEFAULT_WORKS };
}

export function App() {
  const scene = useRef(null);
  const [draft] = useState(readDraft);
  const assetUrlsRef = useRef({});
  const [gallery, setGallery] = useState(draft.gallery);
  const [works, setWorks] = useState(draft.works);
  const [ceiling, setCeiling] = useState('luminous');
  const [lighting, setLighting] = useState('ambient');
  const [room, setRoom] = useState(1);
  const [selectedWork, setSelectedWork] = useState(null);
  const [workListOpen, setWorkListOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [editor, setEditor] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);
  const [editorTab, setEditorTab] = useState('works');
  const [workForm, setWorkForm] = useState(emptyDraft);
  const [spotWorkId, setSpotWorkId] = useState('');
  const [spotForm, setSpotForm] = useState({ beamShape: 'circle', beamAngle: 38 });
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [entryModal, setEntryModal] = useState(() => {
    try {
      const artworkId = new URLSearchParams(window.location.search).get('artwork');
      if (artworkId && draft.works.some((work) => work.id === artworkId)) return null;
      const seenExhibition = localStorage.getItem(`uau-vgallery-exhibition-${EXHIBITION_ID}`) === 'seen';
      return seenExhibition ? (localStorage.getItem('uau-virtual-gallery-intro-v1') === 'seen' ? null : 'controls') : 'exhibition';
    } catch { return 'exhibition'; }
  });
  const [assetUrls, setAssetUrls] = useState({});
  assetUrlsRef.current = assetUrls;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const ids = [...new Set([...works.flatMap((work) => [work.mediumAssetId, work.audioAssetId]), gallery.posterAssetId].filter(Boolean))];
      const next = {};
      for (const id of ids) {
        try { const blob = await readAsset(id); if (blob) next[id] = URL.createObjectURL(blob); } catch { /* Missing local assets are explained in the editor. */ }
      }
      if (alive) setAssetUrls(next); else Object.values(next).forEach(URL.revokeObjectURL);
    };
    load();
    return () => { alive = false; };
  }, []);
  useEffect(() => () => Object.values(assetUrlsRef.current).forEach(URL.revokeObjectURL), []);

  const activeWorks = useMemo(() => works.map((work) => ({ ...work, mediumUrl: assetUrls[work.mediumAssetId] || assetUrls[work.assetId] || work.mediumUrl, originalUrl: assetUrls[work.assetId] || work.originalUrl, audioUrl: assetUrls[work.audioAssetId] || work.audioUrl })), [works, assetUrls]);
  const imageWorks = useMemo(() => activeWorks.filter((work) => work.type === 'image'), [activeWorks]);
  const spotWork = imageWorks.find((work) => work.id === spotWorkId) || imageWorks[0] || null;
  useEffect(() => {
    if (spotWork && spotWork.id !== spotWorkId) setSpotWorkId(spotWork.id);
    if (spotWork) setSpotForm({ beamShape: spotWork.beamShape === 'square' ? 'square' : 'circle', beamAngle: spotWork.beamAngle ?? 38 });
  }, [spotWorkId, spotWork?.id]);
  const spacePreviewWork = useMemo(() => spotWork ? { ...spotWork, ...spotForm } : null, [spotWork, spotForm]);
  const previewWork = useMemo(() => {
    if (!workForm.id) return null;
    const saved = activeWorks.find((work) => work.id === workForm.id);
    return saved ? { ...saved, ...workForm, mediumUrl: saved.mediumUrl, originalUrl: saved.originalUrl } : null;
  }, [activeWorks, workForm]);
  const scenePreviewWork = editorTab === 'space' ? spacePreviewWork : workForm.id ? previewWork : null;
  const adjustmentLimits = wallAdjustmentLimits(workForm.placementId, workForm.size);
  const poster = assetUrls[gallery.posterAssetId] || gallery.posterUrl || '/art/work-1.png';
  const closeControls = useCallback(() => {
    setEntryModal(null);
    try { localStorage.setItem('uau-virtual-gallery-intro-v1', 'seen'); } catch { /* Optional device preference. */ }
  }, []);
  const closeExhibition = useCallback(() => {
    setEntryModal('controls');
    try {
      localStorage.setItem(`uau-vgallery-exhibition-${EXHIBITION_ID}`, 'seen');
      if (localStorage.getItem('uau-virtual-gallery-intro-v1') === 'seen') setEntryModal(null);
    } catch { /* The control guide may still appear on this visit. */ }
  }, []);
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') { setSelectedWork(null); setWorkListOpen(false); setEntryModal(null); const url = new URL(window.location.href); url.searchParams.delete('artwork'); window.history.replaceState(window.history.state, '', url); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const persist = async (nextGallery = gallery, nextWorks = works) => {
    setSaving(true); setNotice('');
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify({ gallery: nextGallery, works: nextWorks }));
      setGallery(nextGallery); setWorks(nextWorks); setNotice('이 브라우저에 저장했어요. 다른 기기나 방문자에게는 아직 공유되지 않습니다.');
    } catch (error) { setNotice(`저장하지 못했어요: ${error.message}`); }
    finally { setSaving(false); }
  };

  const saveWork = async (event) => {
    event.preventDefault();
    if (!workForm.title.trim()) { setNotice('작품명을 입력해 주세요.'); return; }
    if (!workForm.placementId) { setNotice('전시장 위치를 선택해 주세요.'); return; }
    if (workForm.type === 'image' && !workForm.file && !workForm.id) { setNotice('작품 이미지를 선택해 주세요.'); return; }
    const id = workForm.id || `work-${crypto.randomUUID()}`;
    if (workForm.type === 'video' && !youtubeVideoId(workForm.youtubeUrl)) { setNotice('유효한 YouTube 영상 링크를 입력해 주세요.'); return; }
    if (workForm.type === 'object' && workForm.file && workForm.file.size > 25 * 1024 * 1024) { setNotice('3D 모델은 GLB 파일, 25MB 이하로 올려 주세요.'); return; }
    if (workForm.type === 'image' && workForm.file && !workForm.file.type.startsWith('image/')) { setNotice('JPG, PNG, WebP 또는 AVIF 이미지를 선택해 주세요.'); return; }
    if (workForm.type === 'image' && workForm.file && workForm.file.size > 50 * 1024 * 1024) { setNotice('이미지는 50MB 이하로 올려 주세요.'); return; }
    if (workForm.type === 'object' && workForm.file && !workForm.file.name.toLowerCase().endsWith('.glb')) { setNotice('현재는 단일 파일 형식인 GLB 모델만 업로드할 수 있어요.'); return; }
    if (workForm.audioFile && !/\.(mp3|m4a|aac|wav)$/i.test(workForm.audioFile.name)) { setNotice('오디오 가이드는 MP3, M4A, AAC 또는 WAV 파일로 올려 주세요.'); return; }
    if (workForm.audioFile && workForm.audioFile.size > 30 * 1024 * 1024) { setNotice('오디오 파일은 30MB 이하로 올려 주세요.'); return; }
    try {
      let assetId = workForm.assetId;
      let mediumAssetId = workForm.mediumAssetId;
      let audioAssetId = workForm.audioAssetId;
      let audioFileName = workForm.audioFileName;
      let mediumBlob;
      const assets = [];
      if (workForm.file) {
        assetId = id;
        assets.push({ id, blob: workForm.file });
        if (workForm.type === 'image') { mediumAssetId = `${id}-medium`; mediumBlob = await makeMediumImage(workForm.file); assets.push({ id: mediumAssetId, blob: mediumBlob }); }
      }
      if (workForm.audioFile) { audioAssetId = `${id}-audio-${crypto.randomUUID()}`; audioFileName = workForm.audioFile.name; assets.push({ id: audioAssetId, blob: workForm.audioFile }); }
      if (assets.length) await writeAssets(assets);
      const spot = PLACEMENTS.find((item) => item.id === workForm.placementId);
      const limits = wallAdjustmentLimits(spot.id, workForm.size);
      const next = { id, title: workForm.title.trim(), year: workForm.year.trim(), description: workForm.description.trim(), audioAssetId: audioAssetId || null, audioFileName: audioFileName || '', type: workForm.type, placementId: spot.id, room: spot.room, assetId: workForm.type === 'video' ? null : assetId, mediumAssetId: workForm.type === 'image' ? mediumAssetId : null, videoId: workForm.type === 'video' ? youtubeVideoId(workForm.youtubeUrl) : undefined, youtubeUrl: workForm.type === 'video' ? workForm.youtubeUrl : undefined, mediumUrl: workForm.type === 'image' && !assetId ? workForm.mediumUrl : undefined, originalUrl: workForm.type === 'image' && !assetId ? workForm.originalUrl : undefined, size: Math.min(1.3, Math.max(0.65, Number(workForm.size) || 1)), wallAlong: Math.min(limits.along, Math.max(-limits.along, Number(workForm.wallAlong) || 0)), wallHeight: Math.min(limits.height, Math.max(-limits.height, Number(workForm.wallHeight) || 0)), presentation: workForm.type === 'image' ? workForm.presentation : undefined, canvasThickness: workForm.presentation === 'canvas' ? (Number(workForm.canvasThickness) === 5 ? 5 : 2.5) : undefined, canvasEdge: workForm.presentation === 'canvas' ? (['image', 'white', 'black'].includes(workForm.canvasEdge) ? workForm.canvasEdge : 'image') : undefined, frame: workForm.type === 'image' ? workForm.presentation === 'frame' : undefined, beamShape: workForm.beamShape === 'square' ? 'square' : 'circle', beamAngle: Math.min(50, Math.max(18, Number(workForm.beamAngle) || 38)) };
      const nextWorks = workForm.id ? works.map((item) => item.id === id ? next : item) : [...works, next];
      await persist(gallery, nextWorks);
      const obsoleteAudioId = workForm.removedAudioAssetId || (workForm.audioFile && workForm.audioAssetId !== audioAssetId ? workForm.audioAssetId : null);
      if (obsoleteAudioId) {
        await deleteAssets([obsoleteAudioId]);
        setAssetUrls((previous) => { if (previous[obsoleteAudioId]) URL.revokeObjectURL(previous[obsoleteAudioId]); const updated = { ...previous }; delete updated[obsoleteAudioId]; return updated; });
      }
      setWorkForm(emptyDraft);
      if ((assetId && workForm.file) || workForm.audioFile) setAssetUrls((prev) => ({ ...prev, ...(assetId && workForm.file ? { [assetId]: URL.createObjectURL(workForm.file) } : {}), ...(mediumBlob ? { [mediumAssetId]: URL.createObjectURL(mediumBlob) } : {}), ...(workForm.audioFile ? { [audioAssetId]: URL.createObjectURL(workForm.audioFile) } : {}) }));
    } catch (error) { setNotice(`파일을 저장하지 못했어요: ${error.message}`); }
  };

  const editWork = (work) => setWorkForm({ ...emptyDraft, ...work, presentation: work.presentation || (work.frame === false ? 'none' : 'frame'), canvasThickness: work.canvasThickness ?? 2.5, canvasEdge: work.canvasEdge || 'image', file: null, audioFile: null, youtubeUrl: work.youtubeUrl || '', placementId: work.placementId || '', wallAlong: work.wallAlong ?? 0, wallHeight: work.wallHeight ?? 0, size: work.size ?? 1, beamShape: work.beamShape === 'square' ? 'square' : 'circle', beamAngle: work.beamAngle ?? 38 });
  const saveSpotSettings = async () => {
    if (!spotWork) return;
    const nextWorks = works.map((work) => work.id === spotWork.id ? { ...work, ...spotForm } : work);
    await persist(gallery, nextWorks);
  };
  const deleteWork = async (work) => {
    if (!window.confirm(`‘${work.title}’을(를) 전시에서 뺄까요?`)) return;
    await persist(gallery, works.filter((item) => item.id !== work.id));
    const assetIds = [work.assetId, work.mediumAssetId, work.audioAssetId].filter(Boolean);
    try { await deleteAssets(assetIds); } catch (error) { setNotice(`작품은 제거했지만 저장 파일 정리를 마치지 못했어요: ${error.message}`); }
    setAssetUrls((previous) => {
      assetIds.forEach((id) => { if (previous[id]) URL.revokeObjectURL(previous[id]); });
      const next = { ...previous }; assetIds.forEach((id) => delete next[id]); return next;
    });
    if (workForm.id === work.id) setWorkForm(emptyDraft);
  };
  const savePoster = async (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setNotice('포스터 이미지는 20MB 이하로 올려 주세요.'); return; }
    const id = `poster-${EXHIBITION_ID}`;
    try { await writeAssets([{ id, blob: file }]); const next = { ...gallery, posterAssetId: id }; await persist(next, works); setAssetUrls((prev) => ({ ...prev, [id]: URL.createObjectURL(file) })); }
    catch (error) { setNotice(`포스터를 저장하지 못했어요: ${error.message}`); }
  };
  const filePicker = (accept, onFile) => <label className="file-drop"><Upload size={20}/><strong>파일 선택</strong><span>{accept}</span><input type="file" accept={accept.startsWith('GLB') ? '.glb,model/gltf-binary' : 'image/jpeg,image/png,image/webp,image/avif'} onChange={(event) => onFile(event.target.files?.[0] || null)}/></label>;
  const audioPicker = <label className="file-drop"><Upload size={20}/><strong>녹음 파일 선택</strong><span>MP3 · M4A · AAC · WAV · 최대 30MB</span><input type="file" accept=".mp3,.m4a,.aac,.wav,audio/mpeg,audio/mp4,audio/aac,audio/wav" onChange={(event) => setWorkForm({ ...workForm, audioFile: event.target.files?.[0] || null, removedAudioAssetId: null })}/></label>;

  const enterRoom = (next) => { setRoom(next); scene.current?.goToRoom(next); };
  const openWork = async (work, { updateUrl = true } = {}) => {
    setSelectedWork(work);
    if (updateUrl) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('artwork', work.id);
      window.history.pushState({ uauArtwork: work.id }, '', nextUrl);
    }
    if (work.type !== 'image' || !work.assetId || assetUrls[work.assetId]) return;
    try {
      const blob = await readAsset(work.assetId);
      if (blob) setAssetUrls((prev) => prev[work.assetId] ? prev : ({ ...prev, [work.assetId]: URL.createObjectURL(blob) }));
    } catch { setNotice('원본 파일을 브라우저 저장소에서 찾지 못했어요.'); }
  };
  const closeWork = (updateUrl = true) => {
    setSelectedWork(null);
    if (updateUrl && new URLSearchParams(window.location.search).has('artwork')) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('artwork');
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  };
  useEffect(() => {
    const artworkId = new URLSearchParams(window.location.search).get('artwork');
    if (!artworkId) return;
    const work = works.find((item) => item.id === artworkId);
    if (work) openWork(work, { updateUrl: false });
  }, [works]);
  useEffect(() => {
    const onPopState = () => {
      const id = new URLSearchParams(window.location.search).get('artwork');
      const work = works.find((item) => item.id === id);
      if (work) openWork(work, { updateUrl: false });
      else closeWork(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [works, assetUrls]);
  const artworkUrl = (work) => {
    const url = new URL(window.location.href);
    url.searchParams.set('artwork', work.id);
    return url.toString();
  };
  const workTypeLabel = (type) => ({ image: '이미지', object: '3D 오브제', video: '영상' })[type] || '작품';
  const availablePlacements = placementsFor(workForm.type, works, workForm.id);
  const profileChecklist = [
    { label: '작가 소개', done: Boolean(gallery.artistBio?.trim()) },
    { label: '작가 노트', done: Boolean(gallery.artistStatement?.trim()) },
    { label: '대표 작품 3점', done: works.filter((work) => work.type === 'image').length >= 3 },
    { label: '활동 이력', done: Boolean(gallery.artistCv?.trim()) },
  ];
  const profileProgress = Math.round(profileChecklist.filter((item) => item.done).length / profileChecklist.length * 100);
  const addArchiveEntry = () => setGallery((value) => ({ ...value, studioArchive: [...(value.studioArchive || []), { id: crypto.randomUUID(), title: '', note: '' }] }));
  const updateArchiveEntry = (id, key, value) => setGallery((current) => ({ ...current, studioArchive: (current.studioArchive || []).map((entry) => entry.id === id ? { ...entry, [key]: value } : entry) }));
  const removeArchiveEntry = (id) => setGallery((current) => ({ ...current, studioArchive: (current.studioArchive || []).filter((entry) => entry.id !== id) }));
  const exportPortfolio = () => {
    const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    const rows = works.filter((work) => work.type === 'image').map((work) => `<article><img src="${escapeHtml(work.mediumUrl || work.originalUrl || '')}"/><h2>${escapeHtml(work.title)}</h2><p>${escapeHtml([work.year, work.description].filter(Boolean).join(' · '))}</p></article>`).join('');
    const page = `<!doctype html><html lang="ko"><meta charset="utf-8"><title>${escapeHtml(gallery.artist)} · Portfolio</title><style>@page{margin:18mm}*{box-sizing:border-box}body{font:14px/1.7 Arial,sans-serif;color:#24231f;margin:0}header{padding:20mm 0 12mm;border-bottom:1px solid #aaa}small{letter-spacing:.18em;color:#3150d8}h1{font:48px/1.15 Georgia,serif;margin:12px 0}header p{white-space:pre-line;color:#68645d}section{padding:12mm 0}h2{font:24px Georgia,serif} .works{display:grid;grid-template-columns:1fr 1fr;gap:12mm 8mm}article{break-inside:avoid}article img{width:100%;height:70mm;object-fit:contain;background:#f2f0eb}article h2{font-size:18px;margin:8px 0 0}article p{color:#69655f;font-size:12px}@media print{button{display:none}}</style><body><header><small>U.A.U · ARTIST PORTFOLIO</small><h1>${escapeHtml(gallery.artist)}</h1><p>${escapeHtml(gallery.artistBio || '')}</p><p>${escapeHtml(gallery.artistStatement || '')}</p></header><section><h2>Selected Works</h2><div class="works">${rows}</div></section><section><h2>CV / Exhibition History</h2><p>${escapeHtml(gallery.artistCv || '')}</p></section><script>window.onload=()=>setTimeout(()=>window.print(),500)</script></body></html>`;
    const popup = window.open('', '_blank');
    if (!popup) { setNotice('팝업이 차단됐어요. 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요.'); return; }
    popup.document.open(); popup.document.write(page); popup.document.close();
  };

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#home" aria-label="U.A.U 홈">U<span>·</span>A<span>·</span>U</a>
      <div className="exhibition-heading"><span className="eyebrow">VIRTUAL EXHIBITION · 2 ROOMS</span><div><strong>{gallery.title}</strong><span className="heading-divider"/>{gallery.artist}</div></div>
      <div className="top-actions"><span className="draft-label">로컬 시제품 · 이 브라우저에만 저장</span><button className={`exhibition-info-button ${mobilePreview ? 'selected' : ''}`} onClick={() => { setMobilePreview((active) => { setEditor(active); setSettingsOpen(active); return !active; }); }} aria-pressed={mobilePreview}><Smartphone size={15}/><span>{mobilePreview ? '모바일 미리보기 끄기' : '모바일 미리보기'}</span></button><button className="exhibition-info-button" onClick={() => setEntryModal('exhibition')}><Info size={15}/><span>전시 정보</span></button><button className="mode-toggle" onClick={() => { setEditor(!editor); setSettingsOpen(!editor); }}>{editor ? '방문자 화면 보기' : '편집 화면으로'}</button></div>
    </header>

    <main className={`gallery-stage ${editor && settingsOpen ? 'settings-active' : ''} ${mobilePreview ? 'mobile-preview' : ''}`}>
      <GalleryScene ref={scene} ceiling={ceiling} lighting={lighting} room={room} onRoomChange={setRoom} onArtworkClick={openWork} works={activeWorks} previewWork={scenePreviewWork} exhibitionTitle={gallery.title} artistName={gallery.artist} exhibitionDescription={gallery.description}/>
      <div className="scene-vignette" aria-hidden="true"/>
      <div className="scene-caption"><span className="eyebrow">U.A.U APPROVED ARTIST · SAMPLE EXHIBITION</span><h1>{gallery.title}</h1><p>{gallery.artist}의 가상 전시장 · 작품 {works.length}점</p>{gallery.studioArchive?.some((entry) => entry.title || entry.note) && <button className="archive-open-button" onClick={() => setArchiveOpen(true)}><BookOpen size={14}/> Studio Archive 보기</button>}</div>
      <div className="room-indicator">ROOM {String(room).padStart(2, '0')} <span>/ 02</span></div>

      {editor && <>
        {!settingsOpen && <button className="settings-reopen floating-button" onClick={() => setSettingsOpen(true)}><Settings2 size={17}/> 전시 편집</button>}
        {settingsOpen && <aside className="settings-panel editor-panel" aria-label="전시 편집">
          <div className="panel-head"><div><span className="eyebrow">EXHIBITION EDITOR</span><h2>전시 편집</h2></div><button className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="편집 닫기"><X size={18}/></button></div>
          <div className="editor-tabs" role="tablist"><button className={editorTab === 'works' ? 'active' : ''} onClick={() => setEditorTab('works')}><ImagePlus size={15}/> 작품·배치</button><button className={editorTab === 'profile' ? 'active' : ''} onClick={() => setEditorTab('profile')}><UserRound size={15}/> 작가 페이지</button><button className={editorTab === 'archive' ? 'active' : ''} onClick={() => setEditorTab('archive')}><BookOpen size={15}/> 작업 아카이브</button><button className={editorTab === 'info' ? 'active' : ''} onClick={() => setEditorTab('info')}><Info size={15}/> 전시 정보</button><button className={editorTab === 'space' ? 'active' : ''} onClick={() => setEditorTab('space')}><Lightbulb size={15}/> 공간 연출</button></div>
          {editorTab === 'works' && <div className="editor-scroll">
            <div className="editor-intro"><strong>작품을 놓고 싶은 곳을 직접 골라보세요.</strong><span>{works.length}/9점 · 변경 사항은 이 브라우저에 저장됩니다.</span></div>
            <div className="work-list">{works.map((work) => <article className={`work-row ${workForm.id === work.id ? 'editing' : ''}`} key={work.id}><div className="work-type-icon">{work.type === 'object' ? <Box size={17}/> : work.type === 'video' ? <Film size={17}/> : <ImagePlus size={17}/>}</div><div className="work-row-copy"><strong>{work.title}</strong><span>{workTypeLabel(work.type)} · {PLACEMENTS.find((item) => item.id === work.placementId)?.label || '위치 미지정'}</span></div><button className="tiny-icon" onClick={() => editWork(work)} aria-label={`${work.title} 편집`}><Pencil size={15}/></button><button className="tiny-icon danger" onClick={() => deleteWork(work)} aria-label={`${work.title} 삭제`}><Trash2 size={15}/></button></article>)}</div>
            {works.length < 9 && <form className="work-form" onSubmit={saveWork}>
              <div className="form-title-row"><h3>{workForm.id ? '작품 정보 수정' : '작품 추가'}</h3>{workForm.id && <button type="button" className="text-button" onClick={() => setWorkForm(emptyDraft)}>취소</button>}</div>
              {!workForm.id && <div className="type-pills"><button type="button" className={workForm.type === 'image' ? 'active' : ''} onClick={() => setWorkForm({ ...emptyDraft, type: 'image' })}><ImagePlus size={15}/> 이미지</button><button type="button" className={workForm.type === 'object' ? 'active' : ''} onClick={() => setWorkForm({ ...emptyDraft, type: 'object' })}><Box size={15}/> 3D 오브제</button><button type="button" className={workForm.type === 'video' ? 'active' : ''} onClick={() => setWorkForm({ ...emptyDraft, type: 'video' })}><Film size={15}/> YouTube</button></div>}
              <label className="field-label">작품명<input value={workForm.title} onChange={(event) => setWorkForm({ ...workForm, title: event.target.value })} placeholder="예: 빛의 정원" maxLength={80}/></label>
              <div className="field-pair"><label className="field-label">제작 연도<input value={workForm.year} onChange={(event) => setWorkForm({ ...workForm, year: event.target.value })} placeholder="2026" maxLength={10}/></label><label className="field-label">전시 위치<select value={workForm.placementId} onChange={(event) => setWorkForm({ ...workForm, placementId: event.target.value, wallAlong: 0, wallHeight: 0 })}><option value="">위치 선택</option>{availablePlacements.map((spot) => <option key={spot.id} value={spot.id}>{spot.label}</option>)}</select></label></div>
              {workForm.type === 'image' && <div className="work-options">
                <div className="work-options-heading"><strong>벽면 배치</strong><span>슬라이더를 움직이면 미리보기에 바로 보여요.</span></div>
                <label className="range-control"><span>벽을 따라 <output>{Number(workForm.wallAlong || 0).toFixed(1)} m</output></span><input type="range" min={-adjustmentLimits.along} max={adjustmentLimits.along} step="0.05" value={Math.min(adjustmentLimits.along, Math.max(-adjustmentLimits.along, Number(workForm.wallAlong) || 0))} disabled={!workForm.placementId || adjustmentLimits.along === 0} onChange={(event) => setWorkForm({ ...workForm, wallAlong: Number(event.target.value) })}/></label>
                <label className="range-control"><span>걸이 높이 <output>{Number(workForm.wallHeight || 0).toFixed(1)} m</output></span><input type="range" min={-adjustmentLimits.height} max={adjustmentLimits.height} step="0.05" value={Math.min(adjustmentLimits.height, Math.max(-adjustmentLimits.height, Number(workForm.wallHeight) || 0))} disabled={!workForm.placementId || adjustmentLimits.height === 0} onChange={(event) => setWorkForm({ ...workForm, wallHeight: Number(event.target.value) })}/></label>
                <label className="range-control"><span>작품 크기 <output>{Math.round(Number(workForm.size || 1) * 100)}%</output></span><input type="range" min="0.65" max="1.3" step="0.05" value={workForm.size || 1} onChange={(event) => setWorkForm({ ...workForm, size: Number(event.target.value) })}/></label>
                <div className="option-control"><span>작품 표현</span><div className="choice-switch presentation-switch"><button type="button" className={workForm.presentation === 'frame' ? 'selected' : ''} onClick={() => setWorkForm({ ...workForm, presentation: 'frame' })}>기본 액자</button><button type="button" className={workForm.presentation === 'none' ? 'selected' : ''} onClick={() => setWorkForm({ ...workForm, presentation: 'none' })}>무액자</button><button type="button" className={workForm.presentation === 'canvas' ? 'selected' : ''} onClick={() => setWorkForm({ ...workForm, presentation: 'canvas' })}>캔버스</button></div></div>
                {workForm.presentation === 'canvas' && <div className="canvas-options"><div className="option-control"><span>캔버스 두께</span><div className="choice-switch"><button type="button" className={Number(workForm.canvasThickness) === 2.5 ? 'selected' : ''} onClick={() => setWorkForm({ ...workForm, canvasThickness: 2.5 })}>2.5 cm</button><button type="button" className={Number(workForm.canvasThickness) === 5 ? 'selected' : ''} onClick={() => setWorkForm({ ...workForm, canvasThickness: 5 })}>5 cm</button></div></div><div className="option-control"><span>캔버스 옆면 마감</span><div className="choice-switch edge-switch"><button type="button" className={workForm.canvasEdge === 'image' ? 'selected' : ''} onClick={() => setWorkForm({ ...workForm, canvasEdge: 'image' })}>그림 연장</button><button type="button" className={workForm.canvasEdge === 'white' ? 'selected' : ''} onClick={() => setWorkForm({ ...workForm, canvasEdge: 'white' })}>흰색</button><button type="button" className={workForm.canvasEdge === 'black' ? 'selected' : ''} onClick={() => setWorkForm({ ...workForm, canvasEdge: 'black' })}>검정</button></div><small>그림 연장은 이미지 가장자리 색을 옆면으로 이어 표현해요.</small></div></div>}
              </div>}
              {workForm.type === 'image' && <>{filePicker('JPG · PNG · WebP · AVIF · 최대 50MB', (file) => setWorkForm({ ...workForm, file }))}{workForm.file && <p className="file-selected">선택: {workForm.file.name}</p>}</>}
              {workForm.type === 'object' && <>{filePicker('GLB · 최대 25MB · 바닥 받침대에 전시', (file) => setWorkForm({ ...workForm, file }))}<p className="field-note">모델 크기는 자동으로 맞추고 바닥 받침대에 배치합니다.</p>{workForm.file && <p className="file-selected">선택: {workForm.file.name}</p>}</>}
              {workForm.type === 'video' && <label className="field-label">YouTube 링크<input type="url" value={workForm.youtubeUrl} onChange={(event) => setWorkForm({ ...workForm, youtubeUrl: event.target.value })} placeholder="https://youtu.be/..."/></label>}
              <label className="field-label">작품 설명<textarea rows="2" value={workForm.description} onChange={(event) => setWorkForm({ ...workForm, description: event.target.value })} placeholder="작품을 소개해 주세요." maxLength={500}/></label>
              <div className="audio-upload-field"><strong>오디오 가이드 녹음</strong><span>작가가 직접 녹음한 작품 소개를 올려 주세요.</span>{audioPicker}{workForm.audioFile ? <p className="file-selected">선택: {workForm.audioFile.name}<button type="button" className="text-button" onClick={() => setWorkForm({ ...workForm, audioFile: null })}>선택 취소</button></p> : workForm.audioAssetId ? <p className="file-selected">등록됨: {workForm.audioFileName || '오디오 가이드'}<button type="button" className="text-button" onClick={() => setWorkForm({ ...workForm, audioAssetId: null, audioFileName: '', removedAudioAssetId: workForm.audioAssetId })}>오디오 삭제</button></p> : <p className="field-note">아직 등록된 오디오가 없어요.</p>}</div>
              <div className="form-actions"><button className="primary-button compact" type="submit" disabled={saving}><Save size={15}/>{workForm.id ? '작품 저장' : '작품 추가'}</button>{workForm.id && <button className="text-button" type="button" onClick={() => setWorkForm(emptyDraft)}>닫기</button>}</div>
            </form>}
            {works.length >= 9 && <p className="limit-note">작품은 최대 9점까지 배치할 수 있어요.</p>}
            {notice && <p className="editor-notice" role="status">{notice}</p>}
          </div>}
          {editorTab === 'info' && <div className="editor-scroll">
            <div className="editor-intro"><strong>공유 링크를 열었을 때 관람객에게 보여줄 전시 소개입니다.</strong></div>
            <label className="field-label">전시명<input value={gallery.title} onChange={(event) => setGallery({ ...gallery, title: event.target.value })} maxLength={80}/></label>
            <label className="field-label">작가명<input value={gallery.artist} onChange={(event) => setGallery({ ...gallery, artist: event.target.value })} maxLength={80}/></label>
            <label className="field-label">전시장·장소<input value={gallery.venue} onChange={(event) => setGallery({ ...gallery, venue: event.target.value })} maxLength={100}/></label>
            <label className="field-label">전시 기간<input value={gallery.period} onChange={(event) => setGallery({ ...gallery, period: event.target.value })} placeholder="예: 2026. 9. 1. – 10. 31." maxLength={100}/></label>
            <label className="field-label">전시 소개<textarea rows="4" value={gallery.description} onChange={(event) => setGallery({ ...gallery, description: event.target.value })} maxLength={800}/></label>
            <p className="field-note">전시명·작가명·소개는 1룸 입구 쪽 왼쪽 벽 안내판에 표시되고, U.A.U 표식도 함께 들어갑니다.</p>
            <div className="poster-editor"><div><strong>전시 포스터</strong><span>팝업에 표시할 대표 이미지를 선택하세요.</span></div>{filePicker('JPG · PNG · WebP · 최대 20MB', savePoster)}<img src={poster} alt="현재 전시 포스터 미리보기"/></div>
            <button className="primary-button compact full-button" onClick={() => persist(gallery, works)} disabled={saving}><Save size={15}/> 전시 정보 저장</button>
            {notice && <p className="editor-notice" role="status">{notice}</p>}
          </div>}
          {editorTab === 'profile' && <div className="editor-scroll profile-editor">
            <div className="editor-intro"><strong>작가 페이지를 나답게 구성해요.</strong><span>입력한 내용은 이 브라우저에 저장되며, 공개 전 미리보기할 수 있어요.</span></div>
            <section className="profile-progress"><div className="profile-progress-heading"><strong>작가 프로필 준비도</strong><b>{profileProgress}%</b></div><div className="progress-track"><i style={{ width: `${profileProgress}%` }}/></div><ul>{profileChecklist.map((item) => <li key={item.label} className={item.done ? 'done' : ''}>{item.done ? <Check size={14}/> : <span/>}{item.label}</li>)}</ul><small>준비도는 참고용이에요. 기본 기능을 제한하지 않습니다.</small></section>
            <label className="field-label">짧은 소개<textarea rows="3" value={gallery.artistBio || ''} onChange={(event) => setGallery({ ...gallery, artistBio: event.target.value })} placeholder="작업과 자신을 간결하게 소개해 주세요." maxLength={500}/></label>
            <label className="field-label">작가 노트<textarea rows="5" value={gallery.artistStatement || ''} onChange={(event) => setGallery({ ...gallery, artistStatement: event.target.value })} placeholder="작업의 출발점, 관심사, 재료와 과정을 들려주세요." maxLength={3000}/><small className="char-count">{(gallery.artistStatement || '').length} / 3,000자</small></label>
            <label className="field-label">전시·활동 이력<textarea rows="5" value={gallery.artistCv || ''} onChange={(event) => setGallery({ ...gallery, artistCv: event.target.value })} placeholder={'2025 개인전 〈전시명〉, 공간명\n2024 단체전 〈전시명〉, 공간명'} maxLength={3000}/></label>
            <div className="profile-style-block"><strong>페이지 분위기</strong><span>색과 작품 배열을 선택해 보세요.</span><div className="theme-choices">{[{id:'paper',name:'웜 페이퍼',color:'#f4f0e7'},{id:'gallery',name:'화이트 갤러리',color:'#f8f8f5'},{id:'ink',name:'잉크 그레이',color:'#deddd8'}].map((theme) => <button key={theme.id} className={(gallery.profileTheme || 'paper') === theme.id ? 'selected' : ''} onClick={() => setGallery({ ...gallery, profileTheme: theme.id })}><i style={{background:theme.color}}/><span>{theme.name}</span></button>)}</div><label className="field-label">작품 배열<select value={gallery.profileLayout || 'editorial'} onChange={(event) => setGallery({ ...gallery, profileLayout: event.target.value })}><option value="editorial">매거진형 · 비대칭 그리드</option><option value="wall">전시벽면형 · 가로 감상</option><option value="catalog">아카이브형 · 단정한 목록</option></select></label><div className={`profile-layout-preview ${gallery.profileLayout || 'editorial'}`} aria-label="작품 배열 미리보기"><i/><i/><i/><i/><span>{gallery.artist || '작가 페이지'} · 페이지 레이아웃 미리보기</span></div><div className={`artist-page-preview ${gallery.profileTheme || 'paper'}`}><span className="eyebrow">ARTIST PAGE PREVIEW</span><h3>{gallery.artist || '작가명'}</h3><p>{gallery.artistBio || '짧은 작가 소개가 이곳에 보여요.'}</p><div>{imageWorks.slice(0, 3).map((work) => <img key={work.id} src={work.mediumUrl || work.originalUrl} alt=""/>)}{imageWorks.length === 0 && <i/>}</div></div></div>
            <button className="primary-button compact full-button" onClick={() => persist(gallery, works)} disabled={saving}><Save size={15}/> 작가 페이지 저장</button>
            <button className="secondary-action full-button" onClick={exportPortfolio}><FileDown size={16}/> 포트폴리오 PDF 만들기</button><p className="field-note">인쇄 창에서 ‘PDF로 저장’을 선택하세요. 현재 등록된 작품과 소개를 사용합니다.</p>
            {notice && <p className="editor-notice" role="status">{notice}</p>}
          </div>}
          {editorTab === 'archive' && <div className="editor-scroll">
            <div className="editor-intro"><strong>완성작이 되기 전의 과정도 기록해 보세요.</strong><span>스케치, 재료 실험, 작업 중 메모 등을 선택적으로 소개할 수 있어요. 아직 공개되지 않는 로컬 시제품입니다.</span></div>
            {(gallery.studioArchive || []).map((entry, index) => <article className="archive-entry" key={entry.id}><div className="form-title-row"><h3>기록 {String(index + 1).padStart(2, '0')}</h3><button className="tiny-icon danger" onClick={() => removeArchiveEntry(entry.id)} aria-label="기록 삭제"><Trash2 size={15}/></button></div><label className="field-label">기록 제목<input value={entry.title} onChange={(event) => updateArchiveEntry(entry.id, 'title', event.target.value)} placeholder="예: 색을 찾던 날" maxLength={80}/></label><label className="field-label">과정 메모<textarea rows="3" value={entry.note} onChange={(event) => updateArchiveEntry(entry.id, 'note', event.target.value)} placeholder="이 과정에서 발견한 점을 적어보세요." maxLength={1000}/></label></article>)}
            <button className="secondary-action full-button" onClick={addArchiveEntry}><Plus size={16}/> 과정 기록 추가</button><button className="primary-button compact full-button" onClick={() => persist(gallery, works)} disabled={saving}><Save size={15}/> 아카이브 저장</button>{notice && <p className="editor-notice" role="status">{notice}</p>}
          </div>}
          {editorTab === 'space' && <div className="editor-scroll">
            <section><div className="section-title"><span>01</span><h3>천장 디자인</h3></div><p className="section-help">두 전시실에 동일하게 적용됩니다.</p><div className="ceiling-options">{ceilings.map((item) => <button key={item.value} className={`ceiling-choice ${ceiling === item.value ? 'selected' : ''}`} onClick={() => setCeiling(item.value)} aria-pressed={ceiling === item.value}><span className={`ceiling-swatch ${item.value}`}/><span className="choice-name">{item.label}</span></button>)}</div><p className="selected-description">{ceilings.find((item) => item.value === ceiling).detail}</p></section>
            <section><div className="section-title"><span>02</span><h3>조명 방식</h3></div><p className="section-help">전체 조명은 공간을 고르게 밝히고, 작품 집중은 각 작품의 빔 설정을 사용해요.</p><div className="lighting-options"><button className={lighting === 'ambient' ? 'selected' : ''} onClick={() => setLighting('ambient')} aria-pressed={lighting === 'ambient'}><Expand size={19}/><strong>전체 조명</strong><small>공간 전체를 고르게 밝힘</small></button><button className={lighting === 'focused' ? 'selected' : ''} onClick={() => setLighting('focused')} aria-pressed={lighting === 'focused'}><Lightbulb size={19}/><strong>작품 집중</strong><small>설정한 작품별 스포트 사용</small></button></div><div className="temperature-note"><span className="temperature-dot"/><span>색온도 <strong>6000K 고정</strong></span><Info size={15}/></div></section>
            <section className="spot-editor"><div className="section-title"><span>03</span><h3>작품별 집중 조명</h3></div><p className="section-help">작품마다 빔 모양과 조사각을 따로 조정합니다. 원형은 둥근 빛, 사각형은 액자처럼 각진 빛으로 비춰요.</p>{spotWork ? <><label className="field-label">조명을 설정할 작품<select value={spotWork.id} onChange={(event) => setSpotWorkId(event.target.value)}>{imageWorks.map((work) => <option key={work.id} value={work.id}>{work.title} · {PLACEMENTS.find((item) => item.id === work.placementId)?.label || ''}</option>)}</select></label><div className="beam-choices"><button type="button" className={`beam-choice ${spotForm.beamShape === 'circle' ? 'selected' : ''}`} onClick={() => setSpotForm((value) => ({ ...value, beamShape: 'circle' }))} aria-pressed={spotForm.beamShape === 'circle'}><span className="beam-swatch circle"/><span><strong>원형 빔</strong><small>부드럽게 퍼지는 둥근 조사면</small></span></button><button type="button" className={`beam-choice ${spotForm.beamShape === 'square' ? 'selected' : ''}`} onClick={() => setSpotForm((value) => ({ ...value, beamShape: 'square' }))} aria-pressed={spotForm.beamShape === 'square'}><span className="beam-swatch square"/><span><strong>사각 빔</strong><small>벽면에 또렷한 사각 조사면</small></span></button></div><label className="range-control"><span>조사각 <output>{spotForm.beamAngle}°</output></span><input type="range" min="18" max="50" step="1" value={spotForm.beamAngle} onChange={(event) => setSpotForm((value) => ({ ...value, beamAngle: Number(event.target.value) }))}/></label><p className="spot-preview-note">설정은 장면에 바로 미리 보여요. 저장하면 이 작품의 조명으로 기억됩니다.</p><button className="primary-button compact full-button" onClick={saveSpotSettings} disabled={saving}><Save size={15}/> 이 작품 조명 저장</button></> : <p className="field-note">조명을 설정할 회화 작품을 먼저 작품·배치에서 추가해 주세요.</p>}</section>
            <p className="panel-footer"><span className="status-dot"/> 천장과 조명 방식은 전체 전시에, 빔 모양과 각도는 선택한 작품에 적용됩니다.</p>
          </div>}
        </aside>}
      </>}

      {mapOpen ? <div className="room-map" aria-label="전시장 지도"><div className="map-head"><span><Map size={14}/> 전시장 지도</span><button onClick={() => setMapOpen(false)} aria-label="지도 닫기"><X size={15}/></button></div><div className="map-rooms"><button className={room === 1 ? 'current' : ''} onClick={() => enterRoom(1)}><span className="map-room-box"><i/><i/><i/></span><span>ROOM 01</span></button><span className="map-door"/><button className={room === 2 ? 'current' : ''} onClick={() => enterRoom(2)}><span className="map-room-box"><i/><i/><i/></span><span>ROOM 02</span></button></div><p>공간을 드래그해 둘러보고 클릭해 이동하세요.</p></div> : <button className="map-reopen floating-button" onClick={() => setMapOpen(true)}><Map size={17}/> 지도</button>}
      <div className="movement-controls" aria-label="이동 조작"><button onClick={() => scene.current?.turn(-1)} aria-label="왼쪽 보기"><ArrowLeft size={18}/></button><button onClick={() => scene.current?.moveForward()} aria-label="바라보는 방향으로 이동"><MoveUp size={19}/></button><button onClick={() => scene.current?.moveBackward()} aria-label="뒤로 이동"><MoveDown size={19}/></button><button onClick={() => scene.current?.turn(1)} aria-label="오른쪽 보기"><ArrowRight size={18}/></button></div>
      <button className="help-button" onClick={() => setEntryModal('controls')} aria-label="조작 도움말">?</button>
      <div className="room-next">{room === 1 ? <button onClick={() => enterRoom(2)}>다음 공간으로 <ChevronRight size={17}/></button> : <button onClick={() => enterRoom(1)}><ArrowLeft size={17}/> 첫 번째 공간으로</button>}</div>
      <button className="mobile-work-list-button" onClick={() => setWorkListOpen(true)}><List size={16}/> 작품 목록 <span>{works.length}</span></button>
    </main>

    {selectedWork && <div className="modal-backdrop" onClick={() => closeWork()}><div className="art-modal" role="dialog" aria-modal="true" aria-label={`${selectedWork.title} 작품 상세`} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => closeWork()} aria-label="닫기"><X size={20}/></button><div className="art-image-wrap">{selectedWork.type === 'video' ? <iframe src={`https://www.youtube-nocookie.com/embed/${selectedWork.videoId}?autoplay=1`} title={selectedWork.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/> : selectedWork.type === 'object' ? <div className="object-note"><Box size={28}/>3D 오브제는 받침대에서 감상해 주세요.</div> : <img src={assetUrls[selectedWork.assetId] || selectedWork.originalUrl || selectedWork.mediumUrl} alt={selectedWork.title}/>}</div><div className="art-information"><span className="eyebrow">{gallery.artist} · ROOM {String(selectedWork.room || 1).padStart(2, '0')}</span><h2>{selectedWork.title}</h2><p>{gallery.artist} · {selectedWork.year}</p>{selectedWork.description && <p>{selectedWork.description}</p>}{selectedWork.audioAssetId && (assetUrls[selectedWork.audioAssetId] || selectedWork.audioUrl) && <audio className="art-audio-player" controls preload="none" src={assetUrls[selectedWork.audioAssetId] || selectedWork.audioUrl} aria-label={`${selectedWork.title} 오디오 가이드`}>이 브라우저는 오디오 재생을 지원하지 않습니다.</audio>}<a className="work-link-button" href={artworkUrl(selectedWork)} target="_blank" rel="noreferrer"><ExternalLink size={16}/> 이 작품 바로가기</a><small className="work-link-note">새 탭에서 이 작품 상세를 바로 엽니다.</small><span>이미지 원본은 작품을 열었을 때 표시됩니다.</span></div></div></div>}
    {workListOpen && <div className="mobile-work-list-backdrop" onClick={() => setWorkListOpen(false)}><section className="mobile-work-list" role="dialog" aria-modal="true" aria-label="작품 목록" onClick={(event) => event.stopPropagation()}><div className="mobile-work-list-head"><div><span className="eyebrow">EXHIBITION WORKS</span><h2>작품 목록</h2></div><button className="icon-button" onClick={() => setWorkListOpen(false)} aria-label="작품 목록 닫기"><X size={19}/></button></div>{works.map((work) => <button className="mobile-work-row" key={work.id} onClick={() => { setWorkListOpen(false); openWork(work); }}><span>ROOM {String(work.room || 1).padStart(2, '0')}</span><strong>{work.title}</strong><ChevronRight size={16}/></button>)}</section></div>}
    {archiveOpen && <div className="modal-backdrop" onClick={() => setArchiveOpen(false)}><section className="archive-modal" role="dialog" aria-modal="true" aria-label="작가 작업 아카이브" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setArchiveOpen(false)} aria-label="아카이브 닫기"><X size={20}/></button><span className="eyebrow">STUDIO ARCHIVE · {gallery.artist}</span><h2>작업의 뒷면</h2><p>완성작에 이르기까지의 생각과 과정을 기록했습니다.</p>{(gallery.studioArchive || []).filter((entry) => entry.title || entry.note).map((entry) => <article key={entry.id}><h3>{entry.title || '작업 노트'}</h3><p>{entry.note}</p></article>)}</section></div>}
    {entryModal && <div className="modal-backdrop intro-backdrop" onClick={entryModal === 'exhibition' ? closeExhibition : closeControls}>
      {entryModal === 'exhibition' ? <div className="exhibition-modal" role="dialog" aria-modal="true" aria-labelledby="exhibition-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={closeExhibition} aria-label="전시 소개 닫기"><X size={20}/></button><div className="exhibition-poster"><img src={poster} alt={`${gallery.title} 포스터`}/><span>U.A.U · VIRTUAL EXHIBITION</span></div><div className="exhibition-info"><span className="eyebrow">VIRTUAL EXHIBITION · 2 ROOMS</span><h2 id="exhibition-title">{gallery.title}</h2><p className="exhibition-artist">{gallery.artist}</p><p className="exhibition-description">{gallery.description}</p><dl><div><dt>장소</dt><dd>{gallery.venue}</dd></div><div><dt>기간</dt><dd>{gallery.period}</dd></div><div><dt>전시</dt><dd>작품 {works.length}점 · 2개 전시실</dd></div></dl><button className="primary-button" onClick={closeExhibition}>전시장 입장 <ChevronRight size={16}/></button><small>다음 방문부터는 이 전시 소개를 자동으로 건너뜁니다.</small></div></div> : <div className="help-modal intro-modal" role="dialog" aria-modal="true" aria-labelledby="intro-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={closeControls} aria-label="안내 닫기"><X size={20}/></button><span className="eyebrow">A SHORT GUIDE</span><h2 id="intro-title">전시장을 둘러보세요</h2><p>시선을 움직이고, 보고 싶은 방향으로 걸어가 보세요.</p><ul className="intro-controls"><li><span>시선</span><strong>마우스·손가락 드래그</strong><small>좌우와 상하로 둘러보기</small></li><li><span>이동</span><strong>W / S · ↑ / ↓</strong><small>현재 바라보는 방향으로 앞뒤 이동</small></li><li><span>옆걸음</span><strong>A / D</strong><small>좌우로 이동 · 시선은 그대로 유지</small></li><li><span>회전</span><strong>← / →</strong><small>제자리에서 왼쪽·오른쪽 보기</small></li><li><span>작품</span><strong>벽에 걸린 작품 클릭</strong><small>큰 이미지와 작품 정보 보기</small></li></ul><p className="intro-floor-hint">바닥을 클릭하면 그 지점으로 이동합니다. 안내는 우측 하단 ? 버튼에서 다시 볼 수 있어요.</p><div className="intro-actions"><button className="intro-skip" onClick={closeControls}>안내 건너뛰기</button><button className="primary-button" onClick={closeControls} autoFocus>전시 시작하기</button></div></div>}
    </div>}
  </div>;
}
