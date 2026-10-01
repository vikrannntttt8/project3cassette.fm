import { useState, useCallback, useRef } from 'react';
import { apiUrl } from '../utils/apiConfig.js';
import { FALLBACK_HOME_FEED } from '../data/fallbackFeed.js';

export const SEARCH_TABS = ['all', 'songs', 'albums', 'artists'];

/**
 * useMusicSearch — High-performance YouTube Music search hook
 *
 * Direct, single-endpoint search with:
 * - 450ms Debounce delay
 * - In-flight AbortController cancellation
 * - Local offline catalog fallback (no external proxy waterfalls)
 * - Safe concurrent submit guards
 */
export function useMusicSearch() {
  const [results, setResults] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');

  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const inFlightRef = useRef({ query: '', tab: '' });

  /** Execute search against single /api/search endpoint */
  const executeSearch = useCallback(async (q, tab) => {
    const trimmed = q.trim();
    if (!trimmed) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      inFlightRef.current = { query: '', tab: '' };
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel previous in-flight fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    inFlightRef.current = { query: trimmed, tab };

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(trimmed)}&type=${tab}`), {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Search request failed with status ${res.status}`);
      }

      const data = await res.json();

      // Handle server error response
      if (data && data.success === false) {
        throw new Error(data.error || 'Search service error');
      }

      // Handle Array of results
      const rawList = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);

      if (rawList.length > 0) {
        if (tab === 'all') {
          setResults({
            songs: rawList.filter(item => !item.type || item.type === 'song'),
            albums: rawList.filter(item => item.type === 'album'),
            artists: rawList.filter(item => item.type === 'artist'),
            playlists: [],
          });
          return;
        }
        setResults(rawList);
        return;
      } else if (data && typeof data === 'object' && !Array.isArray(data) && (data.songs?.length || data.albums?.length || data.artists?.length)) {
        setResults(data);
        return;
      }

      // If empty results from server, check local fallback catalog
      throw new Error('No direct search results');
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('[useMusicSearch] Server search note:', err.message);

      // Clean local catalog filter fallback (Zero external network proxy calls)
      try {
        const cleanQ = trimmed.toLowerCase();
        const allTracks = FALLBACK_HOME_FEED.featuredTracks || [];
        const allAlbums = FALLBACK_HOME_FEED.trendingAlbums || [];

        const matchedSongs = allTracks.filter(t => 
          t.title?.toLowerCase().includes(cleanQ) || 
          t.artist?.toLowerCase().includes(cleanQ) ||
          t.album?.toLowerCase().includes(cleanQ)
        );

        const matchedAlbums = allAlbums.filter(a =>
          a.title?.toLowerCase().includes(cleanQ) ||
          a.artist?.toLowerCase().includes(cleanQ)
        );

        const matchedArtists = [];
        const artistSet = new Set();
        allTracks.forEach(t => {
          if (t.artist && t.artist.toLowerCase().includes(cleanQ) && !artistSet.has(t.artist)) {
            artistSet.add(t.artist);
            matchedArtists.push({
              id: t.artistId || `art_${t.id}`,
              name: t.artist,
              title: t.artist,
              thumbnail: t.thumbnail || t.cover,
              type: 'artist'
            });
          }
        });

        if (tab === 'songs') {
          setResults(matchedSongs.length ? matchedSongs : []);
        } else if (tab === 'albums') {
          setResults(matchedAlbums.length ? matchedAlbums : []);
        } else if (tab === 'artists') {
          setResults(matchedArtists);
        } else {
          setResults({
            songs: matchedSongs,
            albums: matchedAlbums,
            artists: matchedArtists,
            playlists: [],
          });
        }
      } catch {
        setError('No results found. Try another query.');
        setResults(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /** Debounced query update — triggers 450ms after user stops typing */
  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (!trimmed) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      executeSearch(trimmed, activeTab);
    }, 450);
  }, [activeTab, executeSearch]);

  /** Immediate search submit (Enter key or button) */
  const submitSearch = useCallback((q = query) => {
    clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (!trimmed) return;
    if (loading && inFlightRef.current.query === trimmed && inFlightRef.current.tab === activeTab) {
      return;
    }
    executeSearch(trimmed, activeTab);
  }, [query, activeTab, loading, executeSearch]);

  /** Switch tab and re-run search for current query */
  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    clearTimeout(debounceRef.current);
    if (query.trim()) {
      executeSearch(query.trim(), tab);
    }
  }, [query, executeSearch]);

  /** Clear everything */
  const clear = useCallback(() => {
    clearTimeout(debounceRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    inFlightRef.current = { query: '', tab: '' };
    setQuery('');
    setResults(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    query, results, loading, error, activeTab,
    search, submitSearch, switchTab, clear,
  };
}
