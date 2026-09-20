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
  if (!Array.isArray(likedSongs) || likedSongs.length === 0) return [];

  const rows = likedSongs.map((song) => ({
    user_id: userId,
    song_id: String(song.id || song.videoId),
    song_data: song,
    created_at: song.likedAt ? new Date(song.likedAt).toISOString() : new Date().toISOString(),
  }));

  const { error } = await client
    .from('liked_songs')
    .upsert(rows, { onConflict: 'user_id,song_id' });

  if (error) {
    console.error('[Supabase] syncLikedSongsCloud error:', error);
    throw new Error(`Liked songs sync failed: ${error.message || error.details || 'Database error'}`);
  }
  return rows;
}

export async function fetchLikedSongsCloud(userId) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  if (!userId) return [];

  const { data, error } = await client
    .from('liked_songs')
    .select('song_data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] fetchLikedSongsCloud error:', error);
    throw new Error(`Failed to fetch liked songs: ${error.message || error.details || 'Database error'}`);
  }
  return (data || []).map((row) => ({
    ...row.song_data,
    likedAt: row.created_at,
  }));
}

/**
 * 4. Cloud Sync: Custom Playlists
 */
export async function syncPlaylistsCloud(userId, playlists) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  if (!userId) throw new Error('User not authenticated');
  if (!Array.isArray(playlists) || playlists.length === 0) return [];

  for (const pl of playlists) {
    const playlistId = String(pl.id || `pl_${Date.now()}`);
    const row = {
      id: playlistId,
      user_id: userId,
      name: pl.title || pl.name || 'Untitled Playlist',
      description: pl.description || '',
      songs: Array.isArray(pl.songs) ? pl.songs : [],
      thumbnail: pl.thumbnail || pl.songs?.[0]?.thumbnail || '',
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
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase] fetchPlaylistsCloud error:', error);
    throw new Error(`Failed to fetch playlists: ${error.message || error.details || 'Database error'}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    title: row.name || 'Untitled Playlist',
    name: row.name || 'Untitled Playlist',
    description: row.description || '',
    songs: Array.isArray(row.songs) ? row.songs : [],
    thumbnail: row.thumbnail || row.songs?.[0]?.thumbnail || '',
    type: 'playlist',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  }));
}

/**
 * 5. Cloud Sync: Playback History
 */
export async function saveHistoryItemCloud(userId, song) {
  const client = getSupabaseClient();
  if (!client || !userId || !song) return;

  try {
    const { error } = await client.from('playback_history').insert({
      user_id: userId,
      song_id: String(song.id || song.videoId),
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

  // Insert most recent 25 history items
  const recentItems = historyList.slice(0, 25).map((item) => ({
    user_id: userId,
    song_id: String(item.id || item.videoId),
    song_data: item,
    played_at: item.playedAt ? new Date(item.playedAt).toISOString() : new Date().toISOString(),
  }));

  const { error } = await client.from('playback_history').insert(recentItems);
  if (error) {
    console.error('[Supabase] syncHistoryCloud error:', error);
    throw new Error(`Playback history sync failed: ${error.message || 'Database error'}`);
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
    throw new Error(`Failed to fetch history: ${error.message || 'Database error'}`);
  }

  // Deduplicate songs by id
  const seen = new Set();
  const deduped = [];
  for (const row of data || []) {
    const song = row.song_data;
    const key = String(song.id || song.videoId);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push({ ...song, playedAt: row.played_at });
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

  console.log(`[Supabase Sync] Starting full sync for user: ${userId}...`);

  // Step 1: Push local data to Cloud
  if (liked.length > 0) {
    await syncLikedSongsCloud(userId, liked);
  }
  if (playlists.length > 0) {
    await syncPlaylistsCloud(userId, playlists);
  }

  // Step 2: Pull latest state from Cloud
  const [cloudLiked, cloudPlaylists, cloudHistory] = await Promise.all([
    fetchLikedSongsCloud(userId),
    fetchPlaylistsCloud(userId),
    fetchHistoryCloud(userId),
  ]);

  // Step 3: Merge cloud items with local items cleanly
  const likedMap = new Map();
  // Add cloud songs first
  cloudLiked.forEach((s) => likedMap.set(String(s.id || s.videoId), s));
  // Add local songs (takes precedence or unions)
  liked.forEach((s) => likedMap.set(String(s.id || s.videoId), s));
  const mergedLiked = Array.from(likedMap.values());

  const playlistMap = new Map();
  cloudPlaylists.forEach((p) => playlistMap.set(String(p.id), p));
  playlists.forEach((p) => playlistMap.set(String(p.id), p));
  const mergedPlaylists = Array.from(playlistMap.values());

  const historyMap = new Map();
  cloudHistory.forEach((h) => historyMap.set(String(h.id || h.videoId), h));
  history.forEach((h) => historyMap.set(String(h.id || h.videoId), h));
  const mergedHistory = Array.from(historyMap.values()).slice(0, 50);

  // Step 4: If merged set has new local items, push final merged state
  if (mergedLiked.length > cloudLiked.length) {
    await syncLikedSongsCloud(userId, mergedLiked);
  }
  if (mergedPlaylists.length > cloudPlaylists.length) {
    await syncPlaylistsCloud(userId, mergedPlaylists);
  }

  console.log(`[Supabase Sync] Full sync completed: ${mergedLiked.length} liked, ${mergedPlaylists.length} playlists, ${mergedHistory.length} history.`);

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
