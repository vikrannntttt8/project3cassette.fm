import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { apiUrl } from '../../utils/apiConfig.js';
import { formatDuration } from '../../utils/timeFormat.js';
import ImageWithFallback from './ImageWithFallback.jsx';
import TrackContextMenu from './TrackContextMenu.jsx';
import AddToPlaylistMenu from './AddToPlaylistMenu.jsx';

const SEARCH_TABS = [
  { id: 'all',                 label: 'All',                 icon: 'explore' },
  { id: 'songs',               label: 'Songs',               icon: 'music_note' },
  { id: 'videos',              label: 'Videos',              icon: 'smart_display' },
  { id: 'albums',              label: 'Albums',              icon: 'album' },
  { id: 'artists',             label: 'Artists',             icon: 'person' },
  { id: 'podcasts',            label: 'Podcasts',            icon: 'podcasts' },
  { id: 'community_playlists', label: 'Community Playlists', icon: 'queue_music' },
  { id: 'featured_playlists',  label: 'Featured Playlists',  icon: 'featured_play_list' },
];

export default function MobileSearchOverlay({ isOpen, onClose }) {
  const {
    playTrackNow,
    isLiked,
    toggleLike,
    handleEntityClick,
    routeToSongEntity,
    routeToArtistEntity,
    isMobileSearchOpen,
    closeMobileSearch,
  } = usePlayer();

  const isSearchOpen = isOpen !== undefined ? isOpen : isMobileSearchOpen;
  const dismissSearch = onClose || closeMobileSearch;

  const [query, setQuery] = useState('');
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

  // Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef(null);
  const sentinelRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);
  const abortControllerRef = useRef(null);
  const inFlightRef = useRef({ query: '', tab: '' });

  // Auto-focus input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setResults([]);
      setShelvesData(null);
      setTopResult(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isSearchOpen]);

  // ── 1. Fetch Suggestions (300ms Debounce) ──────────────────────────
  useEffect(() => {
    const trimmed = query.trim();
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
          setSuggestions(data.slice(0, 6));
        }
      } catch {
        // Ignore network failure on suggestions
      }
    };

    fetchSuggestions();
    return () => { isMounted = false; };
  }, [query]);

  // ── 2. Primary Search Dispatch ─────────────────────────────────────
  const searchMusic = useCallback(async (q, tab) => {
    const trimmed = q.trim();
    if (!trimmed) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      inFlightRef.current = { query: '', tab: '' };
      setResults([]);
      setShelvesData(null);
      setTopResult(null);
      setContinuationToken(null);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    inFlightRef.current = { query: trimmed, tab };

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const res = await fetch(
        apiUrl(`/api/search?q=${encodeURIComponent(trimmed)}&type=${tab}`),
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();

      if (data && data.success === false) {
        throw new Error(data.error || 'Search error');
      }

      // Handle "all" tab shelf payload
      if (tab === 'all') {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setTopResult(data.topResult || null);
          setShelvesData(data.shelves || null);
          setResults(Array.isArray(data.results) ? data.results : []);
          setContinuationToken(data.continuation || null);
          return;
        }
      }

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
      console.warn('[MobileSearchOverlay] Search note:', err.message);

      try {
        const { FALLBACK_HOME_FEED } = await import('../../data/fallbackFeed.js');
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

  // ── 3. Continuation Fetch for Infinite Scroll ──────────────────────
  const loadMoreContinuation = useCallback(async () => {
    if (!continuationToken || loadingMore || loading || activeTab === 'all') return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        apiUrl(`/api/search?q=${encodeURIComponent(query.trim())}&type=${activeTab}&continuation=${encodeURIComponent(continuationToken)}`)
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
      console.warn('[MobileSearch] Continuation error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [continuationToken, loadingMore, loading, activeTab, query]);

  // ── 4. IntersectionObserver for Sentinel ───────────────────────────
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

  useEffect(() => {
    if (debouncedQuery) {
      searchMusic(debouncedQuery, activeTab);
    } else {
      setResults([]);
      setShelvesData(null);
      setTopResult(null);
    }
  }, [debouncedQuery, activeTab, searchMusic]);

  // ── Entity Action Dispatcher ───────────────────────────────────────
  const handleEntityAction = (item) => {
    if (!item) return;
    const type = item.type || 'song';

    if (type === 'song' || type === 'video' || type === 'podcast') {
      playTrackNow(item);
      return;
    }

    if (type === 'artist') {
      const artistName = item.name || item.title || 'Artist';
      const artistId = item.browseId || item.id;
      routeToArtistEntity(artistName, artistId);
      dismissSearch();
      return;
    }

    if (type === 'album') {
      const albumId = item.browseId || item.id;
      if (albumId) {
        handleEntityClick({ ...item, type: 'album', albumId });
        dismissSearch();
      }
      return;
    }

    if (type === 'playlist') {
      const playlistId = item.playlistId || item.browseId || item.id;
      if (playlistId) {
        handleEntityClick({ ...item, type: 'playlist', playlistId });
        dismissSearch();
      }
      return;
    }

    playTrackNow(item);
  };

  const handleSelectSuggestion = (sugText) => {
    setQuery(sugText);
    setShowSuggestions(false);
    searchMusic(sugText, activeTab);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    if (loading && inFlightRef.current.query === trimmed && inFlightRef.current.tab === activeTab) {
      return;
    }
    searchMusic(trimmed, activeTab);
  };

  if (!isSearchOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[80] bg-[#0c0c0e] flex flex-col animate-fade-in text-white select-none">
      {/* ── Top Header with Search Input ────────────────────────────── */}
      <div className="relative w-full z-30">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 px-3 py-2.5 bg-[#121215] border-b border-white/10 pt-safe">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#1a1a1e] border border-white/10 focus-within:border-white transition-colors">
            {loading ? (
              <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <span className="material-symbols-outlined text-neutral-400 text-[20px] flex-shrink-0">
                search
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                if (e.target.value.trim()) setLoading(true);
              }}
              placeholder="Search songs, artists, albums..."
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-neutral-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setShelvesData(null);
                  setTopResult(null);
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setLoading(false);
                }}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={dismissSearch}
            className="px-2.5 py-2 text-white hover:text-neutral-300 font-semibold text-sm cursor-pointer"
          >
            Cancel
          </button>
        </form>

        {/* ── Autocomplete Dropdown (Mobile) ─────────────────────────── */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-[#141418] border-b border-white/10 shadow-2xl z-50 overflow-hidden divide-y divide-white/5 animate-fade-in">
            {suggestions.map((sug) => (
              <div
                key={sug}
                onMouseDown={() => handleSelectSuggestion(sug)}
                className="flex items-center justify-between px-4 py-3 text-sm text-neutral-300 hover:bg-white/10 hover:text-white cursor-pointer active:bg-white/15"
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
            ))}
          </div>
        )}
      </div>

      {/* ── Filter Tabs Strip ───────────────────────────────────────── */}
      <div className="flex gap-2 px-3 py-2 bg-[#0e0e11] border-b border-white/5 overflow-x-auto no-scrollbar flex-shrink-0">
        {SEARCH_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setShowSuggestions(false);
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0 cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-[#18181b] text-neutral-400 border-white/5 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Search Results Body ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 pb-[calc(var(--mobile-nav-h)+var(--safe-bottom)+7rem)] space-y-4 no-scrollbar">
        {loading && !results.length && (
          <div className="flex flex-col gap-2.5 pt-2 animate-fade-in">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#141418] border border-white/10 shadow-sm">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  Searching YouTube Music…
                </p>
                {query && (
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    Matching tracks for "{query}"
                  </p>
                )}
              </div>
            </div>

            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#141418] border border-white/5 animate-pulse"
              >
                <div className="w-11 h-11 rounded-xl bg-neutral-800 flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3.5 w-3/5 bg-neutral-800 rounded" />
                  <div className="h-2.5 w-2/5 bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="py-12 text-center text-neutral-400 text-sm">
            <span className="material-symbols-outlined text-[36px] text-neutral-500 mb-2 block">
              error
            </span>
            {error}
          </div>
        )}

        {!loading && !query && (
          <div className="py-16 text-center text-neutral-500 space-y-2">
            <span className="material-symbols-outlined text-[44px] text-neutral-600 block">
              travel_explore
            </span>
            <p className="text-sm font-semibold text-neutral-300">Discover YouTube Music</p>
            <p className="text-xs">Type a title, artist, or album name above</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: "ALL" — MOBILE SHELF-BASED RENDERING
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'all' && (
          <div className="space-y-5">
            {/* Top Result Card */}
            {topResult && (
              <div
                onClick={() => handleEntityAction(topResult)}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-[#16161a] to-[#0e0e12] border border-white/15 p-3.5 transition-all active:scale-[0.99] cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <ImageWithFallback
                    src={topResult.thumbnail || topResult.cover}
                    alt={topResult.title}
                    icon={topResult.type === 'artist' ? 'person' : 'music_note'}
                    iconClassName="text-white/40 text-[24px]"
                    className={`w-14 h-14 object-cover bg-neutral-900 border border-white/10 flex-shrink-0 ${
                      topResult.type === 'artist' ? 'rounded-full' : 'rounded-xl'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider bg-white text-black font-extrabold shadow-sm">
                        Top Result
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10">
                        {topResult.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate">
                      {topResult.title}
                    </h3>
                    <p className="text-[11.5px] text-neutral-400 truncate mt-0.5">
                      {topResult.subtitle || topResult.artist || 'YouTube Music match'}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-white text-[22px] flex-shrink-0">
                    {topResult.type === 'artist' ? 'chevron_right' : 'play_circle'}
                  </span>
                </div>
              </div>
            )}

            {/* Songs Shelf */}
            {shelvesData?.songs?.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-white">music_note</span>
                    Songs
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('songs')}
                    className="text-[11px] text-neutral-400 hover:text-white font-medium cursor-pointer"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="divide-y divide-white/5 rounded-2xl bg-[#141418] border border-white/5 overflow-hidden">
                  {shelvesData.songs.slice(0, 5).map((song, idx) => (
                    <MobileSearchRow
                      key={song.id || idx}
                      item={song}
                      isLiked={isLiked(song.id)}
                      onAction={() => handleEntityAction(song)}
                      onToggleLike={() => toggleLike(song)}
                      onSongRoute={routeToSongEntity}
                      onAddToPlaylist={setAddMenuSong}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Artists Shelf */}
            {shelvesData?.artists?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-white">person</span>
                    Artists
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('artists')}
                    className="text-[11px] text-neutral-400 hover:text-white font-medium cursor-pointer"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {shelvesData.artists.slice(0, 6).map((art, idx) => (
                    <div
                      key={art.id || idx}
                      onClick={() => handleEntityAction(art)}
                      className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-[#141418] border border-white/5 flex-shrink-0 w-24 active:scale-95 transition-all cursor-pointer"
                    >
                      <ImageWithFallback
                        src={art.thumbnail || art.cover}
                        alt={art.name}
                        icon="person"
                        iconClassName="text-white/40 text-[20px]"
                        className="w-14 h-14 rounded-full object-cover bg-neutral-900 border border-white/10"
                      />
                      <p className="text-[11.5px] font-semibold text-white truncate w-full mt-2">
                        {art.name}
                      </p>
                      <span className="text-[9px] text-neutral-500 uppercase tracking-wider mt-0.5">
                        Artist
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Albums Shelf */}
            {shelvesData?.albums?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-white">album</span>
                    Albums
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('albums')}
                    className="text-[11px] text-neutral-400 hover:text-white font-medium cursor-pointer"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {shelvesData.albums.slice(0, 4).map((alb, idx) => (
                    <div
                      key={alb.id || idx}
                      onClick={() => handleEntityAction(alb)}
                      className="flex flex-col p-2 rounded-2xl bg-[#141418] border border-white/5 active:scale-95 transition-all cursor-pointer"
                    >
                      <ImageWithFallback
                        src={alb.thumbnail || alb.cover}
                        alt={alb.title}
                        icon="album"
                        iconClassName="text-white/40 text-[20px]"
                        className="w-full aspect-square rounded-xl object-cover bg-neutral-900 border border-white/10"
                      />
                      <p className="text-[11.5px] font-semibold text-white truncate w-full mt-1.5">
                        {alb.title}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate w-full mt-0.5">
                        {alb.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SPECIFIC TABS — INFINITE LIST
        ══════════════════════════════════════════════════════════════ */}
        {activeTab !== 'all' && results.length > 0 && (
          <div className="divide-y divide-white/5 rounded-2xl bg-[#141418] border border-white/5 overflow-hidden">
            {results.map((item, idx) => (
              <MobileSearchRow
                key={item.id || item.browseId || idx}
                item={item}
                isLiked={isLiked(item.id)}
                onAction={() => handleEntityAction(item)}
                onToggleLike={() => toggleLike(item)}
                onSongRoute={routeToSongEntity}
                onAddToPlaylist={setAddMenuSong}
              />
            ))}
          </div>
        )}

        {/* Sentinel for Infinite Scroll */}
        {activeTab !== 'all' && continuationToken && (
          <div ref={sentinelRef} className="py-4 flex justify-center items-center">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading more…</span>
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
 * Mobile Search Row with single-tap playback and isolated like/menu touch targets
 */
function MobileSearchRow({
  item,
  isLiked,
  onAction,
  onToggleLike,
  onSongRoute,
  onAddToPlaylist,
}) {
  const type = item?.type || 'song';

  return (
    <div
      onClick={onAction}
      className="flex items-center justify-between p-2.5 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <ImageWithFallback
          src={item?.thumbnail || item?.cover}
          alt={item?.title || item?.name}
          icon={type === 'artist' ? 'person' : type === 'album' ? 'album' : 'music_note'}
          iconClassName="text-white/40 text-[18px]"
          className={`w-10 h-10 object-cover bg-neutral-900 border border-white/10 flex-shrink-0 ${
            type === 'artist' ? 'rounded-full' : 'rounded-xl'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">
              {item?.title || item?.name}
            </p>
            {item?.isOfficial && (
              <span className="px-1 py-0.2 rounded text-[8.5px] font-mono uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10 flex-shrink-0">
                Official
              </span>
            )}
            {type === 'artist' && (
              <span className="px-1 py-0.2 rounded text-[8.5px] font-mono uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10 flex-shrink-0">
                Artist
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-neutral-400 truncate mt-0.5">
            {type === 'artist' ? 'View profile' : `${item?.artist || 'Unknown Artist'}${item?.duration ? ` • ${formatDuration(item.duration)}` : ''}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        {type !== 'artist' && (
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
        )}

        {type !== 'artist' && (
          <TrackContextMenu track={item} onAddToPlaylist={onAddToPlaylist} />
        )}

        {type === 'artist' && (
          <span className="material-symbols-outlined text-neutral-400 text-[18px]">
            chevron_right
          </span>
        )}
      </div>
    </div>
  );
}
