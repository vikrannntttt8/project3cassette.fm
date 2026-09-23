/**
 * authSync.js — Multi-Mode Authentication & InnerTube Account Sync Manager
 * ──────────────────────────────────────────────────────────────────────────
 * Supports:
 *   - Mode A: SAPISID / YouTube Music Cookie String (with auto-extraction & header generation)
 *   - Mode B: OAuth 2.0 Credentials JSON Blob (with access_token validation)
 *   - Mode C: InnerTube Visitor Data Token
 * ──────────────────────────────────────────────────────────────────────────
 */

import CryptoJS from 'crypto-js';

export const AUTH_STORAGE_KEY = 'pulse_auth_config';

/**
 * Default empty auth state
 */
export const DEFAULT_AUTH_CONFIG = {
  mode: 'sapisid', // 'sapisid' | 'oauth'
  sapisid: '',
  ytmusicCookie: '',
  visitorData: '',
  oauthJson: '',
  oauthData: null,
  status: 'unconfigured', // 'unconfigured' | 'connected' | 'error' | 'expired'
  lastTested: null,
  accountName: '',
  errorMessage: '',
};

/**
 * Retrieve persisted auth configuration from localStorage
 */
export function getAuthConfig() {
  if (typeof window === 'undefined') return { ...DEFAULT_AUTH_CONFIG };
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const legacyCookie = localStorage.getItem('pulse_yt_cookie') || '';
    const legacyVisitor = localStorage.getItem('pulse_visitor_data') || '';
    const legacyToken = localStorage.getItem('pulse_yt_token') || '';

    if (!raw) {
      return {
        ...DEFAULT_AUTH_CONFIG,
        mode: 'sapisid',
        sapisid: legacyToken.trim() || extractSapisid(legacyCookie),
        ytmusicCookie: legacyCookie.trim(),
        visitorData: legacyVisitor.trim(),
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUTH_CONFIG,
      ...parsed,
      ytmusicCookie: parsed.ytmusicCookie || legacyCookie || '',
      visitorData: parsed.visitorData || legacyVisitor || '',
      sapisid: parsed.sapisid || legacyToken || extractSapisid(parsed.ytmusicCookie || legacyCookie),
    };
  } catch (err) {
    console.warn('[AuthSync] Error parsing stored auth config:', err);
    return { ...DEFAULT_AUTH_CONFIG };
  }
}

/**
 * Persist auth configuration to localStorage
 */
export function saveAuthConfig(config) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(config));
    if (config.ytmusicCookie) {
      localStorage.setItem('pulse_yt_cookie', config.ytmusicCookie);
    }
    if (config.visitorData) {
      localStorage.setItem('pulse_visitor_data', config.visitorData);
    }
    if (config.sapisid) {
      localStorage.setItem('pulse_yt_token', config.sapisid);
    }
  } catch (err) {
    console.error('[AuthSync] Failed to persist auth config:', err);
  }
}

/**
 * Extract SAPISID or clean cookie string from cURL commands, header strings, or raw tokens
 */
export function extractSapisid(cookieStr) {
  if (!cookieStr || typeof cookieStr !== 'string') return '';
  const trimmed = cookieStr.trim();

  // If user pasted a full cURL command or header line: -H 'cookie: ...'
  const curlMatch = trimmed.match(/cookie:\s*([^\r\n"']+)/i);
  const target = curlMatch ? curlMatch[1] : trimmed;

  // Match SAPISID or __Secure-3PAPISID or __Secure-1PAPISID
  const match = target.match(/(?:SAPISID|__Secure-3PAPISID|__Secure-1PAPISID)=([^;]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return target;
}

/**
 * Clean and format full cookie string for InnerTube
 */
export function formatYTMAuthCookie(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return '';
  let str = inputStr.trim();

  // Extract from cURL header if copied as cURL
  const curlMatch = str.match(/cookie:\s*['"]?([^'"]+)['"]?/i);
  if (curlMatch && curlMatch[1]) {
    str = curlMatch[1].trim();
  }

  return str;
}

/**
 * Generate SAPISIDHASH header value
 * Algorithm: SHA1(`${timestamp} ${sapisid} ${origin}`)
 * Format: `SAPISIDHASH ${timestamp}_${hash}`
 */
export function generateSapisidHash(sapisid, origin = 'https://music.youtube.com') {
  if (!sapisid) return '';
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp} ${sapisid} ${origin}`;
  const hash = CryptoJS.SHA1(payload).toString(CryptoJS.enc.Hex);
  return `SAPISIDHASH ${timestamp}_${hash}`;
}

/**
 * Validate and parse OAuth JSON blob
 */
export function parseAndValidateOAuthJson(jsonString) {
  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    throw new Error('OAuth JSON payload is empty');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString.trim());
  } catch {
    throw new Error('Invalid JSON format. Please paste a valid JSON object.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Payload must be a valid JSON object');
  }

  const accessToken = parsed.access_token || parsed.accessToken;
  if (!accessToken || typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Missing "access_token" in OAuth JSON');
  }

  return {
    access_token: accessToken.trim(),
    refresh_token: parsed.refresh_token || parsed.refreshToken || '',
    token_type: parsed.token_type || 'Bearer',
    expiry_date: parsed.expiry_date || parsed.expires_at || null,
  };
}

/**
 * Get HTTP headers for authenticated InnerTube requests
 */
export function getInnertubeAuthHeaders(origin = 'https://music.youtube.com') {
  const config = getAuthConfig();
  const headers = {
    'Content-Type': 'application/json',
    'X-YouTube-Client-Name': '67', // WEB_REMIX YouTube Music client
    'X-YouTube-Client-Version': '1.20250101.01.00',
    'X-Origin': origin,
  };

  if (config.ytmusicCookie) {
    headers['x-ytmusic-cookie'] = config.ytmusicCookie;
    headers['Cookie'] = config.ytmusicCookie;
  }

  if (config.visitorData) {
    headers['x-visitor-data'] = config.visitorData;
  }

  if (config.mode === 'oauth' && config.oauthData?.access_token) {
    headers['Authorization'] = `Bearer ${config.oauthData.access_token}`;
  } else if (config.sapisid) {
    const sapisid = extractSapisid(config.sapisid);
    if (sapisid) {
      headers['Authorization'] = generateSapisidHash(sapisid, origin);
      headers['X-Goog-AuthUser'] = '0';
    }
  }

  return headers;
}

/**
 * Test InnerTube authentication and sync connectivity
 */
export async function testSyncConnection(customConfig = null) {
  const config = customConfig || getAuthConfig();
  const cookie = config.ytmusicCookie || config.sapisid || '';
  const sapisid = config.sapisid ? extractSapisid(config.sapisid) : extractSapisid(config.ytmusicCookie);
  const visitorData = config.visitorData || '';

  if (!cookie && !sapisid && !config.oauthData?.access_token) {
    return { success: false, message: 'Please enter a YouTube Music cookie, SAPISID token, or OAuth blob first' };
  }

  try {
    const testRes = await fetch('/api/sync/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: config.mode,
        cookie,
        sapisid,
        visitorData,
        accessToken: config.oauthData?.access_token || '',
      }),
    });

    if (testRes.ok) {
      const data = await testRes.json();
      const updated = {
        ...config,
        status: 'connected',
        lastTested: Date.now(),
        accountName: data.accountName || 'YouTube Music Connected',
        errorMessage: '',
      };
      saveAuthConfig(updated);
      return { success: true, message: 'Connected / Session Verified', accountName: updated.accountName };
    }

    const errData = await testRes.json().catch(() => ({}));
    const updated = {
      ...config,
      status: 'error',
      lastTested: Date.now(),
      errorMessage: errData.message || `HTTP ${testRes.status}`,
    };
    saveAuthConfig(updated);
    return { success: false, message: errData.message || `Verification failed (${testRes.status})` };
  } catch (err) {
    console.error('[AuthSync] Test error:', err);
    return { success: false, message: err.message || 'Connection error. Check network or server.' };
  }
}

/**
 * Direct call to /api/ytmusic/library
 */
export async function fetchYouTubeMusicLibraryDirect(customConfig = null) {
  const config = customConfig || getAuthConfig();
  const cookie = config.ytmusicCookie || config.sapisid || '';
  const sapisid = config.sapisid ? extractSapisid(config.sapisid) : extractSapisid(config.ytmusicCookie);
  const visitorData = config.visitorData || '';

  const res = await fetch('/api/ytmusic/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cookie,
      sapisid,
      visitorData,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

