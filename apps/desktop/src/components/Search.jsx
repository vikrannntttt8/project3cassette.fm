import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { formatDuration } from '../utils/timeFormat.js';
import { apiUrl } from '../utils/apiConfig.js';
import AddToPlaylistMenu from './shared/AddToPlaylistMenu.jsx';
import ImageWithFallback from './shared/ImageWithFallback.jsx';
import TrackContextMenu from './shared/TrackContextMenu.jsx';
import ArtistLinks from './shared/ArtistLinks.jsx';

const TABS = [
  { id: 'all',                 label: 'All',                 icon: 'explore' },
  { id: 'songs',               label: 'Songs',               icon: 'music_note' },
  { id: 'videos',              label: 'Videos',              icon: 'smart_display' },
  { id: 'albums',              label: 'Albums',              icon: 'album' },
  { id: 'artists',             label: 'Artists',             icon: 'person' },
  { id: 'podcasts',            label: 'Podcasts',            icon: 'podcasts' },
  { id: 'community_playlists', label: 'Community Playlists', icon: 'queue_music' },
  { id: 'featured_playlists',  label: 'Featured Playlists',  icon: 'featured_play_list' },
];

/**
 * Native YouTube Music Search Component
 * Features:
 * 1. 300ms debounced autocomplete suggestions
 * 2. Shelf-based rendering for "All" tab with Top Result hero card
 * 3. Strict result type routing (songs, videos, albums, artists, playlists)
 * 4. Infinite scroll with continuation tokens via IntersectionObserver
 */
export default function Search({ onSelectTrack, onArtistClick }) {
  const {
    navigateTo,
    playTrackNow,
    isLiked,
    toggleLike,
    handleEntityClick,
    routeToSongEntity,
    routeToArtistEntity,
  } = usePlayer();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Results & Shelves State
  const [results, setResults] = useState([]);
  const [shelvesData, setShelvesData] = useState(null);
  const [topResult, setTopResult] = useState(null);
  const [continuationToken, setContinuationToken] = useState(null);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [addMenuSong, setAddMenuSong] = useState(null);

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Debounced input (300ms) for suggestions and search
  const debouncedQuery = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef(null);
  const searchInputRef = useRef(null);
  const sentinelRef = useRef(null);
  const inFlightRef = useRef({ query: '', tab: '' });

  // ── 1. Fetch Suggestions on Debounced Typing (300ms) ───────────────
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    let isMounted = true;
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(apiUrl(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`));
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setSuggestions(data.slice(0, 7));
        }
      } catch {
        // Ignore suggestion network drops
      }
    };

    fetchSuggestions();
    return () => { isMounted = false; };
  }, [searchTerm]);

  // ── 2. Primary Search Dispatch ─────────────────────────────────────
  const fetchResults = useCallback(async (query, tab) => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      inFlightRef.current = { query: '', tab: '' };
      setResults([]);
      setShelvesData(null);
      setTopResult(null);
      setContinuationToken(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    inFlightRef.current = { query: trimmed, tab };

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(trimmed)}&type=${tab}`), {
        signal: abortController.signal,
      });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();

      if (data && data.success === false) {
        throw new Error(data.error || 'Search error');
      }

      // ── Handle "All" Shelf Payload ────────────────────────────────
      if (tab === 'all') {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setTopResult(data.topResult || null);
          setShelvesData(data.shelves || null);
          setResults(Array.isArray(data.results) ? data.results : []);
          setContinuationToken(data.continuation || null);
          return;
        }
      }

      // ── Handle Filtered Tabs Payload ──────────────────────────────
      const rawList = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      setResults(rawList);
      setShelvesData(null);
      setTopResult(null);
      setContinuationToken(data?.continuation || null);

      if (rawList.length === 0) {
        throw new Error('No results found');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('[Search] Server search note:', err.message);

      try {
        const { FALLBACK_HOME_FEED } = await import('../data/fallbackFeed.js');
        const cleanQ = trimmed.toLowerCase();
        const allTracks = FALLBACK_HOME_FEED.featuredTracks || [];
        const matched = allTracks.filter((t) =>
          t.title?.toLowerCase().includes(cleanQ) || t.artist?.toLowerCase().includes(cleanQ)
        );
        setResults(matched);
        setShelvesData(null);
        setTopResult(null);
        setContinuationToken(null);
      } catch {
        setError('No results found.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 3. Fetch Next Page with Continuation Token ─────────────────────
  const loadMoreContinuation = useCallback(async () => {
    if (!continuationToken || loadingMore || loading || activeTab === 'all') return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        apiUrl(`/api/search?q=${encodeURIComponent(searchTerm.trim())}&type=${activeTab}&continuation=${encodeURIComponent(continuationToken)}`)
      );
      if (!res.ok) throw new Error('Continuation request failed');
      const data = await res.json();

      const newItems = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      if (newItems.length > 0) {
        setResults((prev) => {
          const existingIds = new Set(prev.map((i) => i.id || i.videoId || i.browseId));
          const uniqueNew = newItems.filter((i) => !existingIds.has(i.id || i.videoId || i.browseId));
          return [...prev, ...uniqueNew];
        });
      }
      setContinuationToken(data?.continuation || null);
    } catch (err) {
      console.warn('[Search] Continuation error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [continuationToken, loadingMore, loading, activeTab, searchTerm]);

  // ── 4. IntersectionObserver for Infinite Scroll ────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !continuationToken || activeTab === 'all') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreContinuation();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [continuationToken, activeTab, loadMoreContinuation]);

  // Trigger search on debounced query or tab switch
  useEffect(() => {
    fetchResults(debouncedQuery, activeTab);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, activeTab, fetchResults]);

  // ── Handlers & Actions ─────────────────────────────────────────────
  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setShelvesData(null);
    setTopResult(null);
    setContinuationToken(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setLoading(false);
    setError(null);
    searchInputRef.current?.focus();
  };

  const handleSelectSuggestion = (sugText) => {
    setSearchTerm(sugText);
    setShowSuggestions(false);
    fetchResults(sugText, activeTab);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    if (loading && inFlightRef.current.query === trimmed && inFlightRef.current.tab === activeTab) {
      return;
    }
    fetchResults(trimmed, activeTab);
  };

  // ── Strict Entity Click Routing ────────────────────────────────────
  const handleEntityAction = (item) => {
    if (!item) return;
    const type = item.type || 'song';

    // 1. Song or Video -> Audio Engine Playback
    if (type === 'song' || type === 'video' || type === 'podcast') {
      if (onSelectTrack) {
        onSelectTrack(item);
      } else {
        playTrackNow(item);
      }
      return;
    }

    // 2. Artist -> /artist/:id
    if (type === 'artist') {
      const artistName = item.name || item.title || 'Artist';
      const artistId = item.browseId || item.id || item.channelId;
      if (onArtistClick) {
        onArtistClick(artistName, artistId);
      }
      routeToArtistEntity(artistName, artistId);
      return;
    }

    // 3. Album -> /album/:id
    if (type === 'album') {
      const albumId = item.browseId || item.id;
      if (albumId) {
        handleEntityClick({ ...item, type: 'album', albumId });
      }
      return;
    }

    // 4. Playlist -> /playlist/:id
    if (type === 'playlist') {
      const playlistId = item.playlistId || item.browseId || item.id;
      if (playlistId) {
        handleEntityClick({ ...item, type: 'playlist', playlistId });
      }
      return;
    }

    // Default Fallback
    if (item.videoId || item.id) {
      playTrackNow(item);
    }
  };

  const handleArtistNavigation = (artistName, artistId) => {
    if (onArtistClick) {
      onArtistClick(artistName, artistId);
    }
    routeToArtistEntity(artistName, artistId);
  };

  return (
    <div className="w-full flex flex-col gap-3.5 relative">
      {/* ── Search Input & Autocomplete Dropdown ──────────────────────── */}
      <div className="relative w-full">
        <form onSubmit={handleSubmit} className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">search</span>
            )}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
              setSelectedSuggestionIndex(-1);
              if (e.target.value.trim()) setLoading(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search songs, artists, albums, playlists via YouTube Music..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0d0d0f] border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </form>

        {/* ── Autocomplete Dropdown Suggestions ──────────────────────── */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 py-1.5 rounded-2xl bg-[#121215] border border-white/10 shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fade-in">
            {suggestions.map((sug, idx) => {
              const isSelected = idx === selectedSuggestionIndex;
              return (
                <div
                  key={sug}
                  onMouseDown={() => handleSelectSuggestion(sug)}
                  onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                    isSelected ? 'bg-white/15 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="material-symbols-outlined text-neutral-400 text-[18px] flex-shrink-0">
                      search
                    </span>
                    <span className="truncate font-medium">{sug}</span>
                  </div>
                  <span className="material-symbols-outlined text-neutral-400 text-[16px] opacity-60">
                    north_west
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 8 Category Filter Tabs ───────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setShowSuggestions(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex-shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-[#101012] text-neutral-400 border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Loading Skeleton Indicator ───────────────────────────────── */}
      {loading && !results.length && (
        <div className="flex flex-col gap-2.5 animate-fade-in">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#141416] border border-white/5 text-xs text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span>Searching YouTube Music ({activeTab})…</span>
          </div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-[#111113] border border-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* ── Error Message ────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 text-neutral-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Main Results View ────────────────────────────────────────── */}
      <div className="w-full max-h-[75vh] overflow-y-auto pr-1.5 scroll-smooth rounded-2xl bg-[#08080a] border border-white/10 shadow-2xl p-3 sm:p-4 space-y-6">
        
        {/* ══════════════════════════════════════════════════════════════
            TAB: "ALL" — SHELF-BASED ARCHITECTURE WITH TOP RESULT HERO
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'all' && (
          <div className="space-y-7">
            {/* ── 1. Top Result Hero Card ────────────────────────────── */}
            {topResult && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-[#141418] to-[#0d0d10] border border-white/15 p-4 sm:p-5 transition-all shadow-xl hover:border-white/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <ImageWithFallback
                        src={topResult.thumbnail || topResult.cover}
                        alt={topResult.title}
                        icon={topResult.type === 'artist' ? 'person' : 'music_note'}
                        iconClassName="text-white/40 text-[28px]"
                        className={`w-16 h-16 sm:w-20 sm:h-20 object-cover bg-neutral-900 border border-white/10 shadow-md ${
                          topResult.type === 'artist' ? 'rounded-full' : 'rounded-2xl'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-white text-black font-extrabold shadow-sm">
                          Top Result
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10">
                          {topResult.type}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-white truncate leading-tight">
                        {topResult.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-400 truncate mt-0.5">
                        {topResult.subtitle || topResult.artist || 'YouTube Music match'}
                      </p>
                    </div>
                  </div>

                  {/* 1-Tap Action Button */}
                  <button
                    type="button"
                    onClick={() => handleEntityAction(topResult)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all cursor-pointer shadow-lg flex-shrink-0 self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {topResult.type === 'artist' ? 'person' : topResult.type === 'album' ? 'album' : 'play_arrow'}
                    </span>
                    <span>
                      {topResult.type === 'artist' ? 'View Artist' : topResult.type === 'album' ? 'View Album' : 'Play Now'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ── 2. Songs Shelf (Vertical list with play & menu) ────── */}
            {shelvesData?.songs?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-white">music_note</span>
                    Songs
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('songs')}
                    className="text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="divide-y divide-white/5 rounded-xl bg-[#101012] border border-white/5 overflow-hidden">
                  {shelvesData.songs.slice(0, 6).map((song, idx) => (
                    <SongResultRow
                      key={song.id || idx}
                      track={song}
                      isLiked={isLiked(song.id)}
                      onPlay={() => handleEntityAction(song)}
                      onToggleLike={() => toggleLike(song)}
                      onArtistClick={handleArtistNavigation}
                      onSongRoute={routeToSongEntity}
                      onAddToPlaylist={setAddMenuSong}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── 3. Artists Shelf (Horizontal Carousel) ─────────────── */}
            {shelvesData?.artists?.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-white">person</span>
                    Artists
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('artists')}
                    className="text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {shelvesData.artists.slice(0, 6).map((art, idx) => (
                    <div
                      key={art.id || idx}
                      onClick={() => handleEntityAction(art)}
                      className="group flex flex-col items-center text-center p-3 rounded-2xl bg-[#101012] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      <ImageWithFallback
                        src={art.thumbnail || art.cover}
                        alt={art.name}
                        icon="person"
                        iconClassName="text-white/40 text-[24px]"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover bg-neutral-900 border border-white/10 group-hover:scale-105 transition-transform"
                      />
                      <p className="text-xs font-semibold text-white truncate w-full mt-2.5 group-hover:underline">
                        {art.name}
                      </p>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                        Artist
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 4. Albums Shelf (Horizontal Grid) ──────────────────── */}
            {shelvesData?.albums?.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-white">album</span>
                    Albums &amp; Singles
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('albums')}
                    className="text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {shelvesData.albums.slice(0, 6).map((alb, idx) => (
                    <div
                      key={alb.id || idx}
                      onClick={() => handleEntityAction(alb)}
                      className="group flex flex-col p-2.5 rounded-2xl bg-[#101012] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      <ImageWithFallback
                        src={alb.thumbnail || alb.cover}
                        alt={alb.title}
                        icon="album"
                        iconClassName="text-white/40 text-[24px]"
                        className="w-full aspect-square rounded-xl object-cover bg-neutral-900 border border-white/10 group-hover:scale-105 transition-transform"
                      />
                      <p className="text-xs font-semibold text-white truncate w-full mt-2 group-hover:underline">
                        {alb.title}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate w-full mt-0.5">
                        {alb.artist} {alb.year ? `• ${alb.year}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 5. Playlists Shelf ─────────────────────────────────── */}
            {shelvesData?.playlists?.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-white">queue_music</span>
                    Community &amp; Featured Playlists
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('community_playlists')}
                    className="text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {shelvesData.playlists.slice(0, 6).map((pl, idx) => (
                    <div
                      key={pl.id || idx}
                      onClick={() => handleEntityAction(pl)}
                      className="group flex flex-col p-2.5 rounded-2xl bg-[#101012] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      <ImageWithFallback
                        src={pl.thumbnail || pl.cover}
                        alt={pl.title}
                        icon="queue_music"
                        iconClassName="text-white/40 text-[24px]"
                        className="w-full aspect-square rounded-xl object-cover bg-neutral-900 border border-white/10 group-hover:scale-105 transition-transform"
                      />
                      <p className="text-xs font-semibold text-white truncate w-full mt-2 group-hover:underline">
                        {pl.title}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate w-full mt-0.5">
                        {pl.artist || 'Curated Playlist'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SPECIFIC FILTER TABS — INFINITE SCROLL LIST VIEW
        ══════════════════════════════════════════════════════════════ */}
        {activeTab !== 'all' && results.length > 0 && (
          <div className="divide-y divide-white/5 rounded-xl bg-[#101012] border border-white/5 overflow-hidden">
            {results.map((item, idx) => (
              <SongResultRow
                key={item.id || item.browseId || idx}
                track={item}
                isLiked={isLiked(item.id)}
                onPlay={() => handleEntityAction(item)}
                onToggleLike={() => toggleLike(item)}
                onArtistClick={handleArtistNavigation}
                onSongRoute={routeToSongEntity}
                onAddToPlaylist={setAddMenuSong}
              />
            ))}
          </div>
        )}

        {/* ── Sentinel Element for Infinite Continuation Scroll ─────── */}
        {activeTab !== 'all' && continuationToken && (
          <div ref={sentinelRef} className="py-4 flex justify-center items-center">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading more tracks…</span>
              </div>
            ) : (
              <div className="h-6 w-full opacity-0" />
            )}
          </div>
        )}
      </div>

      {/* Add To Playlist Modal */}
      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </div>
  );
}

/**
 * Universal Search Result Row Component
 * Handles songs, videos, albums, and artists with safe optional chaining.
 */
function SongResultRow({
  track,
  isLiked,
  onPlay,
  onToggleLike,
  onArtistClick,
  onSongRoute,
  onAddToPlaylist,
}) {
  const itemType = track?.type || 'song';

  // ── Artist Row ──────────────────────────────────────────────────────
  if (itemType === 'artist') {
    return (
      <div
        onClick={onPlay}
        className="group flex items-center justify-between p-2.5 sm:p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ImageWithFallback
            src={track?.thumbnail || track?.cover}
            alt={track?.name || track?.title}
            icon="person"
            iconClassName="text-white/40 text-[20px]"
            className="w-10 h-10 rounded-full object-cover bg-neutral-900 border border-white/10 group-hover:scale-105 transition-transform flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate group-hover:underline">
                {track?.name || track?.title}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10">
                Artist
              </span>
            </div>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              View official profile &amp; discography
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-neutral-400 text-[18px] group-hover:text-white transition-colors">
          chevron_right
        </span>
      </div>
    );
  }

  // ── Album Row ───────────────────────────────────────────────────────
  if (itemType === 'album') {
    return (
      <div
        onClick={onPlay}
        className="group flex items-center justify-between p-2.5 sm:p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ImageWithFallback
            src={track?.thumbnail || track?.cover}
            alt={track?.title}
            icon="album"
            iconClassName="text-white/40 text-[20px]"
            className="w-10 h-10 rounded-xl object-cover bg-neutral-900 border border-white/10 group-hover:scale-105 transition-transform flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate group-hover:underline">
                {track?.title}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10">
                Album
              </span>
            </div>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              {track?.artist} {track?.year ? `• ${track?.year}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-neutral-400 group-hover:text-white transition-colors">
          <span className="text-xs font-medium hidden sm:inline">Play Album</span>
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </div>
      </div>
    );
  }

  // ── Playlist Row ────────────────────────────────────────────────────
  if (itemType === 'playlist') {
    return (
      <div
        onClick={onPlay}
        className="group flex items-center justify-between p-2.5 sm:p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ImageWithFallback
            src={track?.thumbnail || track?.cover}
            alt={track?.title}
            icon="queue_music"
            iconClassName="text-white/40 text-[20px]"
            className="w-10 h-10 rounded-xl object-cover bg-neutral-900 border border-white/10 group-hover:scale-105 transition-transform flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate group-hover:underline">
                {track?.title}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10">
                Playlist
              </span>
            </div>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              {track?.artist || 'Curated Playlist'} {track?.itemCount ? `• ${track?.itemCount}` : ''}
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-neutral-400 text-[18px] group-hover:text-white transition-colors">
          chevron_right
        </span>
      </div>
    );
  }

  // ── Song / Video / Podcast Track Row ────────────────────────────────
  return (
    <div
      onClick={onPlay}
      className="group flex items-center justify-between p-2.5 sm:p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10">
          <ImageWithFallback
            src={track?.thumbnail || track?.cover}
            alt={track?.title}
            icon="music_note"
            iconClassName="text-white/40 text-[18px]"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
          </div>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (onSongRoute) onSongRoute(track);
              }}
              className="text-sm font-semibold text-white truncate hover:underline transition-colors"
              title={`View album / single details for "${track?.title}"`}
            >
              {track?.title}
            </span>
            {track?.isMusicVideo || itemType === 'video' ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-white/10 text-neutral-300 border border-white/10 flex-shrink-0">
                <span className="material-symbols-outlined text-[11px]">smart_display</span>
                <span>Video</span>
              </span>
            ) : track?.isOfficial ? (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-white/10 text-neutral-300 border border-white/10 flex-shrink-0">
                Official
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 text-xs text-neutral-400 truncate mt-0.5">
            <ArtistLinks
              artists={track?.artists}
              artist={track?.artist}
              artistId={track?.artistId}
              onClickArtist={onArtistClick}
              className="truncate"
            />
            {track?.album && (
              <>
                <span>•</span>
                <span className="truncate">{track?.album}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 ml-2">
        {/* Like button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleLike) onToggleLike();
          }}
          className={`p-1.5 rounded-full transition-transform active:scale-90 cursor-pointer ${
            isLiked ? 'text-white' : 'text-neutral-500 hover:text-white'
          }`}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' ${isLiked ? 1 : 0}` }}>
            favorite
          </span>
        </button>

        {/* Track Context Menu */}
        <TrackContextMenu track={track} onAddToPlaylist={onAddToPlaylist} />

        {/* Duration */}
        {track?.duration > 0 && (
          <span className="text-xs text-neutral-400 font-mono min-w-[36px] text-right hidden sm:inline-block">
            {formatDuration(track.duration)}
          </span>
        )}
      </div>
    </div>
  );
}
