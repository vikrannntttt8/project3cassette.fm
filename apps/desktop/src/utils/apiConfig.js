/**
 * Centralized API Base URL Resolver
 * Supports custom VITE_API_URL or relative /api/ routes for Vercel & Vite rewrites.
 */
export const API_BASE = (
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : ''
).replace(/\/$/, '');

/**
 * Returns a fully qualified or clean relative URL for API requests.
 * @param {string} path - e.g. '/api/search'
 * @returns {string} - e.g. 'https://my-backend.vercel.app/api/search' or '/api/search'
 */
export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
