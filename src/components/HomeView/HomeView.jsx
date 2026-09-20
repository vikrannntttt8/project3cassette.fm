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

      // ── Determine High-Confidence Top Result Hero Card ───────────────
      const clean = (str) =>
        (str || '')
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      const cleanQ = clean(query);
      let topResult = null;

      // 1. Exact matches (punctuation and symbols stripped)
      const exactArtist = artists.find((a) => clean(a.name || a.title) === cleanQ);
      const exactSong = songs.find((s) => clean(s.title) === cleanQ);
      const exactAlbum = albums.find((al) => clean(al.title) === cleanQ);

      // 2. Prefix matches
      const prefixArtist = artists.find((a) => clean(a.name || a.title).startsWith(cleanQ));
      const prefixSong = songs.find((s) => clean(s.title).startsWith(cleanQ));

      // Intelligent Ranking:
      // Exact Artist -> Exact Song (Steve Lacy's "oh yeah?" beats obscure "Oh Yeah" albums) -> Exact Album
      // -> Prefix Artist -> Prefix Song -> Popular First Song Fallback
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
          {/* Top Result Hero Section */}
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

          {/* Shelves in order: Songs -> Albums -> Artists */}
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
    <div className="h-full flex flex-col overflow-y-auto relative bg-[#000000]">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 px-4 sm:px-6 md:px-8 py-4 bg-[#000000]/90 backdrop-blur-xl border-b border-[#1a1a1a] pl-14 md:pl-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-col justify-center">
            <h1 className="text-headline-md sm:text-headline-lg font-bold text-white tracking-tight">
              {showSearch ? `Results for "${query}"` : `${getGreeting()}, Vikrant`}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial justify-end">
            <SearchBar query={query} onChange={search} onClear={clear} />
          </div>
        </div>

        {/* ── Search Tabs ───────────────────────────────────────── */}
        {showSearch && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
            {SEARCH_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`px-4 py-1.5 rounded-full text-label-md font-medium whitespace-nowrap transition-all text-[13px] sm:text-[14px] border ${
                  activeTab === tab
                    ? 'bg-white text-black border-white font-semibold shadow-sm'
                    : 'bg-transparent text-[#888888] border-[#333333] hover:text-white hover:border-[#666666]'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-5 sm:py-6 pb-36">
        {showSearch ? (
          renderResults()
        ) : (
          <HomeDefault
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
        <span className="material-symbols-outlined text-white text-[20px]">{icon}</span>
        <h2 className="text-headline-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-[#111111] border border-[#222222]" />
      ))}
    </div>
  );
}

function ErrorMsg({ msg, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="material-symbols-outlined text-[48px] text-[#888888]">cloud_off</span>
      <p className="text-headline-sm text-white font-semibold">Search encountered an issue</p>
      <p className="text-body-md text-[#888888] max-w-md">
        {msg || 'Unable to reach music endpoints. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-label-md hover:bg-neutral-200 transition-colors mt-2 cursor-pointer"
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
      <span className="material-symbols-outlined text-[48px] text-[#666666]">search_off</span>
      <p className="text-headline-sm text-white">No results found for "{query}"</p>
      <p className="text-body-md text-[#888888]">Try searching for a song title, artist, or album</p>
    </div>
  );
}

// ── Carousel Header Component with Sleek Navigation Controls ─────────

function ShelfHeader({ title, subtitle, icon, onPrev, onNext, children }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="material-symbols-outlined text-white text-[20px] flex-shrink-0">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-headline-sm font-bold text-white tracking-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-body-xs text-[#888888] truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {children}
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={onPrev}
            className="w-8 h-8 rounded-full border border-[#2a2a2a] hover:border-white bg-[#0d0d0d] hover:bg-white/10 text-[#888888] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous"
            title="Previous"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            onClick={onNext}
            className="w-8 h-8 rounded-full border border-[#2a2a2a] hover:border-white bg-[#0d0d0d] hover:bg-white/10 text-[#888888] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Next"
            title="Next"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Standardized Song Row for Quick Picks Carousel ───────────────────

function QuickPickRow({ song, isActive, isPlaying, onPlay, onAddToPlaylist }) {
  const { isLiked, toggleLike, routeToSongEntity, routeToArtistEntity } = usePlayer();
  const liked = isLiked(song.id);

  return (
    <div
      onClick={onPlay}
      className={`group flex items-center gap-3 p-2 rounded-xl transition-all duration-150 cursor-pointer ${
        isActive
          ? 'bg-white/10 border border-white/20'
          : 'hover:bg-white/[0.06] border border-transparent'
      }`}
    >
      {/* Track Thumbnail: Clean, fixed square (~48px x 48px, rounded-md) with hover play/active indicator */}
      <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#141414] border border-[#262626]">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white/30 text-[20px]">music_note</span>
          </div>
        )}
        <div
          className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
            isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {isActive && isPlaying ? (
            <div className="flex items-end gap-[2px] h-3.5 w-3.5">
              {[...Array(3)].map((_, i) => (
                <span key={i} className="visualizer-bar w-[2.5px] bg-white rounded-full" />
              ))}
            </div>
          ) : (
            <span
              className="material-symbols-outlined text-white text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
          )}
        </div>
      </div>

      {/* Track Info Box: Line 1 Title, Line 2 Artist */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span
          onClick={(e) => {
            e.stopPropagation();
            routeToSongEntity(song);
          }}
          className={`font-medium text-white truncate text-sm hover:underline cursor-pointer ${
            isActive ? 'text-white font-bold' : ''
          }`}
          title={song.title}
        >
          {song.title}
          {song.explicit && (
            <span className="ml-1.5 text-[10px] bg-white/10 text-[#888888] px-1 py-0.2 rounded align-middle">
              E
            </span>
          )}
        </span>
        <ArtistLinks
          artists={song.artists}
          artist={song.artist}
          artistId={song.artistId}
          className="text-xs text-neutral-400 truncate mt-0.5"
        />
      </div>

      {/* Duration / Options: Display track length (e.g. 3:22) and hover options cleanly aligned to right */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div
          className={`flex items-center gap-0.5 transition-opacity ${
            liked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(song);
            }}
            className={`p-1 rounded-full hover:scale-110 transition-transform cursor-pointer ${
              liked ? 'text-white' : 'text-[#888888] hover:text-white'
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
        <span className="text-xs text-[#888888] font-mono min-w-[34px] text-right">
          {formatTime(song.duration)}
        </span>
      </div>
    </div>
  );
}

// ── Live Synced Home Feed (Quick Picks, Daily Mixes, Trending Albums) ──

function HomeDefault({ onPlaySong, onAlbumClick, onArtistClick, onAddToPlaylist }) {
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
    fetch('/api/home/feed')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load YouTube Music live feed');
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
      const res = await fetch(`/api/search?q=${encodeURIComponent(mix.title + ' songs')}&type=songs`);
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
      <div className="flex flex-col gap-10">
        <FeedSkeleton title="Quick Picks" />
        <FeedSkeleton title="Daily Mixes & Radio" />
        <FeedSkeleton title="Trending Albums" />
      </div>
    );
  }

  if (error && (!feedData || !feedData.quickPicks?.length)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-[48px] text-[#666666]">wifi_off</span>
        <p className="text-headline-sm font-semibold text-white mt-2">Live feed currently unavailable</p>
        <p className="text-body-sm text-[#888888] mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-full bg-white text-black font-semibold text-label-md hover:bg-neutral-200 transition-colors cursor-pointer"
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

  // Group Quick Picks into columns of 4 tracks
  const quickPickColumns = chunkArray(quickPicks, 4);

  return (
    <div className="flex flex-col gap-10">
      {/* ── 1. Listen Again / Jump Back In (If history exists) ──── */}
      {history && history.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-[20px]">history</span>
            <div>
              <h2 className="text-headline-sm font-bold text-white tracking-tight">Listen Again</h2>
              <p className="text-body-xs text-[#888888]">Jump back into your recent favorites</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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

      {/* ── 2. Quick Picks (Horizontal Carousel with 4-track Columns) ── */}
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
              className="px-3 py-1 rounded-full border border-[#333333] hover:border-white text-[12px] text-[#888888] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
              Play All
            </button>
          </ShelfHeader>

          <div
            ref={quickPicksRef}
            className="flex flex-row gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
          >
            {quickPickColumns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="flex flex-col gap-2 min-w-[320px] max-w-[380px] w-[340px] flex-shrink-0 snap-start"
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

      {/* ── 3. Daily Mixes & Curated Radio (Horizontal Carousel) ── */}
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
            className="flex flex-row gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
          >
            {dailyMixes.slice(0, 12).map((mix) => (
              <button
                key={mix.id}
                onClick={() => playMix(mix)}
                className="group flex flex-col gap-2 rounded-xl p-3 bg-[#0a0a0a] hover:bg-[#111111] border border-[#222222] hover:border-white transition-all duration-200 text-left w-44 sm:w-48 flex-shrink-0 snap-start cursor-pointer relative"
              >
                {loadingMixId === mix.id && (
                  <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center z-10">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#141414] border border-[#262626]">
                  {mix.thumbnail ? (
                    <img
                      src={mix.thumbnail}
                      alt={mix.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/20 text-[40px]">
                        radio
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-black text-[22px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-label-lg font-semibold text-white truncate group-hover:underline">
                    {mix.title}
                  </span>
                  <span className="text-body-sm text-[#888888] truncate">
                    {mix.subtitle || 'YouTube Music Radio'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Trending Albums & Releases (Horizontal Carousel) ── */}
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
            className="flex flex-row gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
          >
            {trendingAlbums.map((album) => (
              <div key={album.id} className="w-44 sm:w-48 flex-shrink-0 snap-start">
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
            className="flex flex-row gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
          >
            {sec.items.slice(0, 8).map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  if (it.type === 'album') onAlbumClick(it);
                  else playMix(it);
                }}
                className="group flex flex-col gap-2 rounded-xl p-3 bg-[#0a0a0a] hover:bg-[#111111] border border-[#222222] hover:border-white transition-all duration-200 text-left w-44 sm:w-48 flex-shrink-0 snap-start cursor-pointer"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#141414] border border-[#262626]">
                  {it.thumbnail ? (
                    <img
                      src={it.thumbnail}
                      alt={it.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/20 text-[40px]">
                        graphic_eq
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-black text-[22px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-label-lg font-semibold text-white truncate group-hover:underline">
                    {it.title}
                  </span>
                  <span className="text-body-sm text-[#888888] truncate">
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
      <div className="h-6 w-40 bg-[#1a1a1a] rounded" />
      <div className="flex gap-3 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-44 w-44 rounded-xl bg-[#111111] border border-[#222222] flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

function TipBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3.5 py-2 flex items-center justify-between gap-3 text-body-sm text-[#888888]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-[16px] text-white flex-shrink-0">info</span>
        <p className="truncate text-[12px]">
          <span className="text-white font-medium">Tip:</span> All tracks stream in high-fidelity
          OPUS via YouTube Music. Sign in with Google in Settings to sync your library.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-[#666666] hover:text-white transition-colors flex-shrink-0 p-0.5 cursor-pointer"
        title="Dismiss tip"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
