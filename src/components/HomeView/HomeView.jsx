import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useMusicSearch, SEARCH_TABS } from '../../hooks/useMusicSearch.js';
import { formatTime } from '../../utils/timeFormat.js';
import SearchBar from './SearchBar.jsx';
import SongRow from './SongRow.jsx';
import AlbumCard from './AlbumCard.jsx';
import ArtistCard from './ArtistCard.jsx';
import TopResultHero from './TopResultHero.jsx';
import TrackContextMenu from '../shared/TrackContextMenu.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import ArtistModal from '../ArtistView/ArtistModal.jsx';
import MarqueeText from '../shared/MarqueeText.jsx';
import { apiUrl } from '../../utils/apiConfig.js';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const TAB_LABELS = {
  all: 'All',
  songs: 'Songs',
  albums: 'Albums',
  artists: 'Artists',
};

const HOME_CHIPS = [
  { id: 'all',     label: 'All',         icon: 'explore' },
  { id: 'picks',   label: 'Quick Picks', icon: 'bolt' },
  { id: 'mixes',   label: 'Mixes',       icon: 'radio' },
  { id: 'albums',  label: 'Albums',      icon: 'album' },
  { id: 'artists', label: 'Artists',     icon: 'person' },
];

export default function HomeView() {
  const {
    loadSong,
    currentSong,
    isPlaying,
    togglePlay,
    routeToSongEntity,
    routeToArtistEntity,
  } = usePlayer();
  const { query, results, loading, error, activeTab, search, switchTab, clear } = useMusicSearch();

  const [addMenuSong, setAddMenuSong] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [activeChip, setActiveChip] = useState('all');

  // ── Play handlers ─────────────────────────────────────────────────
  const handlePlaySong = useCallback(
    (song, songList = null) => {
      if (currentSong?.id === song.id) {
        togglePlay();
        return;
      }
      const queue = songList || (results && activeTab === 'songs' ? results : null) || [song];
      const idx = queue.findIndex((s) => s.id === song.id);
      loadSong(song, queue, idx >= 0 ? idx : 0);
    },
    [currentSong, togglePlay, loadSong, results, activeTab]
  );

  const handleAlbumClick = useCallback(
    (album) => {
      routeToSongEntity({
        ...album,
        albumId: album.id || album.browseId,
        album: album.title || album.name,
      });
    },
    [routeToSongEntity]
  );

  const handleArtistClick = useCallback(
    (artist) => {
      const name = typeof artist === 'string' ? artist : artist.title || artist.name;
      const id = typeof artist === 'string' ? null : artist.id || artist.browseId;
      routeToArtistEntity(name, id);
    },
    [routeToArtistEntity]
  );

  // ── Render results by tab ─────────────────────────────────────────
  const renderResults = () => {
    if (!results) return null;
    if (loading) return <SearchSkeleton />;
    if (error) return <ErrorMsg msg={error} onRetry={() => search(query)} />;

    if (activeTab === 'all') {
      const { songs = [], albums = [], artists = [] } = results;

      const clean = (str) =>
        (str || '')
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      const cleanQ = clean(query);
      let topResult = null;

      const exactArtist = artists.find((a) => clean(a.name || a.title) === cleanQ);
      const exactSong = songs.find((s) => clean(s.title) === cleanQ);
      const exactAlbum = albums.find((al) => clean(al.title) === cleanQ);

      const prefixArtist = artists.find((a) => clean(a.name || a.title).startsWith(cleanQ));
      const prefixSong = songs.find((s) => clean(s.title).startsWith(cleanQ));

      if (exactArtist) {
        topResult = { ...exactArtist, type: 'artist' };
      } else if (exactSong) {
        topResult = { ...exactSong, type: 'song' };
      } else if (exactAlbum) {
        topResult = { ...exactAlbum, type: 'album' };
      } else if (prefixArtist) {
        topResult = { ...prefixArtist, type: 'artist' };
      } else if (prefixSong) {
        topResult = { ...prefixSong, type: 'song' };
      } else if (songs.length > 0) {
        topResult = { ...songs[0], type: 'song' };
      } else if (artists.length > 0) {
        topResult = { ...artists[0], type: 'artist' };
      } else if (albums.length > 0) {
        topResult = { ...albums[0], type: 'album' };
      }

      return (
        <div className="flex flex-col gap-8">
          {topResult && (
            <section className="w-full">
              <TopResultHero
                entity={topResult}
                onPlay={(ent) => {
                  if (ent.type === 'artist') handleArtistClick(ent);
                  else if (ent.type === 'album') handleAlbumClick(ent);
                  else handlePlaySong(ent, songs);
                }}
                onNavigate={() => {
                  if (topResult.type === 'artist') handleArtistClick(topResult);
                  else if (topResult.type === 'album') handleAlbumClick(topResult);
                  else routeToSongEntity(topResult);
                }}
              />
            </section>
          )}

          {songs.length > 0 && (
            <ResultSection title="Songs" icon="music_note">
              {songs.slice(0, 6).map((s, i) => (
                <SongRow
                  key={s.id}
                  song={s}
                  index={i}
                  isActive={currentSong?.id === s.id}
                  isPlaying={currentSong?.id === s.id && isPlaying}
                  onPlay={() => handlePlaySong(s, songs)}
                  onAddToPlaylist={() => setAddMenuSong(s)}
                />
              ))}
            </ResultSection>
          )}
          {albums.length > 0 && (
            <ResultSection title="Albums" icon="album">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {albums.slice(0, 5).map((a) => (
                  <AlbumCard key={a.id} item={a} onClick={() => handleAlbumClick(a)} />
                ))}
              </div>
            </ResultSection>
          )}
          {artists.length > 0 && (
            <ResultSection title="Artists" icon="person">
              <div className="flex flex-wrap gap-4">
                {artists.slice(0, 6).map((a) => (
                  <ArtistCard key={a.id} artist={a} onClick={() => handleArtistClick(a)} />
                ))}
              </div>
            </ResultSection>
          )}
          {!topResult && !songs.length && !albums.length && !artists.length && (
            <NoResults query={query} />
          )}
        </div>
      );
    }

    if (activeTab === 'songs') {
      const songs = Array.isArray(results) ? results : [];
      if (!songs.length) return <NoResults query={query} />;
      return (
        <div className="flex flex-col gap-1">
          {songs.map((s, i) => (
            <SongRow
              key={s.id}
              song={s}
              index={i}
              isActive={currentSong?.id === s.id}
              isPlaying={currentSong?.id === s.id && isPlaying}
              onPlay={() => handlePlaySong(s, songs)}
              onAddToPlaylist={() => setAddMenuSong(s)}
            />
          ))}
        </div>
      );
    }

    if (activeTab === 'albums') {
      const items = Array.isArray(results) ? results : [];
      if (!items.length) return <NoResults query={query} />;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((a) => (
            <AlbumCard key={a.id} item={a} onClick={() => handleAlbumClick(a)} />
          ))}
        </div>
      );
    }

    if (activeTab === 'artists') {
      const items = Array.isArray(results) ? results : [];
      if (!items.length) return <NoResults query={query} />;
      return (
        <div className="flex flex-wrap gap-5">
          {items.map((a) => (
            <ArtistCard key={a.id} artist={a} onClick={() => handleArtistClick(a)} />
          ))}
        </div>
      );
    }

    return null;
  };

  const showSearch = query.trim().length > 0;

  return (
    <div className="h-full flex flex-col overflow-y-auto relative bg-[#0e0e0e] pt-14 md:pt-0 no-scrollbar">
      {/* ── Desktop Header ── */}
      <header className="hidden md:block sticky top-0 z-20 px-6 lg:px-8 py-4 bg-[#0e0e0e]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col justify-center">
            <h1 className="text-headline-md font-bold text-white tracking-tight">
              {showSearch ? `Results for "${query}"` : `${getGreeting()}, Vikrant`}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-1 sm:flex-initial justify-end">
            <SearchBar query={query} onChange={search} onClear={clear} />
          </div>
        </div>

        {/* Desktop Filter Chips / Tabs */}
        {!showSearch && (
          <div className="flex items-center gap-2 mt-3.5 overflow-x-auto pb-0.5 no-scrollbar">
            {HOME_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveChip(chip.id)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeChip === chip.id
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#18181a] text-neutral-400 border border-white/5 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        )}

        {showSearch && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
            {SEARCH_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`px-4 py-1.5 rounded-full text-label-md font-medium whitespace-nowrap transition-all text-[13px] sm:text-[14px] border ${
                  activeTab === tab
                    ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-sm'
                    : 'bg-transparent text-neutral-400 border-white/10 hover:text-white hover:border-white/30'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Mobile Filter Chips (Flush Non-Sticky Flow) ── */}
      {!showSearch && (
        <div className="md:hidden bg-[#0e0e0e] border-b border-white/5 px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {HOME_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveChip(chip.id)}
              className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 min-h-[38px] cursor-pointer ${
                activeChip === chip.id
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'bg-[#18181a] text-neutral-400 border border-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Main Content Area ── */}
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-5 pb-28 md:pb-20">
        {showSearch ? (
          renderResults()
        ) : (
          <HomeDefault
            activeChip={activeChip}
            onPlaySong={handlePlaySong}
            onAlbumClick={handleAlbumClick}
            onArtistClick={(artistName, artistId) => routeToArtistEntity(artistName, artistId)}
            onAddToPlaylist={(song) => setAddMenuSong(song)}
          />
        )}
      </main>

      {/* ── Dedicated Artist Discography Modal ──────────────── */}
      {selectedArtist && (
        <ArtistModal
          artistId={selectedArtist.artistId}
          artistName={selectedArtist.artistName}
          onClose={() => setSelectedArtist(null)}
          onSelectTrack={(track) => {
            handlePlaySong(track);
            setSelectedArtist(null);
          }}
        />
      )}

      {/* ── Add to Playlist menu overlay ────────────────────── */}
      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function ResultSection({ title, icon, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-500 text-[20px]">{icon}</span>
        <h2 className="text-headline-sm font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-[#18181a] border border-white/5" />
      ))}
    </div>
  );
}

function ErrorMsg({ msg, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="material-symbols-outlined text-[48px] text-amber-500">cloud_off</span>
      <p className="text-headline-sm text-white font-semibold">Search encountered an issue</p>
      <p className="text-body-md text-neutral-400 max-w-md">
        {msg || 'Unable to reach music endpoints. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-full bg-amber-500 text-black font-bold text-label-md hover:bg-amber-400 transition-colors mt-2 cursor-pointer shadow-md shadow-amber-500/20"
        >
          Retry Search
        </button>
      )}
    </div>
  );
}

function NoResults({ query }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span className="material-symbols-outlined text-[48px] text-neutral-600">search_off</span>
      <p className="text-headline-sm text-white">No results found for "{query}"</p>
      <p className="text-body-md text-neutral-400">Try searching for a song title, artist, or album</p>
    </div>
  );
}

function ShelfHeader({ title, subtitle, icon, onPrev, onNext, children }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="material-symbols-outlined text-amber-500 text-[20px] flex-shrink-0">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-headline-sm font-bold text-white tracking-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-body-xs text-neutral-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {children}
        {onPrev && onNext && (
          <div className="hidden md:flex items-center gap-1.5 ml-1">
            <button
              onClick={onPrev}
              className="w-9 h-9 rounded-full border border-white/10 hover:border-white/30 bg-[#18181a] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={onNext}
              className="w-9 h-9 rounded-full border border-white/10 hover:border-white/30 bg-[#18181a] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Next"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickPickRow({ song, isActive, isPlaying, onPlay, onAddToPlaylist }) {
  const { isLiked, toggleLike } = usePlayer();
  const liked = isLiked(song.id);

  return (
    <div
      onClick={onPlay}
      className={`group flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-150 cursor-pointer min-h-[50px] select-none ${
        isActive
          ? 'bg-amber-500/15 text-amber-300'
          : 'bg-[#18181a]/55 hover:bg-[#18181a] text-white'
      }`}
    >
      <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-[#222225]">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white/30 text-[18px]">music_note</span>
          </div>
        )}
        <div
          className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
            isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {isActive && isPlaying ? (
            <span className="material-symbols-outlined text-amber-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              graphic_eq
            </span>
          ) : (
            <span
              className="material-symbols-outlined text-white text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <MarqueeText
          text={song.title}
          className={`font-semibold text-white text-[13.5px] leading-tight ${
            isActive ? 'text-amber-300 font-bold' : ''
          }`}
        />
        <ArtistLinks
          artists={song.artists}
          artist={song.artist}
          artistId={song.artistId}
          className="text-[11px] text-neutral-400 truncate mt-0.5"
        />
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <div
          className={`flex items-center gap-0.5 transition-opacity ${
            liked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(song);
            }}
            className={`p-1.5 rounded-full hover:scale-110 transition-transform cursor-pointer ${
              liked ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
            }`}
            title={liked ? 'Unlike' : 'Like'}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}
            >
              favorite
            </span>
          </button>
          <TrackContextMenu track={song} onAddToPlaylist={onAddToPlaylist} />
        </div>
        <span className="text-[11px] text-neutral-500 font-mono min-w-[32px] text-right">
          {formatTime(song.duration)}
        </span>
      </div>
    </div>
  );
}

// ── Live Synced Home Feed with Reactive Filter Chips ─────────────────

function HomeDefault({ activeChip, onPlaySong, onAlbumClick, onArtistClick, onAddToPlaylist }) {
  const { currentSong, isPlaying, history } = usePlayer();
  const [feedData, setFeedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMixId, setLoadingMixId] = useState(null);

  const quickPicksRef = useRef(null);
  const dailyMixesRef = useRef(null);
  const trendingAlbumsRef = useRef(null);
  const dynamicShelvesRef = useRef(null);

  const scrollShelf = (ref, offset) => {
    ref.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(apiUrl('/api/home/feed'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load YouTube Music feed');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setFeedData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const playMix = async (mix) => {
    setLoadingMixId(mix.id);
    try {
      const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(mix.title + ' songs')}&type=songs`));
      if (res.ok) {
        const songs = await res.json();
        if (Array.isArray(songs) && songs.length > 0) {
          onPlaySong(songs[0], songs);
        }
      }
    } catch (e) {
      console.error('[Live Mix Playback] Error:', e);
    } finally {
      setLoadingMixId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <FeedSkeleton title="Quick Picks" />
        <FeedSkeleton title="Daily Mixes & Radio" />
        <FeedSkeleton title="Trending Albums" />
      </div>
    );
  }

  if (error && (!feedData || !feedData.quickPicks?.length)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-[48px] text-amber-500">wifi_off</span>
        <p className="text-headline-sm font-semibold text-white mt-2">Live feed currently unavailable</p>
        <p className="text-body-sm text-neutral-400 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-full bg-amber-500 text-black font-bold text-label-md hover:bg-amber-400 transition-colors cursor-pointer"
        >
          Reload Feed
        </button>
      </div>
    );
  }

  const quickPicks = feedData?.quickPicks || [];
  const dailyMixes = feedData?.dailyMixes || [];
  const trendingAlbums = feedData?.trendingAlbums || [];
  const dynamicSections = feedData?.dynamicSections || [];

  const quickPickColumns = chunkArray(quickPicks, 4);

  // ── Render Filtered Views based on activeChip ─────────────────────

  // 1. Filter: Quick Picks Only
  if (activeChip === 'picks') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-500 text-[24px]">bolt</span>
            <h2 className="text-headline-sm font-bold text-white">Quick Picks & Instant Radio</h2>
          </div>
          <button
            onClick={() => onPlaySong(quickPicks[0], quickPicks)}
            className="px-4 py-2 rounded-full bg-amber-500 text-black font-bold text-label-sm hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
            Play All ({quickPicks.length})
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {quickPicks.map((s) => (
            <QuickPickRow
              key={s.id}
              song={s}
              isActive={currentSong?.id === s.id}
              isPlaying={currentSong?.id === s.id && isPlaying}
              onPlay={() => onPlaySong(s, quickPicks)}
              onAddToPlaylist={() => onAddToPlaylist(s)}
            />
          ))}
        </div>
      </div>
    );
  }

  // 2. Filter: Mixes & Radio Only
  if (activeChip === 'mixes') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-amber-500 text-[24px]">radio</span>
          <h2 className="text-headline-sm font-bold text-white">Daily Mixes & Curated Radio</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {dailyMixes.map((mix) => (
            <button
              key={mix.id}
              onClick={() => playMix(mix)}
              className="group flex flex-col gap-2 rounded-2xl p-3 bg-[#18181a] hover:bg-[#222225] border border-white/5 hover:border-amber-500/40 transition-all text-left cursor-pointer"
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#222225]">
                {mix.thumbnail ? (
                  <img src={mix.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <span className="material-symbols-outlined text-[36px]">radio</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-label-md font-bold text-white truncate group-hover:text-amber-300">{mix.title}</p>
              <p className="text-body-xs text-neutral-400 truncate">{mix.subtitle || 'Radio Station'}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 3. Filter: Albums Only
  if (activeChip === 'albums') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-amber-500 text-[24px]">album</span>
          <h2 className="text-headline-sm font-bold text-white">Trending Albums & Releases</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {trendingAlbums.map((album) => (
            <AlbumCard key={album.id} item={album} onClick={() => onAlbumClick(album)} />
          ))}
        </div>
      </div>
    );
  }

  // 4. Filter: Artists Only
  if (activeChip === 'artists') {
    const artistList = [
      ...quickPicks.map((s) => ({ id: s.artistId || s.id, name: s.artist, thumbnail: s.thumbnail })),
    ].filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-amber-500 text-[24px]">person</span>
          <h2 className="text-headline-sm font-bold text-white">Featured Artists</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {artistList.map((art) => (
            <div
              key={art.name}
              onClick={() => onArtistClick(art.name, art.id)}
              className="p-3.5 rounded-2xl bg-[#18181a] border border-white/5 flex flex-col items-center text-center gap-2.5 cursor-pointer hover:bg-[#222225] transition-colors"
            >
              <img src={art.thumbnail} alt="" className="w-20 h-20 rounded-full object-cover border border-white/10" />
              <p className="text-label-md font-bold text-white truncate max-w-full">{art.name}</p>
              <p className="text-[11px] text-neutral-400">Artist</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. Default: All Feed View
  return (
    <div className="flex flex-col gap-9">
      {/* ── 1. Listen Again (If history exists) ──── */}
      {history && history.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[20px]">history</span>
            <div>
              <h2 className="text-headline-sm font-bold text-white tracking-tight">Listen Again</h2>
              <p className="text-body-xs text-neutral-400">Jump back into your recent tracks</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {history.slice(0, 6).map((s, idx) => (
              <SongRow
                key={`hist-${s.id}-${idx}`}
                song={s}
                index={idx}
                isActive={currentSong?.id === s.id}
                isPlaying={currentSong?.id === s.id && isPlaying}
                onPlay={() => onPlaySong(s, history)}
                onAddToPlaylist={() => onAddToPlaylist(s)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── 2. Quick Picks (Carousel) ── */}
      {quickPicks.length > 0 && (
        <section className="flex flex-col">
          <ShelfHeader
            title="Quick Picks"
            subtitle="Start instant radio with live YouTube Music hits"
            icon="bolt"
            onPrev={() => scrollShelf(quickPicksRef, -400)}
            onNext={() => scrollShelf(quickPicksRef, 400)}
          >
            <button
              onClick={() => onPlaySong(quickPicks[0], quickPicks)}
              className="px-3 py-1 rounded-full border border-white/10 hover:border-amber-500 text-[12px] text-neutral-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
              Play All
            </button>
          </ShelfHeader>

          <div
            ref={quickPicksRef}
            className="flex flex-row gap-3.5 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
          >
            {quickPickColumns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="flex flex-col gap-2 min-w-[280px] max-w-[360px] w-[300px] flex-shrink-0 snap-start"
              >
                {col.map((s) => (
                  <QuickPickRow
                    key={s.id}
                    song={s}
                    isActive={currentSong?.id === s.id}
                    isPlaying={currentSong?.id === s.id && isPlaying}
                    onPlay={() => onPlaySong(s, quickPicks)}
                    onAddToPlaylist={() => onAddToPlaylist(s)}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Daily Mixes & Curated Radio (Carousel) ── */}
      {dailyMixes.length > 0 && (
        <section className="flex flex-col">
          <ShelfHeader
            title="Daily Mixes & Radio"
            subtitle="Non-stop curated radio stations"
            icon="radio"
            onPrev={() => scrollShelf(dailyMixesRef, -400)}
            onNext={() => scrollShelf(dailyMixesRef, 400)}
          />

          <div
            ref={dailyMixesRef}
            className="flex flex-row gap-3.5 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
          >
            {dailyMixes.slice(0, 12).map((mix) => (
              <button
                key={mix.id}
                onClick={() => playMix(mix)}
                className="group flex flex-col gap-2 rounded-2xl p-3 bg-[#18181a] hover:bg-[#222225] border border-white/5 hover:border-amber-500/40 transition-all text-left w-40 sm:w-44 flex-shrink-0 snap-start cursor-pointer relative"
              >
                {loadingMixId === mix.id && (
                  <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center z-10">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#222225] border border-white/5">
                  {mix.thumbnail ? (
                    <img
                      src={mix.thumbnail}
                      alt={mix.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <span className="material-symbols-outlined text-[36px]">radio</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-[22px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-label-md font-bold text-white truncate group-hover:text-amber-300">
                    {mix.title}
                  </span>
                  <span className="text-body-xs text-neutral-400 truncate">
                    {mix.subtitle || 'YouTube Music Radio'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Trending Albums & Releases ── */}
      {trendingAlbums.length > 0 && (
        <section className="flex flex-col">
          <ShelfHeader
            title="Trending Albums"
            subtitle="Top chart-topping albums on YouTube Music"
            icon="album"
            onPrev={() => scrollShelf(trendingAlbumsRef, -400)}
            onNext={() => scrollShelf(trendingAlbumsRef, 400)}
          />

          <div
            ref={trendingAlbumsRef}
            className="flex flex-row gap-3.5 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
          >
            {trendingAlbums.map((album) => (
              <div key={album.id} className="w-40 sm:w-44 flex-shrink-0 snap-start">
                <AlbumCard item={album} onClick={() => onAlbumClick(album)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Extra Dynamic Shelves from YouTube Music Feed ───── */}
      {dynamicSections.slice(1).map((sec) => (
        <section key={sec.id} className="flex flex-col">
          <ShelfHeader
            title={sec.title}
            icon="queue_music"
            onPrev={() => scrollShelf(dynamicShelvesRef, -400)}
            onNext={() => scrollShelf(dynamicShelvesRef, 400)}
          />

          <div
            ref={dynamicShelvesRef}
            className="flex flex-row gap-3.5 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
          >
            {sec.items.slice(0, 8).map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  if (it.type === 'album') onAlbumClick(it);
                  else playMix(it);
                }}
                className="group flex flex-col gap-2 rounded-2xl p-3 bg-[#18181a] hover:bg-[#222225] border border-white/5 hover:border-amber-500/40 transition-all text-left w-40 sm:w-44 flex-shrink-0 snap-start cursor-pointer"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#222225]">
                  {it.thumbnail ? (
                    <img
                      src={it.thumbnail}
                      alt={it.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <span className="material-symbols-outlined text-[36px]">graphic_eq</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-[22px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-label-md font-bold text-white truncate group-hover:text-amber-300">
                    {it.title}
                  </span>
                  <span className="text-body-xs text-neutral-400 truncate">
                    {it.subtitle || 'Curated Feed'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Tip Banner */}
      <TipBanner />
    </div>
  );
}

function FeedSkeleton({ title }) {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="h-6 w-40 bg-[#18181a] rounded-xl" />
      <div className="flex gap-3 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-44 w-44 rounded-2xl bg-[#18181a] border border-white/5 flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

function TipBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#18181a] px-4 py-3 flex items-center justify-between gap-3 text-body-sm text-neutral-400">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-[18px] text-amber-500 flex-shrink-0">info</span>
        <p className="truncate text-[12.5px]">
          <span className="text-white font-semibold">Fidelity Engine:</span> All tracks stream in high-bitrate
          OPUS via YouTube Music. Sign in with Google in Settings to sync your cloud library.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-neutral-500 hover:text-white transition-colors flex-shrink-0 p-1 cursor-pointer"
        title="Dismiss tip"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
