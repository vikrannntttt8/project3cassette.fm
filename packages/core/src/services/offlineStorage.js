/**
 * offlineStorage.js — Cache API & IndexedDB Offline Audio & Track Store
 *
 * Implements:
 * 1. Manual user downloads ('offline_tracks')
 * 2. Rolling FIFO "Last 70" auto-cache of recently played tracks ('last_70_cache')
 *    with background audio, metadata, and lyrics caching in CacheStorage & IndexedDB.
 */

import { getStoredItem, setStoredItem } from '../utils/storage.js';

const DB_NAME = 'cassette_offline_db';
const DB_VERSION = 2;
const STORE_MANUAL_TRACKS = 'offline_tracks';
const STORE_LAST70 = 'last_70_cache';
const CACHE_NAME = 'cassette-offline-audio-v1';
const MAX_LAST70_LIMIT = 70;

// Open IndexedDB database with multi-store schema
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_MANUAL_TRACKS)) {
        db.createObjectStore(STORE_MANUAL_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_LAST70)) {
        const last70Store = db.createObjectStore(STORE_LAST70, { keyPath: 'id' });
        last70Store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all explicitly downloaded offline tracks
 * @returns {Promise<Array>}
 */
export async function getOfflineTracks() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MANUAL_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_MANUAL_TRACKS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] getOfflineTracks error:', err);
    try {
      const raw = getStoredItem('cassette_offline_meta');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Get the Last 70 played songs rolling cache
 * @returns {Promise<Array>}
 */
export async function getLast70OfflineTracks() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LAST70, 'readonly');
      const store = tx.objectStore(STORE_LAST70);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        // Sort descending by savedAt
        items.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] getLast70OfflineTracks error:', err);
    try {
      const raw = getStoredItem('cassette_last70_meta');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Check if a track is downloaded offline (either manual or in last 70)
 * @param {string} trackId
 * @returns {Promise<boolean>}
 */
export async function isTrackOffline(trackId) {
  if (!trackId) return false;
  const idStr = String(trackId);
  try {
    const db = await openDB();
    const checkStore = (storeName) => new Promise((res) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(idStr);
        req.onsuccess = () => res(Boolean(req.result));
        req.onerror = () => res(false);
      } catch {
        res(false);
      }
    });

    const isManual = await checkStore(STORE_MANUAL_TRACKS);
    if (isManual) return true;
    return await checkStore(STORE_LAST70);
  } catch {
    try {
      const raw = getStoredItem('cassette_offline_meta');
      if (raw && JSON.parse(raw).some((t) => t.id === idStr || t.videoId === idStr)) return true;
      const raw70 = getStoredItem('cassette_last70_meta');
      if (raw70 && JSON.parse(raw70).some((t) => t.id === idStr || t.videoId === idStr)) return true;
      return false;
    } catch {
      return false;
    }
  }
}

/**
 * Silently record and cache a played track into the rolling "Last 70" store.
 * Automatically evicts oldest items when exceeding 70 songs (FIFO).
 * @param {Object} track
 * @param {string} [lyrics]
 * @returns {Promise<boolean>}
 */
export async function recordPlayedSongOffline(track, lyrics = '') {
  if (!track || (!track.id && !track.videoId)) return false;
  const trackId = String(track.videoId || track.id);
  const cleanTrack = {
    ...track,
    id: trackId,
    videoId: trackId,
    lyrics: lyrics || track.lyrics || '',
    savedAt: Date.now(),
    isOfflineAvailable: true,
  };

  try {
    // 1. Silently background-cache artwork
    const imgUrl = track.thumbnail || track.cover;
    if (imgUrl && typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.add(imgUrl).catch(() => {});
      } catch {}
    }

    // 2. Silently background-cache audio stream blob
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(CACHE_NAME);
        const streamUrl = `/api/stream/${trackId}`;
        const match = await cache.match(streamUrl);
        if (!match) {
          const res = await fetch(streamUrl);
          if (res.ok) {
            await cache.put(streamUrl, res);
          }
        }
      } catch (e) {
        console.warn('[OfflineStorage] Stream pre-cache note:', e.message);
      }
    }

    // 3. Put into IndexedDB rolling store
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LAST70, 'readwrite');
      const store = tx.objectStore(STORE_LAST70);
      const req = store.put(cleanTrack);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // 4. FIFO Eviction Enforcement (strictly cap at 70 songs)
    const allItems = await new Promise((resolve) => {
      const tx = db.transaction(STORE_LAST70, 'readonly');
      const store = tx.objectStore(STORE_LAST70);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (allItems.length > MAX_LAST70_LIMIT) {
      allItems.sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
      const excess = allItems.slice(0, allItems.length - MAX_LAST70_LIMIT);

      const delTx = db.transaction(STORE_LAST70, 'readwrite');
      const delStore = delTx.objectStore(STORE_LAST70);
      for (const item of excess) {
        delStore.delete(item.id);
        // Evict from CacheStorage
        if (typeof caches !== 'undefined') {
          caches.open(CACHE_NAME).then((c) => {
            c.delete(`/api/stream/${item.id}`).catch(() => {});
          });
        }
      }
    }

    // Update storage mirror
    try {
      const last70List = await getLast70OfflineTracks();
      setStoredItem('cassette_last70_meta', JSON.stringify(last70List.slice(0, MAX_LAST70_LIMIT)));
    } catch {}

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cassette:offline-changed', { detail: { trackId, action: 'last70-updated' } }));
    }
    return true;
  } catch (err) {
    console.warn('[OfflineStorage] recordPlayedSongOffline error:', err);
    return false;
  }
}

/**
 * Save a track explicitly for offline playback (Manual Downloads)
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
        await cache.add(imgUrl).catch(() => {});
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
      const tx = db.transaction(STORE_MANUAL_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_MANUAL_TRACKS);
      const req = store.put(cleanTrack);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Update storage fallback mirror
    try {
      const existing = await getOfflineTracks();
      const filtered = existing.filter((t) => t.id !== trackId);
      setStoredItem('cassette_offline_meta', JSON.stringify([...filtered, cleanTrack]));
    } catch {}

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cassette:offline-changed', { detail: { trackId, action: 'added' } }));
    }
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
      const tx = db.transaction(STORE_MANUAL_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_MANUAL_TRACKS);
      const req = store.delete(idStr);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Clean up storage mirror
    try {
      const raw = getStoredItem('cassette_offline_meta');
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter((t) => t.id !== idStr && t.videoId !== idStr);
        setStoredItem('cassette_offline_meta', JSON.stringify(filtered));
      }
    } catch {}

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cassette:offline-changed', { detail: { trackId: idStr, action: 'removed' } }));
    }
    return true;
  } catch (err) {
    console.warn('[OfflineStorage] Remove error:', err);
    return false;
  }
}
