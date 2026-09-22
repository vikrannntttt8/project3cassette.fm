import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatTime } from '../../utils/timeFormat.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { apiUrl } from '../../utils/apiConfig.js';
import ArtistLinks from './ArtistLinks.jsx';

const SEARCH_TABS = [
  { id: 'all',     label: 'All',     icon: 'explore' },
  { id: 'songs',   label: 'Songs',   icon: 'music_note' },
  { id: 'albums',  label: 'Albums',  icon: 'album' },
  { id: 'artists', label: 'Artists', icon: 'person' },
];

export default function MobileSearchOverlay({ isOpen, onClose }) {
  const {
    loadSong,
    currentSong,
    isPlaying,
    togglePlay,
    routeToSongEntity,
    routeToArtistEntity,
    isLiked,
    toggleLike,
  } = usePlayer();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(query, 250);
  const abortControllerRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  const searchMusic = useCallback(async (q, tab) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        apiUrl(`/api/search?q=${encodeURIComponent(trimmed)}&type=${tab}`),
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();
      setResults(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('Search encountered an error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      searchMusic(debouncedQuery, activeTab);
    } else {
      setResults(null);
    }
  }, [debouncedQuery, activeTab, searchMusic]);

  if (!isOpen) return null;

  const handlePlay = (song, songList) => {
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }
    const queue = songList || [song];
    const idx = queue.findIndex((s) => s.id === song.id);
    loadSong(song, queue, idx >= 0 ? idx : 0);
  };

  return (
    <div className="md:hidden fixed inset-0 z-[80] bg-[#0e0e0e] flex flex-col animate-fade-in text-white select-none">
      {/* ── Top Header with Search Input ────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#141416] border-b border-white/10 pt-safe">
        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#1e1e22] border border-white/10 focus-within:border-amber-500 transition-colors">
          <span className="material-symbols-outlined text-neutral-400 text-[20px] flex-shrink-0">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, albums, artists..."
            className="w-full bg-transparent text-white text-[14px] outline-none placeholder:text-neutral-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-400 hover:text-white p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="px-3 py-2 text-amber-500 hover:text-amber-400 font-semibold text-[14px] cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* ── Filter Tabs Strip ───────────────────────────────────────── */}
      <div className="flex gap-2 px-4 py-2 bg-[#121214] border-b border-white/5 overflow-x-auto no-scrollbar flex-shrink-0">
        {SEARCH_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-[#1c1c1e] text-neutral-400 border border-white/5 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Search Results Body ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-36 space-y-3 no-scrollbar">
        {loading && (
          <div className="flex flex-col gap-2.5 pt-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-[#18181a] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="py-12 text-center text-neutral-400 text-body-sm">
            <span className="material-symbols-outlined text-[36px] text-amber-500 mb-2 block">
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
            <p className="text-label-md font-semibold text-neutral-300">Discover YouTube Music</p>
            <p className="text-body-xs">Type a title, artist, or album name above</p>
          </div>
        )}

        {!loading && results && (
          <div className="space-y-2">
            {activeTab === 'all' && (
              <>
                {/* Songs Shelf */}
                {results.songs?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold mb-1">
                      Songs
                    </p>
                    {results.songs.slice(0, 8).map((s) => (
                      <SongItem
                        key={s.id}
                        song={s}
                        isActive={currentSong?.id === s.id}
                        isPlaying={currentSong?.id === s.id && isPlaying}
                        liked={isLiked(s.id)}
                        onPlay={() => handlePlay(s, results.songs)}
                        onToggleLike={() => toggleLike(s)}
                      />
                    ))}
                  </div>
                )}

                {/* Albums Shelf */}
                {results.albums?.length > 0 && (
                  <div className="pt-3 space-y-2">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                      Albums
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {results.albums.slice(0, 4).map((a) => (
                        <div
                          key={a.id}
                          onClick={() => {
                            routeToSongEntity({ ...a, albumId: a.id, album: a.title });
                            onClose();
                          }}
                          className="p-2.5 rounded-2xl bg-[#18181a] border border-white/5 flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
                        >
                          <img
                            src={a.thumbnail}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-label-sm font-semibold text-white truncate">{a.title}</p>
                            <p className="text-body-xs text-neutral-400 truncate">{a.artist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Artists Shelf */}
                {results.artists?.length > 0 && (
                  <div className="pt-3 space-y-2">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                      Artists
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {results.artists.slice(0, 4).map((art) => (
                        <div
                          key={art.id}
                          onClick={() => {
                            routeToArtistEntity(art.title || art.name, art.id);
                            onClose();
                          }}
                          className="p-2.5 rounded-2xl bg-[#18181a] border border-white/5 flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
                        >
                          <img
                            src={art.thumbnail}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-label-sm font-semibold text-white truncate">{art.title || art.name}</p>
                            <p className="text-body-xs text-neutral-400">Artist</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'songs' && Array.isArray(results) && (
              <div className="space-y-1">
                {results.map((s) => (
                  <SongItem
                    key={s.id}
                    song={s}
                    isActive={currentSong?.id === s.id}
                    isPlaying={currentSong?.id === s.id && isPlaying}
                    liked={isLiked(s.id)}
                    onPlay={() => handlePlay(s, results)}
                    onToggleLike={() => toggleLike(s)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SongItem({ song, isActive, isPlaying, liked, onPlay, onToggleLike }) {
  return (
    <div
      onClick={onPlay}
      className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
        isActive
          ? 'bg-amber-500/15 border border-amber-500/40'
          : 'bg-[#18181a] border border-white/5 active:bg-[#222225]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#222225] flex-shrink-0">
          <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
          {isActive && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              {isPlaying ? (
                <span className="material-symbols-outlined text-amber-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  graphic_eq
                </span>
              ) : (
                <span className="material-symbols-outlined text-amber-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              )}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[13.5px] font-semibold truncate ${isActive ? 'text-amber-300' : 'text-white'}`}>
            {song.title}
          </p>
          <ArtistLinks
            artists={song.artists}
            artist={song.artist}
            artistId={song.artistId}
            className="text-[11.5px] text-neutral-400 truncate block"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          className={`p-1.5 rounded-full ${liked ? 'text-amber-500' : 'text-neutral-500'}`}
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>
            favorite
          </span>
        </button>
        <span className="text-[11px] font-mono text-neutral-500 min-w-[30px] text-right">
          {formatTime(song.duration)}
        </span>
      </div>
    </div>
  );
}
