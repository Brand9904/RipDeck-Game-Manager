import { UploadedFile } from '../types';

const DB_NAME = 'RipDeck_GameStorage_DB';
const DB_VERSION = 1;
const STORE_NAME = 'game_files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export interface StoredIndexedDBFile {
  id: string;
  gameId: string;
  filename: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  blob: Blob;
}

// Store a full game file into IndexedDB
export async function storeGameFileInIndexedDB(gameId: string, file: File): Promise<UploadedFile> {
  const db = await openDB();
  const fileId = `idb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const record: StoredIndexedDBFile = {
    id: fileId,
    gameId,
    filename: file.name,
    originalName: file.name,
    sizeBytes: file.size,
    mimeType: file.type || 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
    blob: file,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => {
      resolve({
        id: fileId,
        filename: file.name,
        originalName: file.name,
        sizeBytes: file.size,
        mimeType: record.mimeType,
        uploadedAt: record.uploadedAt,
        downloadUrl: `indexeddb://${fileId}`,
        storageType: 'indexeddb',
      });
    };
    req.onerror = () => reject(req.error);
  });
}

// Retrieve file Blob from IndexedDB
export async function getGameFileFromIndexedDB(fileId: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(fileId);
    req.onsuccess = () => {
      const res = req.result as StoredIndexedDBFile | undefined;
      resolve(res ? res.blob : null);
    };
    req.onerror = () => reject(req.error);
  });
}

// Trigger in-page direct browser file download without opening any new tab!
export async function triggerDirectDownload(file: UploadedFile, fallbackUrl?: string) {
  try {
    if (file.storageType === 'indexeddb' || file.downloadUrl.startsWith('indexeddb://')) {
      const cleanId = file.downloadUrl.replace('indexeddb://', '') || file.id;
      const blob = await getGameFileFromIndexedDB(cleanId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName || file.filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1000);
        return true;
      }
    }

    // Direct download from server endpoint or fallback URL
    const targetUrl = file.downloadUrl.startsWith('http') || file.downloadUrl.startsWith('/api')
      ? file.downloadUrl
      : fallbackUrl || file.downloadUrl;

    if (targetUrl) {
      // Create hidden iframe or direct <a> trigger to prevent tab navigation
      const hiddenIframe = document.createElement('iframe');
      hiddenIframe.style.display = 'none';
      document.body.appendChild(hiddenIframe);

      const a = document.createElement('a');
      a.href = targetUrl;
      a.setAttribute('download', file.originalName || file.filename || 'game_package.zip');
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        if (document.body.contains(hiddenIframe)) document.body.removeChild(hiddenIframe);
      }, 2000);
      return true;
    }
  } catch (err) {
    console.error('Direct download error:', err);
  }
  return false;
}
