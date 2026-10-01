// ── Stores ──
export * from './stores/playerStore.js';
export * from './stores/authStore.js';
export * from './stores/settingsStore.js';

// ── Auth & Supabase ──
export {
  supabase,
  getSupabaseClient,
  getSupabaseCredentials,
  isSupabaseConfigured,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  syncLikedSongsCloud,
  fetchLikedSongsCloud,
  syncPlaylistsCloud,
  fetchPlaylistsCloud,
  syncHistoryCloud,
  fetchHistoryCloud,
  performFullCloudSync,
} from './auth/supabaseClient.js';
export * from './auth/authSync.js';

// ── Streaming & YouTube Services ──
export * from './services/innertube.js';
export * from './services/audioStreamResolver.js';
export * from './services/spotifyService.js';
export * from './services/offlineStorage.js';

// ── Utilities ──
export * from './utils/youtubeEngine.js';
export * from './utils/saavn.js';
export * from './utils/lrcParser.js';
export * from './utils/imageUtils.js';
export * from './utils/timeFormat.js';
export * from './utils/apiConfig.js';
