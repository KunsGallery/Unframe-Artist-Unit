const DATABASE = 'uau-virtual-gallery-local';
const STORE = 'assets';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('이 브라우저는 로컬 파일 저장을 지원하지 않습니다.')); return; }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('브라우저 저장 공간을 열지 못했습니다.'));
  });
}

export async function readAsset(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(id);
    request.onsuccess = () => { db.close(); resolve(request.result?.blob ?? null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function writeAssets(entries) {
  if (!entries.length) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    entries.forEach(({ id, blob }) => store.put({ id, blob }));
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('파일을 브라우저에 저장하지 못했습니다.')); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error('파일 저장이 취소되었습니다.')); };
  });
}

export async function deleteAssets(ids) {
  if (!ids.length) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    ids.forEach((id) => store.delete(id));
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('파일 정리를 완료하지 못했습니다.')); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error('파일 정리가 취소되었습니다.')); };
  });
}
