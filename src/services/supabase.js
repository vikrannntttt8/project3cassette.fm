import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'pulse_supabase_url';
const STORAGE_KEY_KEY = 'pulse_supabase_anon_key';

const DEFAULT_SUPABASE_URL = 'https://djeizqnmzqigsxxkooxn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWl6cW5tenFpZ3N4eGtvb3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTAxOTMsImV4cCI6MjEwNTQ4NjE5M30.eSww-IDREla-_bq3ePYReaIaent-zmNXHSEdUUT0Kj4';

let supabaseClient = null;

export function getSupabaseCredentials() {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    localStorage.getItem(STORAGE_URL_KEY) ||
    DEFAULT_SUPABASE_URL;

  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    localStorage.getItem(STORAGE_KEY_KEY) ||
    DEFAULT_SUPABASE_ANON_KEY;

  return { url: (envUrl || '').trim(), anonKey: (envKey || '').trim() };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'implicit',
        },
      });
      return supabaseClient;
    } catch (err) {
      console.error('[Supabase] Client init failed:', err);
    }
  }
  return null;
}

export const supabase = getSupabaseClient();

export function saveSupabaseCredentials(url, anonKey) {
  if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
  else localStorage.removeItem(STORAGE_URL_KEY);

  if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);

  // Reset client so it re-initializes
  supabaseClient = null;
  return getSupabaseClient();
}

/**
 * 1. Sign in with Google (OAuth)
 */
export async function signInWithGoogle() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not available. Please verify your Supabase configuration.');
  }

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    console.error('[Supabase] signInWithGoogle error:', error);
    throw error;
  }
  return data;
}

/**
 * 2. Sign Out
 */
export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) {
    console.error('[Supabase] Sign out error:', error.message);
    throw error;
  }
}

/**
 * 3. Cloud Sync: Liked Songs
 */
export async function syncLikedSongsCloud(userId, likedSongs) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('User not authenticated');
  if (!Array.isArray(likedSongs)) return [];

  const rows = likedSongs.map((song) => {
    const sId = String(song.id || song.videoId || song.browseId || '');
    return {
      user_id: userId,
      song_id: sId,
      song_data: song,
      created_at: song.likedAt ? new Date(song.likedAt).toISOString() : new Date().toISOString(),
    };
  }).filter((r) => r.song_id && r.song_id !== 'undefined' && r.song_id !== 'null');

  if (rows.length > 0) {
    const { error: upsertErr } = await client
      .from('liked_songs')
      .upsert(rows, { onConflict: 'user_id,song_id' });

    if (upsertErr) {
      console.error('[Supabase] syncLikedSongsCloud upsert error:', upsertErr);
      throw new Error(`Liked songs sync failed: ${upsertErr.message || upsertErr.details || 'Database error'}`);
    }
  }

  return rows;
}

export async function fetchLikedSongsCloud(userId) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  if (!userId) return [];

  const { data, error } = await client
    .from('liked_songs')
    .select('song_id, song_data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(0, 999);

  if (error) {
    console.error('[Supabase] fetchLikedSongsCloud error:', error);
    throw new Error(`Failed to fetch liked songs: ${error.message || error.details || 'Database error'}`);
  }

  return (data || []).map((row) => {
    let song = row.song_data;
    if (typeof song === 'string') {
      try {
        song = JSON.parse(song);
      } catch {
        song = {};
      }
    }
    const songId = String(song?.id || song?.videoId || row.song_id || '');
    return {
      ...(song || {}),
      id: songId,
      videoId: song?.videoId || songId,
      likedAt: row.created_at,
    };
  }).filter((s) => s.id && s.id !== 'undefined' && s.id !== 'null');
}

/**
 * 4. Cloud Sync: Custom Playlists
 */
export async function syncPlaylistsCloud(userId, playlists) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('User not authenticated');
  if (!Array.isArray(playlists)) return [];

  const validPlaylists = playlists.filter((p) => p && (p.id || p.title || p.name));

  for (const pl of validPlaylists) {
    const playlistId = String(pl.id || `pl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
    const row = {
      id: playlistId,
      user_id: userId,
      name: pl.title || pl.name || 'Untitled Playlist',
      description: pl.description || '',
      songs: Array.isArray(pl.songs) ? pl.songs : [],
      thumbnail: pl.thumbnail || (Array.isArray(pl.songs) && pl.songs[0]?.thumbnail) || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('user_playlists')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] syncPlaylistsCloud error on playlist:', pl.title, error);
      throw new Error(`Playlist "${pl.title || 'Untitled'}" sync failed: ${error.message || error.details || 'Database error'}`);
    }
  }
}

export async function fetchPlaylistsCloud(userId) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  if (!userId) return [];

  const { data, error } = await client
    .from('user_playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .range(0, 499);

  if (error) {
    console.error('[Supabase] fetchPlaylistsCloud error:', error);
    throw new Error(`Failed to fetch playlists: ${error.message || error.details || 'Database error'}`);
  }

  return (data || []).map((row) => {
    let songs = row.songs;
    if (typeof songs === 'string') {
      try {
        songs = JSON.parse(songs);
      } catch {
        songs = [];
      }
    }
    return {
      id: String(row.id),
      title: row.name || 'Untitled Playlist',
      name: row.name || 'Untitled Playlist',
      description: row.description || '',
      songs: Array.isArray(songs) ? songs : [],
      thumbnail: row.thumbnail || (Array.isArray(songs) && songs[0]?.thumbnail) || '',
      type: 'playlist',
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    };
  });
}

/**
 * 5. Cloud Sync: Playback History
 */
export async function saveHistoryItemCloud(userId, song) {
  const client = getSupabaseClient();
  if (!client || !userId || !song) return;

  try {
    const songId = String(song.id || song.videoId || song.browseId || '');
    if (!songId) return;

    const { error } = await client.from('playback_history').insert({
      user_id: userId,
      song_id: songId,
      song_data: song,
      played_at: new Date().toISOString(),
    });
    if (error) {
      console.error('[Supabase] saveHistoryItemCloud error:', error);
    }
  } catch (e) {
    console.error('[Supabase] saveHistoryItemCloud exception:', e);
  }
}

export async function syncHistoryCloud(userId, historyList) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('User not authenticated');
  if (!Array.isArray(historyList) || historyList.length === 0) return;

  const recentItems = historyList.slice(0, 30).map((item) => {
    const sId = String(item.id || item.videoId || item.browseId || '');
    return {
      user_id: userId,
      song_id: sId,
      song_data: item,
      played_at: item.playedAt ? new Date(item.playedAt).toISOString() : new Date().toISOString(),
    };
  }).filter((r) => r.song_id);

  if (recentItems.length > 0) {
    const { error } = await client.from('playback_history').insert(recentItems);
    if (error) {
      console.error('[Supabase] syncHistoryCloud error:', error);
    }
  }
}

export async function fetchHistoryCloud(userId) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  if (!userId) return [];

  const { data, error } = await client
    .from('playback_history')
    .select('song_data, played_at')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Supabase] fetchHistoryCloud error:', error);
    return [];
  }

  // Deduplicate songs by id
  const seen = new Set();
  const deduped = [];
  for (const row of data || []) {
    let song = row.song_data;
    if (typeof song === 'string') {
      try {
        song = JSON.parse(song);
      } catch {
        song = {};
      }
    }
    const key = String(song?.id || song?.videoId || '');
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push({ ...song, id: key, videoId: song.videoId || key, playedAt: row.played_at });
    }
  }
  return deduped;
}

/**
 * 6. Master Full Sync Helper (Push local + Pull cloud + Merge)
 */
export async function performFullCloudSync(userId, { liked = [], playlists = [], history = [] }) {
  if (!userId) throw new Error('You must be signed in with Google to sync your library.');
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  console.log(`[Supabase Sync] Starting full push & pull sync for user: ${userId}...`);

  // Step 1: Push initial local data to Cloud
  if (Array.isArray(liked) && liked.length > 0) {
    await syncLikedSongsCloud(userId, liked);
  }
  if (Array.isArray(playlists) && playlists.length > 0) {
    await syncPlaylistsCloud(userId, playlists);
  }

  // Step 2: Pull latest state from Cloud without limits
  const [cloudLiked, cloudPlaylists, cloudHistory] = await Promise.all([
    fetchLikedSongsCloud(userId),
    fetchPlaylistsCloud(userId),
    fetchHistoryCloud(userId),
  ]);

  console.log(`[Supabase Sync] Fetched from cloud: ${cloudLiked.length} liked, ${cloudPlaylists.length} playlists, ${cloudHistory.length} history.`);

  // Step 3: Merge cloud items with local items cleanly
  const likedMap = new Map();
  // Cloud items
  cloudLiked.forEach((s) => {
    const key = String(s.id || s.videoId || '');
    if (key && key !== 'undefined' && key !== 'null') {
      likedMap.set(key, s);
    }
  });
  // Local items
  liked.forEach((s) => {
    const key = String(s.id || s.videoId || '');
    if (key && key !== 'undefined' && key !== 'null') {
      likedMap.set(key, s);
    }
  });
  const mergedLiked = Array.from(likedMap.values());

  const playlistMap = new Map();
  cloudPlaylists.forEach((p) => {
    if (p.id) playlistMap.set(String(p.id), p);
  });
  playlists.forEach((p) => {
    if (p.id) playlistMap.set(String(p.id), p);
  });
  const mergedPlaylists = Array.from(playlistMap.values());

  const historyMap = new Map();
  cloudHistory.forEach((h) => {
    const key = String(h.id || h.videoId || '');
    if (key && key !== 'undefined' && key !== 'null') {
      historyMap.set(key, h);
    }
  });
  history.forEach((h) => {
    const key = String(h.id || h.videoId || '');
    if (key && key !== 'undefined' && key !== 'null') {
      historyMap.set(key, h);
    }
  });
  const mergedHistory = Array.from(historyMap.values()).slice(0, 50);

  // Step 4: If merged set has items, push final merged state
  if (mergedLiked.length > 0) {
    await syncLikedSongsCloud(userId, mergedLiked);
  }
  if (mergedPlaylists.length > 0) {
    await syncPlaylistsCloud(userId, mergedPlaylists);
  }

  console.log(`[Supabase Sync] Sync complete! Result: ${mergedLiked.length} liked, ${mergedPlaylists.length} playlists, ${mergedHistory.length} history.`);

  return {
    liked: mergedLiked,
    playlists: mergedPlaylists,
    history: mergedHistory,
    stats: {
      likedCount: mergedLiked.length,
      playlistsCount: mergedPlaylists.length,
      historyCount: mergedHistory.length,
    },
  };
}
