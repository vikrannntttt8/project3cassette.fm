/**
 * useLibrary.js — Local playlist, liked-tracks, playback history & custom albums engine
 *
 * Persists to localStorage:
 *   - likedSongs (Liked tracks array)
 *   - pulse_playlists (User-created playlists)
 *   - pulse_custom_albums (User-defined custom albums)
 *   - pulse_playback_history (User listening history)
 *
 * Fully synchronized with Supabase PostgreSQL tables:
 *   - liked_songs
 *   - user_playlists
 *   - playback_history
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const STORAGE_KEYS = {
  liked:         'likedSongs',
  legacyLiked:   'pulse_liked_songs',
  playlists:     'pulse_playlists',
  albums:        'pulse_custom_albums',
  history:       'pulse_playback_history',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[LocalStorage] Save failed for key:', key, err);
  }
}

export function useLibrary() {
  const {
    user,
    syncLikedSongs,
    fetchLikedSongs,
    syncPlaylists,
    fetchPlaylists,
    recordHistory,
    fetchHistory,
    performFullSync,
    authSequence,
  } = useAuth();

  const [liked, setLiked] = useState(() => {
    const stored = load(STORAGE_KEYS.liked, null);
    if (stored !== null && Array.isArray(stored)) return stored;
    return load(STORAGE_KEYS.legacyLiked, []);
  });

  const [playlists, setPlaylists] = useState(() => load(STORAGE_KEYS.playlists, []));
  const [customAlbums, setCustomAlbums] = useState(() => load(STORAGE_KEYS.albums, []));
  const [history, setHistory] = useState(() => load(STORAGE_KEYS.history, []));

  const isInitialSyncRef = useRef(false);

  // ── 1. Pull Sync on Login / App Mount / OAuth Redirect ────────────
  useEffect(() => {
    if (!user?.id) {
      isInitialSyncRef.current = false;
      return;
    }

    let isMounted = true;
    console.log('[useLibrary] Authenticated session active, running cloud pull sync...');

    Promise.allSettled([
      fetchLikedSongs(),
      fetchPlaylists(),
      fetchHistory(),
    ]).then(([likedRes, playlistsRes, historyRes]) => {
      if (!isMounted) return;

      if (likedRes.status === 'fulfilled') {
        const cloudLiked = Array.isArray(likedRes.value) ? likedRes.value : [];
        setLiked((prev) => {
          const map = new Map();
          cloudLiked.forEach((s) => map.set(String(s.id || s.videoId), s));
          prev.forEach((s) => map.set(String(s.id || s.videoId), s));
          const merged = Array.from(map.values());
          save(STORAGE_KEYS.liked, merged);
          save(STORAGE_KEYS.legacyLiked, merged);
          // If local had items not in cloud, push to cloud
          if (merged.length > cloudLiked.length && user?.id) {
            syncLikedSongs(merged).catch(() => {});
          }
          return merged;
        });
      }

      if (playlistsRes.status === 'fulfilled') {
        const cloudPlaylists = Array.isArray(playlistsRes.value) ? playlistsRes.value : [];
        setPlaylists((prev) => {
          const map = new Map();
          cloudPlaylists.forEach((p) => map.set(String(p.id), p));
          prev.forEach((p) => map.set(String(p.id), p));
          const merged = Array.from(map.values());
          save(STORAGE_KEYS.playlists, merged);
          if (merged.length > cloudPlaylists.length && user?.id) {
            syncPlaylists(merged).catch(() => {});
          }
          return merged;
        });
      }

      if (historyRes.status === 'fulfilled') {
        const cloudHistory = Array.isArray(historyRes.value) ? historyRes.value : [];
        setHistory((prev) => {
          const map = new Map();
          cloudHistory.forEach((h) => map.set(String(h.id || h.videoId), h));
          prev.forEach((h) => map.set(String(h.id || h.videoId), h));
          const merged = Array.from(map.values()).slice(0, 50);
          save(STORAGE_KEYS.history, merged);
          return merged;
        });
      }

      isInitialSyncRef.current = true;
    }).catch((err) => {
      console.error('[useLibrary] Error during initial cloud pull:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id, authSequence, fetchLikedSongs, fetchPlaylists, fetchHistory, syncLikedSongs, syncPlaylists]);

  // ── 2. Real-time Incremental Sync on Local State Mutations ──────────
  useEffect(() => {
    save(STORAGE_KEYS.liked, liked);
    save(STORAGE_KEYS.legacyLiked, liked);
    if (user?.id && isInitialSyncRef.current) {
      syncLikedSongs(liked).catch((e) => console.error('[useLibrary] Auto-sync liked songs failed:', e));
    }
  }, [liked, user?.id, syncLikedSongs]);

  useEffect(() => {
    save(STORAGE_KEYS.playlists, playlists);
    if (user?.id && isInitialSyncRef.current) {
      syncPlaylists(playlists).catch((e) => console.error('[useLibrary] Auto-sync playlists failed:', e));
    }
  }, [playlists, user?.id, syncPlaylists]);

  useEffect(() => {
    save(STORAGE_KEYS.albums, customAlbums);
  }, [customAlbums]);

  useEffect(() => {
    save(STORAGE_KEYS.history, history);
  }, [history]);

  // ── 3. Manual Master Sync Trigger (Push & Pull) ─────────────────────
  const syncAllWithCloud = useCallback(async () => {
    if (!user?.id) {
      throw new Error('Please sign in with Google first to synchronize with Supabase Cloud.');
    }

    const localData = {
      liked,
      playlists,
      history,
    };

    const result = await performFullSync(localData);

    if (result && result.liked) {
      setLiked(result.liked);
      save(STORAGE_KEYS.liked, result.liked);
      save(STORAGE_KEYS.legacyLiked, result.liked);
    }
    if (result && result.playlists) {
      setPlaylists(result.playlists);
      save(STORAGE_KEYS.playlists, result.playlists);
    }
    if (result && result.history) {
      setHistory(result.history);
      save(STORAGE_KEYS.history, result.history);
    }

    return result;
  }, [user?.id, liked, playlists, history, performFullSync]);

  // ── 4. Liked tracks ──────────────────────────────────────────────────
  const isLiked = useCallback((id) =>
    liked.some((s) => String(s.id || s.videoId) === String(id)), [liked]);

  const toggleLike = useCallback((song) => {
    if (!song) return;
    const songId = String(song.id || song.videoId);
    setLiked((prev) => {
      const exists = prev.some((s) => String(s.id || s.videoId) === songId);
      if (exists) {
        return prev.filter((s) => String(s.id || s.videoId) !== songId);
      }
      return [{ ...song, likedAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  // ── 5. Playlists ─────────────────────────────────────────────────────
  const createPlaylist = useCallback((title, description = '') => {
    const playlist = {
      id:          `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title:       title.trim() || 'My Playlist',
      name:        title.trim() || 'My Playlist',
      description: description.trim(),
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
      songs:       [],
      thumbnail:   '',
      type:        'playlist',
    };
    setPlaylists((prev) => [playlist, ...prev]);
    return playlist.id;
  }, []);

  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  }, []);

  const renamePlaylist = useCallback((playlistId, newTitle) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, title: newTitle.trim() || p.title, name: newTitle.trim() || p.title, updatedAt: Date.now() }
          : p
      )
    );
  }, []);

  const addToPlaylist = useCallback((playlistId, song) => {
    if (!song) return;
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        if (p.songs.some((s) => String(s.id || s.videoId) === String(song.id || song.videoId))) return p;
        const thumbnail = p.thumbnail || song.thumbnail;
        return {
          ...p,
          songs: [...p.songs, { ...song }],
          thumbnail,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const removeFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        const updated = p.songs.filter((s) => String(s.id || s.videoId) !== String(songId));
        return {
          ...p,
          songs: updated,
          thumbnail: updated[0]?.thumbnail || '',
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const getPlaylist = useCallback((id) =>
    playlists.find((p) => p.id === id) || null, [playlists]);

  // ── 6. Custom Albums ─────────────────────────────────────────────────
  const createAlbum = useCallback((title, artist = 'Various Artists', description = '') => {
    const album = {
      id:          `album_${Date.now()}`,
      title:       title.trim() || 'Custom Album',
      artist:      artist.trim() || 'Custom Curator',
      description: description.trim(),
      year:        new Date().getFullYear().toString(),
      createdAt:   Date.now(),
      songs:       [],
      thumbnail:   '',
      type:        'album',
    };
    setCustomAlbums((prev) => [album, ...prev]);
    return album.id;
  }, []);

  const deleteAlbum = useCallback((albumId) => {
    setCustomAlbums((prev) => prev.filter((a) => a.id !== albumId));
  }, []);

  const renameAlbum = useCallback((albumId, newTitle, newArtist) => {
    setCustomAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId
          ? { ...a, title: newTitle.trim() || a.title, artist: newArtist ? newArtist.trim() : a.artist }
          : a
      )
    );
  }, []);

  const addToAlbum = useCallback((albumId, song) => {
    if (!song) return;
    setCustomAlbums((prev) =>
      prev.map((a) => {
        if (a.id !== albumId) return a;
        if (a.songs.some((s) => String(s.id || s.videoId) === String(song.id || song.videoId))) return a;
        const thumbnail = a.thumbnail || song.thumbnail;
        return { ...a, songs: [...a.songs, { ...song }], thumbnail };
      })
    );
  }, []);

  const removeFromAlbum = useCallback((albumId, songId) => {
    setCustomAlbums((prev) =>
      prev.map((a) => {
        if (a.id !== albumId) return a;
        const updated = a.songs.filter((s) => String(s.id || s.videoId) !== String(songId));
        return {
          ...a,
          songs: updated,
          thumbnail: updated[0]?.thumbnail || '',
        };
      })
    );
  }, []);

  // ── 7. Playback History ──────────────────────────────────────────────
  const recordPlayback = useCallback((song) => {
    if (!song) return;
    const historyItem = { ...song, playedAt: new Date().toISOString() };
    const songId = String(song.id || song.videoId);

    setHistory((prev) => {
      const filtered = prev.filter((s) => String(s.id || s.videoId) !== songId);
      const updated = [historyItem, ...filtered].slice(0, 50);
      save(STORAGE_KEYS.history, updated);
      return updated;
    });

    if (user?.id) {
      recordHistory(song).catch((e) => console.error('[useLibrary] recordHistory failed:', e));
    }
  }, [user?.id, recordHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEYS.history);
  }, []);

  return {
    liked,
    playlists,
    customAlbums,
    history,
    isLiked,
    toggleLike,
    // Playlists
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylist,
    // Albums
    createAlbum,
    deleteAlbum,
    renameAlbum,
    addToAlbum,
    removeFromAlbum,
    // History
    recordPlayback,
    clearHistory,
    setHistory,
    // Cloud Sync
    syncAllWithCloud,
  };
}
