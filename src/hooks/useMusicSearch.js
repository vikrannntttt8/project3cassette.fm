import { useState, useCallback, useRef } from 'react';
import { apiUrl } from '../utils/apiConfig.js';
import { searchAll, searchSongs, searchAlbums, searchArtists } from '../utils/saavn.js';
import { FALLBACK_HOME_FEED } from '../data/fallbackFeed.js';

export const SEARCH_TABS = ['all', 'songs', 'albums', 'artists'];

/**
 * useMusicSearch — High-performance YouTube Music / Innertube search hook
 *
 * Features:
 * - 450ms Debounced input dispatch to eliminate keystroke spam.
 * - In-flight AbortController cancellation preventing stale race conditions.
 * - Duplicate execution guards for multiple submits.
 * - Multi-tier client fallback resilience.
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

  /** Execute a search for the current query and given tab */
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
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
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
        return;
      } else if (data && typeof data === 'object' && !Array.isArray(data) && (data.songs?.length || data.albums?.length || data.artists?.length)) {
        setResults(data);
        return;
      }
      
      // If server returned 0 results or empty, invoke multi-tier client fallback
      throw new Error('Empty server search result');
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('[useMusicSearch] Server search failed or empty, attempting client-side fallback:', err.message);
      
      try {
        if (tab === 'songs' || tab === 'song') {
          const songs = await searchSongs(trimmed, 20);
          if (songs && songs.length) {
            setResults(songs);
            return;
          }
        } else if (tab === 'albums' || tab === 'album') {
          const albums = await searchAlbums(trimmed, 20);
          if (albums && albums.length) {
            setResults(albums);
            return;
          }
        } else if (tab === 'artists' || tab === 'artist') {
          const artists = await searchArtists(trimmed, 20);
          if (artists && artists.length) {
            setResults(artists);
            return;
          }
        } else {
          const res = await searchAll(trimmed);
          if (res && (res.songs?.length || res.albums?.length || res.artists?.length)) {
            setResults(res);
            return;
          }
        }
      } catch (fallbackErr) {
        console.warn('[useMusicSearch] Secondary fallback failed:', fallbackErr);
      }

      // Tier 3: Local catalog filter fallback
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
          setResults(matchedSongs.length ? matchedSongs : allTracks.slice(0, 8));
        } else if (tab === 'albums') {
          setResults(matchedAlbums.length ? matchedAlbums : allAlbums.slice(0, 4));
        } else if (tab === 'artists') {
          setResults(matchedArtists);
        } else {
          setResults({
            songs: matchedSongs.length ? matchedSongs : allTracks.slice(0, 8),
            albums: matchedAlbums.length ? matchedAlbums : allAlbums.slice(0, 4),
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
    // Set loading preview state early for responsive feel
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      executeSearch(trimmed, activeTab);
    }, 450);
  }, [activeTab, executeSearch]);

  /** Immediate search submit (e.g. on Enter key or submit button click) */
  const submitSearch = useCallback((q = query) => {
    clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (!trimmed) return;
    // Guard against duplicate execution if already searching same query & tab
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
