import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import {
  getSupabaseClient,
  signInWithGoogle as supaSignInGoogle,
  signInWithEmail as supaSignInEmail,
  signUpWithEmail as supaSignUpEmail,
  signOut as supaSignOut,
  performFullCloudSync,
  fetchYouTubeMusicLibraryDirect,
  apiUrl,
} from '@cassette/core';
import { youtubeMusicApiService } from './youtubeMusicApiService.js';

const AUTH_USER_KEY = 'pulse_auth_user_v2';
const YTM_SYNC_DATA_KEY = 'pulse_ytm_sync_data';
const LIKED_STORAGE_KEY = 'likedSongs';
const PLAYLISTS_STORAGE_KEY = 'pulse_playlists';
const HISTORY_STORAGE_KEY = 'pulse_playback_history';

class GoogleAuthSyncService {
  constructor() {
    this.user = null;
    this.session = null;
    this.listeners = new Set();
    this.isSyncing = false;
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      // 1. Check active Supabase session
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: { session }, error } = await client.auth.getSession();
          if (!error && session?.user) {
            this.setSessionUser(session);
          }
        } catch (e) {
          console.warn('[AuthSync] Supabase session check error:', e);
        }

        // Listen for auth state changes
        try {
          client.auth.onAuthStateChange(async (event, newSession) => {
            console.log(`[AuthSync] Auth event: ${event}`);
            if (newSession?.user) {
              this.setSessionUser(newSession);
              await this.syncYouTubeMusicLibrary();
            } else if (event === 'SIGNED_OUT') {
              this.user = null;
              this.session = null;
              await AsyncStorage.removeItem(AUTH_USER_KEY);
              this.notifyListeners();
            }
          });
        } catch (e) {
          console.warn('[AuthSync] onAuthStateChange error:', e);
        }
      }

      // 2. Fallback to stored persistent authenticated user
      if (!this.user) {
        const stored = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.id) {
              this.user = parsed;
            }
          } catch {}
        }
      }

      // 3. Listen to deep link redirects for OAuth callbacks
      Linking.addEventListener('url', async (event) => {
        if (event?.url && event.url.includes('access_token')) {
          this.handleAuthCallbackUrl(event.url);
        }
      });

      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.includes('access_token')) {
        this.handleAuthCallbackUrl(initialUrl);
      }
    } catch (err) {
      console.warn('[AuthSync] Initialization error:', err);
    } finally {
      this.isInitialized = true;
      this.notifyListeners();
    }
  }

  async handleAuthCallbackUrl(url) {
    try {
      const parsedUrl = Linking.parse(url);
      const hash = parsedUrl.queryParams || {};
      const client = getSupabaseClient();
      if (client && hash.access_token) {
        const { data: { session }, error } = await client.auth.setSession({
          access_token: hash.access_token,
          refresh_token: hash.refresh_token || '',
        });
        if (!error && session) {
          this.setSessionUser(session);
          await this.syncYouTubeMusicLibrary();
        }
      }
    } catch (err) {
      console.warn('[AuthSync] handleAuthCallbackUrl error:', err);
    }
  }

  setSessionUser(session) {
    if (!session?.user) return;
    const sUser = session.user;
    const metadata = sUser.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || sUser.email?.split('@')[0] || 'User';
    const email = sUser.email || '';
    const avatar = metadata.avatar_url || metadata.picture || '';

    let initials = 'U';
    if (fullName) {
      const parts = fullName.split(' ').filter(Boolean);
      initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : fullName.slice(0, 2).toUpperCase();
    }

    this.session = session;
    this.user = {
      id: sUser.id,
      name: fullName,
      email,
      avatarUrl: avatar,
      avatarLetter: initials,
      avatarBg: '#ea580c',
      isConnected: true,
      provider: sUser.app_metadata?.provider || 'google',
      statusText: `${sUser.app_metadata?.provider === 'google' ? 'Google' : 'Account'} Connected · Library Synced`,
      lastSyncedAt: Date.now(),
    };

    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user)).catch(() => {});
    this.notifyListeners();
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return Boolean(this.user && this.user.isConnected);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.user, this.isSyncing);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.user, this.isSyncing);
      } catch (e) {
        console.warn('[AuthSync] Listener error:', e);
      }
    });
  }

  /**
   * Initiate Google OAuth Sign-In
   */
  async signInWithGoogle() {
    this.isSyncing = true;
    this.notifyListeners();

    try {
      const client = getSupabaseClient();
      const redirectUrl = Linking.createURL('auth/callback');

      if (!client) {
        throw new Error('Supabase client is not configured.');
      }

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'email profile https://www.googleapis.com/auth/youtube.readonly',
        },
      });

      if (error) throw error;
      if (data?.url) {
        await Linking.openURL(data.url);
      }

      return { success: true };
    } catch (err) {
      console.error('[AuthSync] Google Sign-in error:', err);
      return { success: false, error: err.message };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Sign In with Email & Password
   */
  async signInWithEmail(email, password) {
    this.isSyncing = true;
    this.notifyListeners();

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client is not configured.');

      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (data?.session) {
        this.setSessionUser(data.session);
        await this.syncYouTubeMusicLibrary();
        return { success: true, user: this.user };
      }
      return { success: false, error: 'No session returned' };
    } catch (err) {
      console.error('[AuthSync] Email Sign-in error:', err);
      return { success: false, error: err.message };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Sign Up with Email & Password
   */
  async signUpWithEmail(email, password, fullName = '') {
    this.isSyncing = true;
    this.notifyListeners();

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client is not configured.');

      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim(), name: fullName.trim() },
        },
      });

      if (error) throw error;
      if (data?.session) {
        this.setSessionUser(data.session);
        await this.syncYouTubeMusicLibrary();
        return { success: true, user: this.user };
      }
      return { success: true, requiresEmailVerification: true };
    } catch (err) {
      console.error('[AuthSync] Sign-up error:', err);
      return { success: false, error: err.message };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Reset Password
   */
  async resetPassword(email) {
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client is not configured.');
      const { error } = await client.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Sign Out current user
   */
  async signOut() {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut().catch(() => {});
      }
      this.user = null;
      this.session = null;
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      this.notifyListeners();
      return { success: true };
    } catch (err) {
      console.error('[AuthSync] Sign out error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Real YouTube Music Library & Supabase Cloud Sync
   */
  async syncYouTubeMusicLibrary() {
    this.isSyncing = true;
    this.notifyListeners();

    try {
      const currentLikedRaw = await AsyncStorage.getItem(LIKED_STORAGE_KEY);
      const currentPlaylistsRaw = await AsyncStorage.getItem(PLAYLISTS_STORAGE_KEY);
      const currentHistoryRaw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);

      const localLiked = currentLikedRaw ? JSON.parse(currentLikedRaw) : [];
      const localPlaylists = currentPlaylistsRaw ? JSON.parse(currentPlaylistsRaw) : [];
      const localHistory = currentHistoryRaw ? JSON.parse(currentHistoryRaw) : [];

      let mergedLiked = [...localLiked];
      let mergedPlaylists = [...localPlaylists];
      let mergedHistory = [...localHistory];

      // 1. If user is authenticated in Supabase, execute bidirectional cloud sync
      if (this.user?.id) {
        try {
          const cloudResult = await performFullCloudSync(this.user.id, {
            liked: localLiked,
            playlists: localPlaylists,
            history: localHistory,
          });

          if (cloudResult) {
            if (Array.isArray(cloudResult.liked)) mergedLiked = cloudResult.liked;
            if (Array.isArray(cloudResult.playlists)) mergedPlaylists = cloudResult.playlists;
            if (Array.isArray(cloudResult.history)) mergedHistory = cloudResult.history;
          }
        } catch (cloudErr) {
          console.warn('[AuthSync] Supabase cloud sync notice:', cloudErr.message);
        }
      }

      // 2. Fetch live YouTube Music Library from backend pipeline (/api/ytmusic/library)
      try {
        const ytmRes = await fetch(apiUrl('/api/ytmusic/library'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).catch(() => null);

        if (ytmRes && ytmRes.ok) {
          const ytmData = await ytmRes.json().catch(() => null);
          if (ytmData) {
            // Merge liked songs
            if (Array.isArray(ytmData.liked) && ytmData.liked.length > 0) {
              const likedMap = new Map();
              [...ytmData.liked, ...mergedLiked].forEach((s) => {
                const id = s.id || s.videoId;
                if (id) likedMap.set(id, s);
              });
              mergedLiked = Array.from(likedMap.values());
            }

            // Merge playlists
            if (Array.isArray(ytmData.playlists) && ytmData.playlists.length > 0) {
              const plMap = new Map();
              [...ytmData.playlists, ...mergedPlaylists].forEach((p) => {
                const id = p.id || p.title;
                if (id) plMap.set(id, p);
              });
              mergedPlaylists = Array.from(plMap.values());
            }
          }
        }
      } catch (ytmErr) {
        console.warn('[AuthSync] YouTube Music API notice:', ytmErr.message);
      }

      // 3. Persist merged data to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(mergedLiked)),
        AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(mergedPlaylists)),
        AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(mergedHistory)),
        AsyncStorage.setItem(
          YTM_SYNC_DATA_KEY,
          JSON.stringify({
            syncedAt: Date.now(),
            likedCount: mergedLiked.length,
            playlistCount: mergedPlaylists.length,
            historyCount: mergedHistory.length,
          })
        ),
      ]);

      if (this.user) {
        this.user = {
          ...this.user,
          lastSyncedAt: Date.now(),
          statusText: 'Google Connected · Library Synced',
        };
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user));
      }

      return {
        success: true,
        data: {
          liked: mergedLiked,
          playlists: mergedPlaylists,
          history: mergedHistory,
          likedCount: mergedLiked.length,
          playlistCount: mergedPlaylists.length,
        },
      };
    } catch (err) {
      console.error('[AuthSync] Sync error:', err);
      return { success: false, error: err.message };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }
}

export const googleAuthSyncService = new GoogleAuthSyncService();
