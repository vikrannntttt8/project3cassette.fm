/**
 * storage.js — Unified Cross-Platform Storage Adapter
 * ──────────────────────────────────────────────────────────────────────────
 * Seamlessly abstracts Web localStorage and React Native AsyncStorage.
 * Eliminates crashes when 'window' or 'localStorage' are undefined in mobile.
 * ──────────────────────────────────────────────────────────────────────────
 */

// Determine execution environment safely
export function isReactNative() {
  try {
    return (
      (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') ||
      Boolean(typeof globalThis !== 'undefined' && (globalThis.__fbBatchedBridge || globalThis.HermesInternal || globalThis.nativeCallSyncHook))
    );
  } catch {
    return false;
  }
}

// In-memory cache for synchronous reads & fallback
const inMemoryCache = new Map();

// ── SAFE DUMMY STORAGE POLYFILL ──────────────────────────────────────────
// Guarantees that any direct call to `localStorage` or `sessionStorage` in native
// does not halt the JS thread or throw ReferenceError / freeze the splash screen.
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = {
      getItem: (key) => inMemoryCache.get(String(key)) || null,
      setItem: (key, val) => inMemoryCache.set(String(key), String(val)),
      removeItem: (key) => inMemoryCache.delete(String(key)),
      clear: () => inMemoryCache.clear(),
      key: (i) => Array.from(inMemoryCache.keys())[i] || null,
      get length() { return inMemoryCache.size; },
    };
  }
  if (typeof globalThis.sessionStorage === 'undefined') {
    const sessionMap = new Map();
    globalThis.sessionStorage = {
      getItem: (key) => sessionMap.get(String(key)) || null,
      setItem: (key, val) => sessionMap.set(String(key), String(val)),
      removeItem: (key) => sessionMap.delete(String(key)),
      clear: () => sessionMap.clear(),
      key: (i) => Array.from(sessionMap.keys())[i] || null,
      get length() { return sessionMap.size; },
    };
  }
  if (typeof window !== 'undefined') {
    if (typeof window.localStorage === 'undefined') {
      window.localStorage = globalThis.localStorage;
    }
    if (typeof window.sessionStorage === 'undefined') {
      window.sessionStorage = globalThis.sessionStorage;
    }
  }
}

export function isBrowserStorageAvailable() {
  if (isReactNative()) return false;
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined' &&
      typeof window.localStorage.getItem === 'function'
    );
  } catch {
    return false;
  }
}

let nativeAsyncStorage = null;

// Attempt to load React Native AsyncStorage dynamically only in React Native environments
try {
  if (typeof require !== 'undefined') {
    const rnas = require('@react-native-async-storage/async-storage');
    nativeAsyncStorage = rnas?.default || rnas;
  }
} catch {
  nativeAsyncStorage = null;
}

/**
 * Synchronous read (Safe on Web, React Native, and Node)
 */
export function getStoredItem(key, defaultValue = null) {
  if (!key) return defaultValue;
  try {
    if (isBrowserStorageAvailable()) {
      const val = window.localStorage.getItem(key);
      return val !== null ? val : defaultValue;
    }
  } catch {
    // Ignore DOMException / security error in restricted iframes
  }

  // Fallback to in-memory cache
  return inMemoryCache.has(key) ? inMemoryCache.get(key) : defaultValue;
}

/**
 * Synchronous write (Updates localStorage if available, in-memory cache, and syncs to AsyncStorage)
 */
export function setStoredItem(key, value) {
  if (!key) return;
  const strVal = String(value);

  // Update in-memory cache immediately
  inMemoryCache.set(key, strVal);

  if (isBrowserStorageAvailable()) {
    try {
      window.localStorage.setItem(key, strVal);
    } catch (err) {
      console.warn('[Storage] localStorage.setItem failed:', err);
    }
  }

  // Also write to React Native AsyncStorage asynchronously in RN environment
  if (isReactNative() && nativeAsyncStorage && typeof nativeAsyncStorage.setItem === 'function') {
    nativeAsyncStorage.setItem(key, strVal).catch(() => {});
  }
}

/**
 * Synchronous remove
 */
export function removeStoredItem(key) {
  if (!key) return;
  inMemoryCache.delete(key);

  if (isBrowserStorageAvailable()) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }

  if (isReactNative() && nativeAsyncStorage && typeof nativeAsyncStorage.removeItem === 'function') {
    nativeAsyncStorage.removeItem(key).catch(() => {});
  }
}

/**
 * Asynchronous read with a 250ms failsafe timeout so unresolved native promises cannot hang the app
 */
export async function getStoredItemAsync(key, defaultValue = null) {
  if (!key) return defaultValue;

  if (isReactNative() && nativeAsyncStorage && typeof nativeAsyncStorage.getItem === 'function') {
    try {
      const asyncOp = nativeAsyncStorage.getItem(key);
      const timeout = new Promise((res) => setTimeout(() => res(null), 250));
      const val = await Promise.race([asyncOp, timeout]);
      if (val !== null && val !== undefined) {
        inMemoryCache.set(key, val);
        return val;
      }
    } catch (err) {
      console.warn('[Storage] AsyncStorage.getItem failed:', err);
    }
  }

  return getStoredItem(key, defaultValue);
}

/**
 * Asynchronous write
 */
export async function setStoredItemAsync(key, value) {
  if (!key) return;
  const strVal = String(value);
  inMemoryCache.set(key, strVal);

  if (isBrowserStorageAvailable()) {
    try {
      window.localStorage.setItem(key, strVal);
    } catch {}
  }

  if (isReactNative() && nativeAsyncStorage && typeof nativeAsyncStorage.setItem === 'function') {
    try {
      await nativeAsyncStorage.setItem(key, strVal);
    } catch (err) {
      console.warn('[Storage] AsyncStorage.setItem failed:', err);
    }
  }
}

/**
 * Asynchronous remove
 */
export async function removeStoredItemAsync(key) {
  if (!key) return;
  inMemoryCache.delete(key);

  if (isBrowserStorageAvailable()) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }

  if (isReactNative() && nativeAsyncStorage && typeof nativeAsyncStorage.removeItem === 'function') {
    try {
      await nativeAsyncStorage.removeItem(key);
    } catch (err) {
      console.warn('[Storage] AsyncStorage.removeItem failed:', err);
    }
  }
}

/**
 * Supabase auth storage adapter compatible with @supabase/supabase-js
 */
export const supabaseStorageAdapter = {
  getItem: (key) => getStoredItemAsync(key),
  setItem: (key, value) => setStoredItemAsync(key, value),
  removeItem: (key) => removeStoredItemAsync(key),
};

/**
 * Preload commonly accessed keys from AsyncStorage into memory cache on mobile startup
 */
export async function hydrateMobileStorage(keys = []) {
  if (!isReactNative() || !nativeAsyncStorage || typeof nativeAsyncStorage.multiGet !== 'function') return;
  try {
    const multiGetOp = nativeAsyncStorage.multiGet(keys);
    const timeout = new Promise((res) => setTimeout(() => res([]), 300));
    const pairs = await Promise.race([multiGetOp, timeout]);
    if (Array.isArray(pairs)) {
      pairs.forEach(([k, v]) => {
        if (v !== null) inMemoryCache.set(k, v);
      });
    }
  } catch (err) {
    console.warn('[Storage] Storage hydration warning:', err);
  }
}
