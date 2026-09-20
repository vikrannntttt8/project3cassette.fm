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
  pulseLike:     'pulse_like',
  legacyLiked:   'pulse_liked_songs',
  playlists:     'pulse_playlists',
  pulseCus:      'pulse_cus',
  albums:        'pulse_custom_albums',
  history:       'pulse_playback_history',
};

function load(keys, fallback) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  for (const key of keyList) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Continue next key
    }
  }
  return fallback;
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[LocalStorage] Save failed for key:', key, err);
  }
}

function savePlaylists(value) {
  try {
    const str = JSON.stringify(value);
    localStorage.setItem(STORAGE_KEYS.pulseCus, str);
    localStorage.setItem(STORAGE_KEYS.playlists, str);
  } catch (err) {
    console.warn('[LocalStorage] savePlaylists failed:', err);
  }
}

function saveLiked(value) {
  try {
    const str = JSON.stringify(value);
    localStorage.setItem(STORAGE_KEYS.liked, str);
    localStorage.setItem(STORAGE_KEYS.pulseLike, str);
    localStorage.setItem(STORAGE_KEYS.legacyLiked, str);
  } catch (err) {
    console.warn('[LocalStorage] saveLiked failed:', err);
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
    return load([STORAGE_KEYS.pulseLike, STORAGE_KEYS.liked, STORAGE_KEYS.legacyLiked], []);
  });

  const [playlists, setPlaylists] = useState(() => {
    return load([STORAGE_KEYS.pulseCus, STORAGE_KEYS.playlists], []);
  });
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
    console.log('[useLibrary] Authenticated user active, fetching library from Supabase...');

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
          cloudLiked.forEach((s) => {
            const k = String(s.id || s.videoId || '');
            if (k) map.set(k, s);
          });
          prev.forEach((s) => {
            const k = String(s.id || s.videoId || '');
            if (k) map.set(k, s);
          });
          const merged = Array.from(map.values());
          saveLiked(merged);
          if (merged.length > cloudLiked.length && user?.id) {
            syncLikedSongs(merged).catch(() => {});
          }
          return [...merged];
        });
      }

      if (playlistsRes.status === 'fulfilled') {
        const cloudPlaylists = Array.isArray(playlistsRes.value) ? playlistsRes.value : [];
        setPlaylists((prev) => {
          const map = new Map();
          cloudPlaylists.forEach((p) => {
            if (p.id) map.set(String(p.id), p);
          });
          prev.forEach((p) => {
            if (p.id) {
              const existing = map.get(String(p.id));
              if (!existing || ((p.songs?.length || 0) >= (existing.songs?.length || 0))) {
                map.set(String(p.id), p);
              }
            }
          });
          const merged = Array.from(map.values());
          savePlaylists(merged);
          if (merged.length > cloudPlaylists.length && user?.id) {
            syncPlaylists(merged).catch(() => {});
          }
          return [...merged];
        });
      }

      if (historyRes.status === 'fulfilled') {
        const cloudHistory = Array.isArray(historyRes.value) ? historyRes.value : [];
        setHistory((prev) => {
          const map = new Map();
          cloudHistory.forEach((h) => {
            const k = String(h.id || h.videoId || '');
            if (k) map.set(k, h);
          });
          prev.forEach((h) => {
            const k = String(h.id || h.videoId || '');
            if (k) map.set(k, h);
          });
          const merged = Array.from(map.values()).slice(0, 50);
          save(STORAGE_KEYS.history, merged);
          return [...merged];
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
    saveLiked(liked);
    if (user?.id && isInitialSyncRef.current) {
      syncLikedSongs(liked).catch((e) => console.error('[useLibrary] Auto-sync liked songs failed:', e));
    }
  }, [liked, user?.id, syncLikedSongs]);

  useEffect(() => {
    savePlaylists(playlists);
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

    // Read fresh current local state from storage schemas
    const currentLiked = load([STORAGE_KEYS.pulseLike, STORAGE_KEYS.liked, STORAGE_KEYS.legacyLiked], liked);
    const currentPlaylists = load([STORAGE_KEYS.pulseCus, STORAGE_KEYS.playlists], playlists);
    const currentHistory = load(STORAGE_KEYS.history, history);

    const localData = {
      liked: currentLiked,
      playlists: currentPlaylists,
      history: currentHistory,
    };

    const result = await performFullSync(localData);

    if (result && Array.isArray(result.liked)) {
      setLiked([...result.liked]);
      saveLiked(result.liked);
    }
    if (result && Array.isArray(result.playlists)) {
      setPlaylists([...result.playlists]);
      savePlaylists(result.playlists);
    }
    if (result && Array.isArray(result.history)) {
      setHistory([...result.history]);
      save(STORAGE_KEYS.history, result.history);
    }

    return result;
  }, [user?.id, liked, playlists, history, performFullSync]);

  // ── 4. Liked tracks ──────────────────────────────────────────────────
  const isLiked = useCallback((target) => {
    if (!target) return false;
    const targetId = String(typeof target === 'object' ? (target.id || target.videoId || target.browseId) : target);
    return liked.some((s) => {
      const sId = String(s.id || s.videoId || s.browseId || '');
      return sId === targetId || String(s.id) === targetId || String(s.videoId) === targetId;
    });
  }, [liked]);

  const toggleLike = useCallback((song) => {
    if (!song) return;
    const songId = String(song.id || song.videoId || song.browseId || '');
    if (!songId) return;

    setLiked((prev) => {
      const exists = prev.some((s) => {
        const id = String(s.id || s.videoId || s.browseId || '');
        return id === songId;
      });
      let next;
      if (exists) {
        next = prev.filter((s) => {
          const id = String(s.id || s.videoId || s.browseId || '');
          return id !== songId;
        });
      } else {
        const cleanItem = {
          ...song,
          id: song.id || song.videoId || songId,
          videoId: song.videoId || song.id || songId,
          title: song.title || 'Untitled Track',
          artist: song.artist || 'Unknown Artist',
          thumbnail: song.thumbnail || song.thumbnails?.[0]?.url || '',
          likedAt: new Date().toISOString(),
        };
        next = [cleanItem, ...prev];
      }
      saveLiked(next);
      return [...next];
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
    setPlaylists((prev) => {
      const next = [playlist, ...prev];
      savePlaylists(next);
      return next;
    });
    return playlist.id;
  }, []);

  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists((prev) => {
      const next = prev.filter((p) => String(p.id) !== String(playlistId));
      savePlaylists(next);
      return next;
    });
  }, []);

  const renamePlaylist = useCallback((playlistId, newTitle) => {
    setPlaylists((prev) => {
      const next = prev.map((p) =>
        String(p.id) === String(playlistId)
          ? { ...p, title: newTitle.trim() || p.title, name: newTitle.trim() || p.title, updatedAt: Date.now() }
          : p
      );
      savePlaylists(next);
      return next;
    });
  }, []);

  const addToPlaylist = useCallback((playlistId, song) => {
    if (!song) return;
    setPlaylists((prev) => {
      const next = prev.map((p) => {
        if (String(p.id) !== String(playlistId)) return p;
        if (p.songs.some((s) => String(s.id || s.videoId) === String(song.id || song.videoId))) return p;
        const thumbnail = p.thumbnail || song.thumbnail;
        return {
          ...p,
          songs: [...p.songs, { ...song }],
          thumbnail,
          updatedAt: Date.now(),
        };
      });
      savePlaylists(next);
      return next;
    });
  }, []);

  const removeFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists((prev) => {
      const next = prev.map((p) => {
        if (String(p.id) !== String(playlistId)) return p;
        const updated = p.songs.filter((s) => String(s.id || s.videoId) !== String(songId));
        return {
          ...p,
          songs: updated,
          thumbnail: updated[0]?.thumbnail || '',
          updatedAt: Date.now(),
        };
      });
      savePlaylists(next);
      return next;
    });
  }, []);

  const getPlaylist = useCallback((id) =>
    playlists.find((p) => String(p.id) === String(id)) || null, [playlists]);

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
    setCustomAlbums((prev) => {
      const next = [album, ...prev];
      save(STORAGE_KEYS.albums, next);
      return next;
    });
    return album.id;
  }, []);

  const deleteAlbum = useCallback((albumId) => {
    setCustomAlbums((prev) => {
      const next = prev.filter((a) => String(a.id) !== String(albumId));
      save(STORAGE_KEYS.albums, next);
      return next;
    });
  }, []);

  const renameAlbum = useCallback((albumId, newTitle, newArtist) => {
    setCustomAlbums((prev) => {
      const next = prev.map((a) =>
        String(a.id) === String(albumId)
          ? { ...a, title: newTitle.trim() || a.title, artist: newArtist ? newArtist.trim() : a.artist }
          : a
      );
      save(STORAGE_KEYS.albums, next);
      return next;
    });
  }, []);

  const addToAlbum = useCallback((albumId, song) => {
    if (!song) return;
    setCustomAlbums((prev) => {
      const next = prev.map((a) => {
        if (String(a.id) !== String(albumId)) return a;
        if (a.songs.some((s) => String(s.id || s.videoId) === String(song.id || song.videoId))) return a;
        const thumbnail = a.thumbnail || song.thumbnail;
        return { ...a, songs: [...a.songs, { ...song }], thumbnail };
      });
      save(STORAGE_KEYS.albums, next);
      return next;
    });
  }, []);

  const removeFromAlbum = useCallback((albumId, songId) => {
    setCustomAlbums((prev) => {
      const next = prev.map((a) => {
        if (String(a.id) !== String(albumId)) return a;
        const updated = a.songs.filter((s) => String(s.id || s.videoId) !== String(songId));
        return {
          ...a,
          songs: updated,
          thumbnail: updated[0]?.thumbnail || '',
        };
      });
      save(STORAGE_KEYS.albums, next);
      return next;
    });
  }, []);

  // ── 7. Playback History ──────────────────────────────────────────────
  const recordPlayback = useCallback((song) => {
    if (!song) return;
    const historyItem = { ...song, playedAt: new Date().toISOString() };
    const songId = String(song.id || song.videoId || song.browseId || '');

    setHistory((prev) => {
      const filtered = prev.filter((s) => String(s.id || s.videoId || s.browseId || '') !== songId);
      const updated = [historyItem, ...filtered].slice(0, 50);
      save(STORAGE_KEYS.history, updated);
      return [...updated];
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
