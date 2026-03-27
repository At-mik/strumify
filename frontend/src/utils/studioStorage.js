const DB_NAME = "strumify_studio_db";
const DB_VERSION = 1;
const ASSET_STORE = "assets";
const META_KEY = "strumify_studio_projects";

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        db.createObjectStore(ASSET_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runTx = async (mode, handler) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSET_STORE, mode);
    const store = tx.objectStore(ASSET_STORE);
    handler(store, resolve, reject);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
};

export const saveAssetBlob = async (key, blob) =>
  runTx("readwrite", (store, resolve, reject) => {
    const request = store.put(blob, key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });

export const getAssetBlob = async (key) =>
  runTx("readonly", (store, resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

export const deleteAssetBlob = async (key) =>
  runTx("readwrite", (store, resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });

export const readProjectMeta = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeProjectMeta = (items) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(META_KEY, JSON.stringify(Array.isArray(items) ? items : []));
  } catch (error) {
    console.error("Unable to persist studio metadata", error);
  }
};
