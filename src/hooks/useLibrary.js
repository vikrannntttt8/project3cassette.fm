/**
 * useLibrary.js — Local playlist, liked-tracks & custom albums engine
 *
 * Persists to localStorage:
 *   - likedSongs (Liked tracks array)
 *   - pulse_playlists (User-created playlists)
 *   - pulse_custom_albums (User-defined custom albums)
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const STORAGE_KEYS = {
  liked:     'likedSongs',
  legacyLiked: 'pulse_liked_songs',
  playlists: 'pulse_playlists',
  albums:    'pulse_custom_albums',
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
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function useLibrary() {
  const { user, syncLikedSongs, fetchLikedSongs, syncPlaylists, fetchPlaylists } = useAuth();

  const [liked, setLiked] = useState(() => {
    // Check 'likedSongs' first, then legacy 'pulse_liked_songs'
    const stored = load(STORAGE_KEYS.liked, null);
    if (stored !== null && Array.isArray(stored)) return stored;
    return load(STORAGE_KEYS.legacyLiked, []);
  });

  const [playlists, setPlaylists] = useState(() => load(STORAGE_KEYS.playlists, []));
  const [customAlbums, setCustomAlbums] = useState(() => load(STORAGE_KEYS.albums, []));

  // ── Automatic Cloud Sync with Supabase on Login ───────────────────
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    Promise.all([fetchLikedSongs(), fetchPlaylists()]).then(([cloudLiked, cloudPlaylists]) => {
      if (!isMounted) return;
      if (Array.isArray(cloudLiked) && cloudLiked.length > 0) {
        setLiked((prev) => {
          const ids = new Set(prev.map((s) => String(s.id)));
          const newItems = cloudLiked.filter((s) => !ids.has(String(s.id)));
          const merged = [...prev, ...newItems];
          if (prev.length > 0) syncLikedSongs(merged);
          return merged;
        });
      } else if (liked.length > 0) {
        syncLikedSongs(liked);
      }

      if (Array.isArray(cloudPlaylists) && cloudPlaylists.length > 0) {
        setPlaylists((prev) => {
          const ids = new Set(prev.map((p) => String(p.id)));
          const newItems = cloudPlaylists.filter((p) => !ids.has(String(p.id)));
          const merged = [...prev, ...newItems];
          if (prev.length > 0) syncPlaylists(merged);
          return merged;
        });
      } else if (playlists.length > 0) {
        syncPlaylists(playlists);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Sync to localStorage and Supabase on change
  useEffect(() => {
    save(STORAGE_KEYS.liked, liked);
    save(STORAGE_KEYS.legacyLiked, liked);
    if (user?.id) {
      syncLikedSongs(liked);
    }
  }, [liked, user?.id]);

  useEffect(() => {
    save(STORAGE_KEYS.playlists, playlists);
    if (user?.id) {
      syncPlaylists(playlists);
    }
  }, [playlists, user?.id]);

  useEffect(() => {
    save(STORAGE_KEYS.albums, customAlbums);
  }, [customAlbums]);

  // ── Liked tracks ──────────────────────────────────────────────────

  const isLiked = useCallback((id) =>
    liked.some(s => String(s.id) === String(id)), [liked]);

  const toggleLike = useCallback((song) => {
    if (!song) return;
    setLiked(prev =>
      prev.some(s => String(s.id) === String(song.id))
        ? prev.filter(s => String(s.id) !== String(song.id))
        : [{ ...song }, ...prev]
    );
  }, []);

  // ── Playlists ─────────────────────────────────────────────────────

  /** Create a new empty playlist */
  const createPlaylist = useCallback((title, description = '') => {
    const playlist = {
      id:          `pl_${Date.now()}`,
      title:       title.trim() || 'My Playlist',
      description: description.trim(),
      createdAt:   Date.now(),
      songs:       [],
      thumbnail:   '',
      type:        'playlist',
    };
    setPlaylists(prev => [playlist, ...prev]);
    return playlist.id;
  }, []);

  /** Delete a playlist by id */
  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  }, []);

  /** Rename a playlist */
  const renamePlaylist = useCallback((playlistId, newTitle) => {
    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, title: newTitle.trim() || p.title } : p
    ));
  }, []);

  /** Add a song to a playlist (dedup by song id) */
  const addToPlaylist = useCallback((playlistId, song) => {
    if (!song) return;
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      if (p.songs.some(s => String(s.id) === String(song.id))) return p; // already in
      const thumbnail = p.thumbnail || song.thumbnail;
      return { ...p, songs: [...p.songs, { ...song }], thumbnail };
    }));
  }, []);

  /** Remove a song from a playlist */
  const removeFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      const updated = p.songs.filter(s => String(s.id) !== String(songId));
      return {
        ...p,
        songs: updated,
        thumbnail: updated[0]?.thumbnail || '',
      };
    }));
  }, []);

  /** Get a single playlist by id */
  const getPlaylist = useCallback((id) =>
    playlists.find(p => p.id === id) || null, [playlists]);

  // ── Custom Albums ─────────────────────────────────────────────────

  /** Create a user-defined custom album */
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
    setCustomAlbums(prev => [album, ...prev]);
    return album.id;
  }, []);

  /** Delete a custom album by id */
  const deleteAlbum = useCallback((albumId) => {
    setCustomAlbums(prev => prev.filter(a => a.id !== albumId));
  }, []);

  /** Rename/edit a custom album */
  const renameAlbum = useCallback((albumId, newTitle, newArtist) => {
    setCustomAlbums(prev => prev.map(a =>
      a.id === albumId
        ? { ...a, title: newTitle.trim() || a.title, artist: newArtist ? newArtist.trim() : a.artist }
        : a
    ));
  }, []);

  /** Add a song to a custom album */
  const addToAlbum = useCallback((albumId, song) => {
    if (!song) return;
    setCustomAlbums(prev => prev.map(a => {
      if (a.id !== albumId) return a;
      if (a.songs.some(s => String(s.id) === String(song.id))) return a;
      const thumbnail = a.thumbnail || song.thumbnail;
      return { ...a, songs: [...a.songs, { ...song }], thumbnail };
    }));
  }, []);

  /** Remove a song from a custom album */
  const removeFromAlbum = useCallback((albumId, songId) => {
    setCustomAlbums(prev => prev.map(a => {
      if (a.id !== albumId) return a;
      const updated = a.songs.filter(s => String(s.id) !== String(songId));
      return {
        ...a,
        songs: updated,
        thumbnail: updated[0]?.thumbnail || '',
      };
    }));
  }, []);

  return {
    liked,
    playlists,
    customAlbums,
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
  };
}
