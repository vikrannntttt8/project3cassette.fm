import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'pulse_supabase_url';
const STORAGE_KEY_KEY = 'pulse_supabase_anon_key';

let supabaseClient = null;

export function getSupabaseCredentials() {
  const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem(STORAGE_URL_KEY) || '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem(STORAGE_KEY_KEY) || '';
  return { url: url.trim(), anonKey: anonKey.trim() };
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
      console.warn('[Supabase] Client init failed:', err.message);
    }
  }
  return null;
}

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
    throw new Error('Supabase is not configured. Please set your Supabase Project URL and Anon Key in Settings.');
  }

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * 2. Sign Out
 */
export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) console.error('[Supabase] Sign out error:', error.message);
}

/**
 * 3. Cloud Sync: Liked Songs
 */
export async function syncLikedSongsCloud(userId, likedSongs) {
  const client = getSupabaseClient();
  if (!client || !userId || !Array.isArray(likedSongs)) return;

  try {
    const rows = likedSongs.map((song) => ({
      user_id: userId,
      song_id: song.id,
      song_data: song,
    }));

    if (rows.length > 0) {
      const { error } = await client
        .from('liked_songs')
        .upsert(rows, { onConflict: 'user_id,song_id' });
      if (error) console.error('[Supabase] syncLikedSongs error:', error);
    }
  } catch (e) {
    console.warn('[Supabase] syncLikedSongs failed:', e.message);
  }
}

export async function fetchLikedSongsCloud(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return [];

  try {
    const { data, error } = await client
      .from('liked_songs')
      .select('song_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] fetchLikedSongs error:', error);
      return [];
    }
    return (data || []).map((row) => row.song_data);
  } catch (e) {
    console.warn('[Supabase] fetchLikedSongs failed:', e.message);
    return [];
  }
}

/**
 * 4. Cloud Sync: Custom Playlists
 */
export async function syncPlaylistsCloud(userId, playlists) {
  const client = getSupabaseClient();
  if (!client || !userId || !Array.isArray(playlists)) return;

  try {
    for (const pl of playlists) {
      const { error } = await client
        .from('user_playlists')
        .upsert({
          id: pl.id.length >= 30 ? pl.id : undefined,
          user_id: userId,
          name: pl.name,
          songs: pl.songs || [],
          updated_at: new Date().toISOString(),
        });
      if (error) console.error('[Supabase] syncPlaylist error:', error);
    }
  } catch (e) {
    console.warn('[Supabase] syncPlaylists failed:', e.message);
  }
}

export async function fetchPlaylistsCloud(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return [];

  try {
    const { data, error } = await client
      .from('user_playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Supabase] fetchPlaylists error:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      songs: row.songs || [],
    }));
  } catch (e) {
    console.warn('[Supabase] fetchPlaylists failed:', e.message);
    return [];
  }
}

/**
 * 5. Cloud Sync: Playback History
 */
export async function saveHistoryItemCloud(userId, song) {
  const client = getSupabaseClient();
  if (!client || !userId || !song) return;

  try {
    await client.from('playback_history').insert({
      user_id: userId,
      song_data: song,
      played_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Supabase] saveHistoryItem failed:', e.message);
  }
}

export async function fetchHistoryCloud(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return [];

  try {
    const { data, error } = await client
      .from('playback_history')
      .select('song_data')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(50);

    if (error) return [];
    return (data || []).map((row) => row.song_data);
  } catch (e) {
    return [];
  }
}
