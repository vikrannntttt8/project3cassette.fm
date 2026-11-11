import { Capacitor, registerPlugin } from '@capacitor/core';
import { getInnertube } from './innertube.js';

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
 * On web desktop, provides cookie injection / developer prompt.
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

  // Persist session cookie
  localStorage.setItem(COOKIE_STORAGE_KEY, cookieString);

  // Initialize / refresh InnerTube with the authenticated session
  const yt = await getInnertube(true);

  // Fetch user profile from YouTube
  let userProfile = {
    id: 'yt_user_' + Date.now(),
    name: 'YouTube Music Listener',
    email: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    handle: '@youtubemusic',
    isYouTubeAccount: true,
  };

  try {
    // Attempt to extract real channel/account details via getLibrary
    const library = await yt.music.getLibrary().catch(() => null);
    if (library?.header?.title?.text) {
      userProfile.name = library.header.title.text;
    }
    if (library?.header?.thumbnails?.[0]?.url) {
      userProfile.avatar = library.header.thumbnails[0].url;
    }
  } catch (err) {
    console.warn('[YouTubeAuth] Could not extract profile header, using defaults:', err);
  }

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

  localStorage.removeItem(COOKIE_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);

  // Reinitialize Innertube as guest
  await getInnertube(true).catch(() => {});

  return { success: true };
}

/**
 * 2-Way Sync: Like a song directly on YouTube Music
 */
export async function likeSongOnYouTube(videoId) {
  if (!isUserLoggedIn() || !videoId) return false;
  try {
    const yt = await getInnertube();
    await yt.session.actions.execute('/like/like', {
      target: { videoId },
    });
    console.log(`[YouTubeSync] Track ${videoId} liked on YouTube Music!`);
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
    const yt = await getInnertube();
    await yt.session.actions.execute('/like/removelike', {
      target: { videoId },
    });
    console.log(`[YouTubeSync] Track ${videoId} unliked on YouTube Music!`);
    return true;
  } catch (err) {
    console.error(`[YouTubeSync] Failed to remove like for ${videoId} on YouTube:`, err);
    return false;
  }
}

/**
 * 2-Way Sync: Dislike a song on YouTube Music
 */
export async function dislikeSongOnYouTube(videoId) {
  if (!isUserLoggedIn() || !videoId) return false;
  try {
    const yt = await getInnertube();
    await yt.session.actions.execute('/like/dislike', {
      target: { videoId },
    });
    return true;
  } catch (err) {
    console.error(`[YouTubeSync] Failed to dislike ${videoId} on YouTube:`, err);
    return false;
  }
}

/**
 * 2-Way Sync: Subscribe to an Artist / Channel
 */
export async function subscribeArtistOnYouTube(channelId) {
  if (!isUserLoggedIn() || !channelId) return false;
  try {
    const yt = await getInnertube();
    await yt.session.actions.execute('/subscription/subscribe', {
      channelIds: [channelId],
    });
    console.log(`[YouTubeSync] Subscribed to artist ${channelId} on YouTube Music!`);
    return true;
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
    const yt = await getInnertube();
    await yt.session.actions.execute('/subscription/unsubscribe', {
      channelIds: [channelId],
    });
    console.log(`[YouTubeSync] Unsubscribed from artist ${channelId} on YouTube Music!`);
    return true;
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
    const yt = await getInnertube();
    const library = await yt.music.getLibrary();
    return library;
  } catch (err) {
    console.error('[YouTubeSync] Failed to fetch YouTube library:', err);
    return null;
  }
}
