/**
 * offlineStorage.js — Cache API & IndexedDB Offline Audio & Track Store
 *
 * Enables full offline playback for tracks downloaded by the user.
 * Stores audio streams/blobs and artwork in Cache API / IndexedDB.
 */

const DB_NAME = 'cassette_offline_db';
const DB_VERSION = 1;
const STORE_TRACKS = 'offline_tracks';
const CACHE_NAME = 'cassette-offline-audio-v1';

// Open IndexedDB database
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all downloaded offline tracks
 * @returns {Promise<Array>}
 */
export async function getOfflineTracks() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] getOfflineTracks error:', err);
    // LocalStorage fallback
    try {
      const raw = localStorage.getItem('cassette_offline_meta');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Check if a track is downloaded offline
 * @param {string} trackId
 * @returns {Promise<boolean>}
 */
export async function isTrackOffline(trackId) {
  if (!trackId) return false;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.get(String(trackId));
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    });
  } catch {
    try {
      const raw = localStorage.getItem('cassette_offline_meta');
      if (!raw) return false;
      const list = JSON.parse(raw);
      return list.some((t) => (t.id === trackId || t.videoId === trackId));
    } catch {
      return false;
    }
  }
}

/**
 * Save a track and its assets for offline playback
 * @param {Object} track
 * @returns {Promise<boolean>}
 */
export async function saveTrackOffline(track) {
  if (!track || (!track.id && !track.videoId)) return false;
  const trackId = String(track.id || track.videoId);
  const cleanTrack = {
    ...track,
    id: trackId,
    savedAt: Date.now(),
    isOfflineAvailable: true,
  };

  try {
    // 1. Cache thumbnail / artwork if available
    const imgUrl = track.thumbnail || track.cover;
    if (imgUrl && typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.add(imgUrl);
      } catch (e) {
        console.warn('[OfflineStorage] Artwork cache notice:', e);
      }
    }

    // 2. Try fetching audio stream to cache offline if available
    const targetVid = track.videoId || track.youtubeId || track.id;
    if (targetVid && typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(CACHE_NAME);
        const streamUrl = `/api/stream/${targetVid}`;
        const res = await fetch(streamUrl);
        if (res.ok) {
          await cache.put(streamUrl, res);
        }
      } catch (e) {
        console.warn('[OfflineStorage] Audio cache attempt:', e);
      }
    }

    // 3. Save track metadata in IndexedDB
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.put(cleanTrack);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Update LocalStorage fallback mirror
    try {
      const existing = await getOfflineTracks();
      const filtered = existing.filter((t) => t.id !== trackId);
      localStorage.setItem('cassette_offline_meta', JSON.stringify([...filtered, cleanTrack]));
    } catch {}

    window.dispatchEvent(new CustomEvent('cassette:offline-changed', { detail: { trackId, action: 'added' } }));
    return true;
  } catch (err) {
    console.error('[OfflineStorage] Save error:', err);
    return false;
  }
}

/**
 * Remove a track from offline storage
 * @param {string} trackId
 * @returns {Promise<boolean>}
 */
export async function removeOfflineTrack(trackId) {
  if (!trackId) return false;
  const idStr = String(trackId);

  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.delete(idStr);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Clean up LocalStorage mirror
    try {
      const raw = localStorage.getItem('cassette_offline_meta');
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter((t) => t.id !== idStr && t.videoId !== idStr);
        localStorage.setItem('cassette_offline_meta', JSON.stringify(filtered));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('cassette:offline-changed', { detail: { trackId: idStr, action: 'removed' } }));
    return true;
  } catch (err) {
    console.warn('[OfflineStorage] Remove error:', err);
    return false;
  }
}
