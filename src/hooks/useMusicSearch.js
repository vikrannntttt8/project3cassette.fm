import { useState, useCallback, useRef } from 'react';
import { apiUrl } from '../utils/apiConfig.js';

export const SEARCH_TABS = ['all', 'songs', 'albums', 'artists'];

/**
 * useMusicSearch — YouTube Music / Innertube powered search hook
 *
 * Manages debounced search across tabs: All | Songs | Albums | Artists
 * `results` shape:
 *   - 'all'       → { songs[], albums[], artists[], playlists[] }
 *   - 'songs'     → Song[]
 *   - 'albums'    → Album[]
 *   - 'artists'   → Artist[]
 */
export function useMusicSearch() {
  const [results,      setResults]      = useState(null); // null = not searched yet
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [activeTab,    setActiveTab]    = useState('all');
  const [query,        setQuery]        = useState('');

  const debounceRef = useRef(null);

  /** Execute a search for the current query and given tab */
  const executeSearch = useCallback(async (q, tab) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(q.trim())}&type=${tab}`));
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      if (Array.isArray(data)) {
        if (tab === 'all') {
          const songs = data.filter(item => !item.type || item.type === 'song');
          const albums = data.filter(item => item.type === 'album');
          const artists = data.filter(item => item.type === 'artist');
          setResults({
            songs,
            albums,
            artists,
            playlists: [],
          });
          return;
        }
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(err.message || 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Debounced query update — triggers after 350ms idle */
  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults(null); return; }
    debounceRef.current = setTimeout(() => {
      executeSearch(q, activeTab);
    }, 350);
  }, [activeTab, executeSearch]);

  /** Switch tab and re-run search for current query */
  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    if (query.trim()) {
      executeSearch(query, tab);
    }
  }, [query, executeSearch]);

  /** Clear everything */
  const clear = useCallback(() => {
    clearTimeout(debounceRef.current);
    setQuery('');
    setResults(null);
    setError(null);
  }, []);

  return {
    query, results, loading, error, activeTab,
    search, switchTab, clear,
  };
}
