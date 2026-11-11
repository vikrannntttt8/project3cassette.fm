import { Capacitor, registerPlugin } from '@capacitor/core';
import { apiUrl } from '../utils/apiConfig.js';

// Native YouTubeAuth Capacitor plugin interface
const NativeYouTubeAuth = registerPlugin('YouTubeAuth');

const COOKIE_STORAGE_KEY = 'yt_music_session_cookie';
const USER_STORAGE_KEY = 'yt_music_user_profile';

/**
 * Check if the app is running in a native Capacitor environment (Android/iOS)
 */
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

/**
 * Retrieve saved YouTube session cookie
 */
export function getSavedCookie() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COOKIE_STORAGE_KEY) || null;
}

/**
 * Retrieve saved YouTube user profile
 */
export function getSavedUserProfile() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Check if user is currently logged in with a valid YouTube session
 */
export function isUserLoggedIn() {
  const cookie = getSavedCookie();
  return !!(cookie && (cookie.includes('SAPISID') || cookie.includes('__Secure-3PAPISID') || cookie.includes('LOGIN_INFO') || cookie.includes('SID=')));
}

/**
 * Login with Google / YouTube Music.
 * On native Android, opens an in-app WebView directly to Google sign-in.
 * Once cookies are captured, sends them to the backend Node proxy to initialize InnerTube without CORS.
 */
export async function signInWithYouTube(manualCookie = null) {
  let cookieString = manualCookie;

  if (!cookieString) {
    if (isNativeApp()) {
      console.log('[YouTubeAuth] Opening native Google login WebView...');
      const result = await NativeYouTubeAuth.login();
      if (!result || !result.cookie) {
        throw new Error('Google login did not return session cookies');
      }
      cookieString = result.cookie;
    } else {
      throw new Error('Native platform required for automated in-app WebView. Please provide session cookie manually in web dev mode.');
    }
  }

  // Persist session cookie locally
  localStorage.setItem(COOKIE_STORAGE_KEY, cookieString);

  // Sync session with backend Node proxy (runs with ZERO CORS)
  console.log('[YouTubeAuth] Initializing authenticated YouTube session on backend...');
  const res = await fetch(apiUrl('/api/auth/session'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cookie: cookieString }),
  });

  if (!res.ok) {
    throw new Error(`Failed to activate YouTube session: HTTP ${res.status}`);
  }

  const data = await res.json();
  const userProfile = data.user || {
    id: 'yt_user_' + Date.now(),
    name: 'YouTube Music Listener',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    handle: '@youtubemusic',
    isYouTubeAccount: true,
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));

  return {
    success: true,
    user: userProfile,
    cookie: cookieString,
  };
}

/**
 * Sign out of YouTube Music and clear all cookies and cached session
 */
export async function signOutYouTube() {
  try {
    if (isNativeApp()) {
      await NativeYouTubeAuth.logout().catch(() => {});
    }
  } catch (err) {
    console.warn('[YouTubeAuth] Native logout warning:', err);
  }

  try {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST' }).catch(() => {});
  } catch (err) {
    console.warn('[YouTubeAuth] Backend logout warning:', err);
  }

  localStorage.removeItem(COOKIE_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);

  return { success: true };
}

/**
 * 2-Way Sync: Like a song directly on YouTube Music
 */
export async function likeSongOnYouTube(videoId) {
  if (!isUserLoggedIn() || !videoId) return false;
  try {
    const res = await fetch(apiUrl('/api/like'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    });
    const result = await res.json();
    console.log(`[YouTubeSync] Track ${videoId} liked on YouTube Music!`, result);
    return true;
  } catch (err) {
    console.error(`[YouTubeSync] Failed to like ${videoId} on YouTube:`, err);
    return false;
  }
}

/**
 * 2-Way Sync: Remove Like from a song on YouTube Music
 */
export async function removeLikeOnYouTube(videoId) {
  if (!isUserLoggedIn() || !videoId) return false;
  try {
    const res = await fetch(apiUrl('/api/unlike'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    });
    const result = await res.json();
    console.log(`[YouTubeSync] Track ${videoId} unliked on YouTube Music!`, result);
    return true;
  } catch (err) {
    console.error(`[YouTubeSync] Failed to remove like for ${videoId} on YouTube:`, err);
    return false;
  }
}

/**
 * 2-Way Sync: Subscribe to an Artist / Channel
 */
export async function subscribeArtistOnYouTube(channelId) {
  if (!isUserLoggedIn() || !channelId) return false;
  try {
    const res = await fetch(apiUrl('/api/subscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
    return res.ok;
  } catch (err) {
    console.error(`[YouTubeSync] Failed to subscribe to ${channelId}:`, err);
    return false;
  }
}

/**
 * 2-Way Sync: Unsubscribe from an Artist / Channel
 */
export async function unsubscribeArtistOnYouTube(channelId) {
  if (!isUserLoggedIn() || !channelId) return false;
  try {
    const res = await fetch(apiUrl('/api/unsubscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
    return res.ok;
  } catch (err) {
    console.error(`[YouTubeSync] Failed to unsubscribe from ${channelId}:`, err);
    return false;
  }
}

/**
 * Fetch user's real YouTube Music Playlists & Liked Music
 */
export async function fetchYouTubeLibrary() {
  if (!isUserLoggedIn()) return null;
  try {
    const res = await fetch(apiUrl('/api/ytmusic/library'));
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[YouTubeSync] Failed to fetch YouTube library:', err);
    return null;
  }
}
