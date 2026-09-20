import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { formatDuration } from '../utils/timeFormat.js';
import AddToPlaylistMenu from './shared/AddToPlaylistMenu.jsx';
import ImageWithFallback from './shared/ImageWithFallback.jsx';
import TrackContextMenu from './shared/TrackContextMenu.jsx';

const TABS = [
  { id: 'all',     label: 'All',     icon: 'explore' },
  { id: 'songs',   label: 'Songs',   icon: 'music_note' },
  { id: 'albums',  label: 'Albums',  icon: 'album' },
  { id: 'artists', label: 'Artists', icon: 'person' },
];

/**
 * Search Component — High-performance YouTube Music search powered by Innertube
 * Strict B&W monochrome aesthetic with clean minimal outline filter pills
 */
export default function Search({ onSelectTrack, onArtistClick }) {
  const {
    navigateTo,
    loadSong,
    isLiked,
    toggleLike,
    handleEntityClick,
    routeToSongEntity,
    routeToArtistEntity,
  } = usePlayer();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addMenuSong, setAddMenuSong] = useState(null);

  // Synchronous input typing + 200ms debounced network dispatch
  const debouncedQuery = useDebounce(searchTerm, 200);
  const abortControllerRef = useRef(null);

  const fetchResults = useCallback((query, tab) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel any in-flight fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=${tab}`, {
      signal: abortController.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('[Search] Fetch error:', err);
        setError(err.message || 'Failed to fetch results');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery, activeTab);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, activeTab, fetchResults]);

  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setError(null);
  };

  const handleTrackClick = (track) => {
    if (onSelectTrack) {
      onSelectTrack(track);
    } else {
      loadSong(track, [track], 0);
    }
  };

  const handleArtistNavigation = (artistName, artistId) => {
    if (onArtistClick) {
      onArtistClick(artistName, artistId);
    }
    routeToArtistEntity(artistName, artistId);
  };

  const handleAlbumNavigation = (album) => {
    routeToSongEntity({
      ...album,
      albumId: album.browseId || album.id,
      album: album.title,
    });
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Search Input Bar (Sleek monochrome input) */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#888888]">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search songs, artists, or albums via YouTube Music..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black border border-[#262626] text-white placeholder-[#666666] text-body-md focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#888888] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Filter Chips (Minimal outline pills: border #333333/white, bg transparent, active: bg #FFFFFF text #000000) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-label-sm font-medium transition-all duration-150 flex-shrink-0 border ${
                isActive
                  ? 'bg-white text-black border-white font-semibold shadow-sm'
                  : 'bg-transparent text-[#888888] border-[#333333] hover:text-white hover:border-[#666666]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center gap-2 px-3 py-2 text-label-sm text-[#888888] animate-pulse">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Searching YouTube Music ({activeTab})...</span>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="p-3 rounded-xl bg-[#141414] border border-[#333333] text-white text-body-sm">
          {error}
        </div>
      )}

      {/* Results Container: Constrained to max-h-[72vh] with smooth scroll & subtle dividers */}
      {results.length > 0 && (
        <div className="w-full max-h-[72vh] overflow-y-auto pr-2 scroll-smooth rounded-xl bg-[#050505] border border-[#222222] shadow-2xl">
          <div className="divide-y divide-[#1a1a1a]">
            {results.map((item, idx) => {
              const itemType = item.type || (activeTab === 'albums' ? 'album' : activeTab === 'artists' ? 'artist' : 'song');

              // ── Artist Row / Card ───────────────────────────────────────
              if (itemType === 'artist') {
                return (
                  <div
                    key={item.id || item.browseId || idx}
                    onClick={() => handleArtistNavigation(item.name, item.browseId || item.id)}
                    className="group flex items-center justify-between p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ImageWithFallback
                        src={item.thumbnail}
                        alt={item.name}
                        icon="person"
                        iconClassName="text-white/50 text-[24px]"
                        className="w-12 h-12 aspect-square rounded-full overflow-hidden object-cover flex-shrink-0 border border-[#262626] group-hover:border-white transition-colors"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-label-md font-semibold text-white truncate group-hover:underline transition-colors">
                            {item.name}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#111111] text-[#888888] border border-[#333333] flex-shrink-0">
                            Artist
                          </span>
                        </div>
                        <p className="text-body-sm text-[#888888] truncate mt-0.5">
                          View profile & discography
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-[#666666] group-hover:text-white transition-colors">
                      chevron_right
                    </span>
                  </div>
                );
              }

              // ── Album Row / Card ────────────────────────────────────────
              if (itemType === 'album') {
                return (
                  <div
                    key={item.id || item.browseId || idx}
                    onClick={() => handleAlbumNavigation(item)}
                    className="group flex items-center justify-between p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ImageWithFallback
                        src={item.thumbnail || item.cover}
                        alt={item.title}
                        icon="album"
                        iconClassName="text-white/40 text-[24px]"
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-[#262626] group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-label-md font-semibold text-white truncate group-hover:underline transition-colors">
                            {item.title}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#111111] text-[#888888] border border-[#333333] flex-shrink-0">
                            Album
                          </span>
                        </div>
                        <p className="text-body-sm text-[#888888] truncate mt-0.5">
                          {item.artist} {item.year ? `• ${item.year}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#888888] group-hover:text-white transition-colors">
                      <span className="text-label-sm font-medium hidden sm:inline">Play Album</span>
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </div>
                  </div>
                );
              }

              // ── Track Row ───────────────────────────────────────────────
              const track = item;
              return (
                <div
                  key={track.id || track.videoId || idx}
                  onClick={() => handleTrackClick(track)}
                  className="group flex items-center justify-between p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-[#262626]">
                      <ImageWithFallback
                        src={track.thumbnail || track.cover}
                        alt={track.title}
                        icon="music_note"
                        iconClassName="text-white/40 text-[22px]"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          play_arrow
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            routeToSongEntity(track);
                          }}
                          className="text-label-md font-semibold text-white truncate hover:underline transition-colors"
                          title={`View album / single details for "${track.title}"`}
                        >
                          {track.title}
                        </span>
                        {track.isMusicVideo || track.isRemix || (!track.album && !track.albumId) ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              routeToSongEntity(track);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#111111] text-[#888888] hover:text-white border border-[#333333] hover:border-[#666666] flex-shrink-0 transition-colors"
                            title="Open Single / Video View"
                          >
                            <span className="material-symbols-outlined text-[12px]">smart_display</span>
                            <span>{track.isMusicVideo ? 'Video' : 'Single'}</span>
                          </button>
                        ) : track.isOfficial ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#111111] text-[#888888] border border-[#333333] flex-shrink-0">
                            Official
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[#888888] flex-shrink-0">
                            Song
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-body-sm text-[#888888] truncate mt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArtistNavigation(track.artist, track.artistId);
                          }}
                          className="hover:text-white hover:underline focus:outline-none transition-colors text-left truncate"
                          title={`View ${track.artist}'s profile`}
                        >
                          {track.artist}
                        </button>
                        {track.album && (
                          <>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                routeToSongEntity(track);
                              }}
                              className="hover:text-white hover:underline focus:outline-none transition-colors text-left truncate"
                              title={`View album: ${track.album}`}
                            >
                              {track.album}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-3">
                    {/* View Single/Video details button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        routeToSongEntity(track);
                      }}
                      className="p-1.5 rounded-full hover:bg-white/10 text-[#888888] hover:text-white transition-colors"
                      title="View Release Details"
                    >
                      <span className="material-symbols-outlined text-[19px]">open_in_new</span>
                    </button>

                    {/* Like button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track);
                      }}
                      className={`p-1.5 rounded-full transition-transform active:scale-90 ${
                        isLiked(track.id) ? 'text-white' : 'text-[#888888] hover:text-white'
                      }`}
                      title={isLiked(track.id) ? 'Unlike' : 'Like'}
                    >
                      <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: `'FILL' ${isLiked(track.id) ? 1 : 0}` }}>
                        favorite
                      </span>
                    </button>

                    {/* Track Context Menu */}
                    <TrackContextMenu track={track} onAddToPlaylist={setAddMenuSong} />

                    {/* Duration */}
                    <span className="text-label-sm text-[#888888] font-mono min-w-[36px] text-right hidden sm:inline-block">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add To Playlist Modal */}
      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </div>
  );
}
