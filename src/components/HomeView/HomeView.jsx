import { useState, useCallback } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useMusicSearch, SEARCH_TABS } from '../../hooks/useMusicSearch.js';
import { getAlbumSongs, getArtistSongs, getPlaylistSongs, searchSongs as saavnSearchSongs } from '../../utils/saavn.js';
import SearchBar      from './SearchBar.jsx';
import SongRow        from './SongRow.jsx';
import AlbumCard      from './AlbumCard.jsx';
import ArtistCard     from './ArtistCard.jsx';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TAB_LABELS = {
  all: 'All', songs: 'Songs', albums: 'Albums', artists: 'Artists', playlists: 'Playlists',
};

export default function HomeView() {
  const { loadSong, playCollection, currentSong, isPlaying, togglePlay } = usePlayer();
  const { query, results, loading, error, activeTab, search, switchTab, clear } = useMusicSearch();

  const [addMenuSong, setAddMenuSong]   = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Play handlers ─────────────────────────────────────────────────

  const handlePlaySong = useCallback((song, songList = null) => {
    if (currentSong?.id === song.id) { togglePlay(); return; }
    const queue = songList || (results && activeTab === 'songs' ? results : null) || [song];
    const idx   = queue.findIndex(s => s.id === song.id);
    loadSong(song, queue, idx >= 0 ? idx : 0);
  }, [currentSong, togglePlay, loadSong, results, activeTab]);

  const handleAlbumClick = useCallback(async (album) => {
    setDetailLoading(true);
    try {
      const data = await getAlbumSongs(album.id);
      if (data.songs.length) playCollection(data.songs, 0);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  }, [playCollection]);

  const handleArtistClick = useCallback(async (artist) => {
    setDetailLoading(true);
    try {
      const data = await getArtistSongs(artist.id);
      if (data.songs.length) playCollection(data.songs, 0);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  }, [playCollection]);

  const handlePlaylistClick = useCallback(async (playlist) => {
    setDetailLoading(true);
    try {
      const data = await getPlaylistSongs(playlist.id);
      if (data.songs.length) playCollection(data.songs, 0);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  }, [playCollection]);

  // ── Render results by tab ─────────────────────────────────────────

  const renderResults = () => {
    if (!results) return null;
    if (loading) return <SearchSkeleton />;
    if (error)   return <ErrorMsg msg={error} onRetry={() => search(query)} />;

    if (activeTab === 'all') {
      const { songs = [], albums = [], artists = [], playlists = [] } = results;
      return (
        <div className="flex flex-col gap-8">
          {songs.length > 0 && (
            <ResultSection title="TRACK MATCHES" icon="music_note" badge={`${songs.length} TRACKS`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {songs.slice(0, 6).map((s, i) => (
                  <SongRow key={s.id} song={s} index={i}
                    isActive={currentSong?.id === s.id}
                    isPlaying={currentSong?.id === s.id && isPlaying}
                    onPlay={() => handlePlaySong(s, songs)}
                    onAddToPlaylist={() => setAddMenuSong(s)} />
                ))}
              </div>
            </ResultSection>
          )}
          {albums.length > 0 && (
            <ResultSection title="ALBUM RELEASES" icon="album" badge={`${albums.length} ALBUMS`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {albums.slice(0, 5).map(a => (
                  <AlbumCard key={a.id} item={a} onClick={() => handleAlbumClick(a)} />
                ))}
              </div>
            </ResultSection>
          )}
          {artists.length > 0 && (
            <ResultSection title="FEATURED ARTISTS" icon="person" badge={`${artists.length} FOUND`}>
              <div className="flex flex-wrap gap-4">
                {artists.slice(0, 6).map(a => (
                  <ArtistCard key={a.id} artist={a} onClick={() => handleArtistClick(a)} />
                ))}
              </div>
            </ResultSection>
          )}
          {playlists.length > 0 && (
            <ResultSection title="CURATED PLAYLISTS" icon="queue_music" badge={`${playlists.length} LISTS`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {playlists.slice(0, 5).map(p => (
                  <AlbumCard key={p.id} item={p} onClick={() => handlePlaylistClick(p)} />
                ))}
              </div>
            </ResultSection>
          )}
          {!songs.length && !albums.length && !artists.length && !playlists.length && (
            <NoResults query={query} />
          )}
        </div>
      );
    }

    if (activeTab === 'songs') {
      const songs = Array.isArray(results) ? results : [];
      if (!songs.length) return <NoResults query={query} />;
      return (
        <div className="flex flex-col gap-2">
          {songs.map((s, i) => (
            <SongRow key={s.id} song={s} index={i}
              isActive={currentSong?.id === s.id}
              isPlaying={currentSong?.id === s.id && isPlaying}
              onPlay={() => handlePlaySong(s, songs)}
              onAddToPlaylist={() => setAddMenuSong(s)} />
          ))}
        </div>
      );
    }

    if (activeTab === 'albums') {
      const items = Array.isArray(results) ? results : [];
      if (!items.length) return <NoResults query={query} />;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(a => (
            <AlbumCard key={a.id} item={a} onClick={() => handleAlbumClick(a)} />
          ))}
        </div>
      );
    }

    if (activeTab === 'artists') {
      const items = Array.isArray(results) ? results : [];
      if (!items.length) return <NoResults query={query} />;
      return (
        <div className="flex flex-wrap gap-4">
          {items.map(a => (
            <ArtistCard key={a.id} artist={a} onClick={() => handleArtistClick(a)} />
          ))}
        </div>
      );
    }

    if (activeTab === 'playlists') {
      const items = Array.isArray(results) ? results : [];
      if (!items.length) return <NoResults query={query} />;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(p => (
            <AlbumCard key={p.id} item={p} onClick={() => handlePlaylistClick(p)} />
          ))}
        </div>
      );
    }

    return null;
  };

  const showSearch = query.trim().length > 0;

  return (
    <div className="h-full flex flex-col overflow-y-auto relative select-none">
      {/* Detail loading overlay */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="neo-card p-6 bg-[#161720] border-2 border-black shadow-neo-lg flex items-center gap-4">
            <div className="w-7 h-7 border-3 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-black text-white uppercase tracking-wider">RETRIEVING TRACKS...</span>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 px-6 sm:px-8 py-3.5 bg-[#0a0b0e]/90 backdrop-blur-md border-b-2 border-black shadow-[0_2px_0px_0px_#000]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="neo-badge bg-[#CCFF00] text-black text-[9px] py-0.5 px-1.5 font-black">
                {showSearch ? 'SEARCH MODE' : 'DASHBOARD'}
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                {showSearch ? `QUERY: "${query}"` : 'STUDIO PULSE'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
              {showSearch ? 'Search Results' : `${getGreeting()}, Vikrant`}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <SearchBar
              query={query}
              onChange={search}
              onClear={clear}
            />
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-full bg-[#14151e] border-2 border-black shadow-neo-sm">
              <span className="material-symbols-outlined text-[#86EFAC] text-[18px]">graphic_eq</span>
              <span className="text-[10px] font-black text-white uppercase tracking-wider font-mono">SAAVN · 320K</span>
            </div>
          </div>
        </div>

        {/* ── Neo-Brutalist Search Tabs (DM Pill Style) ──────────── */}
        {showSearch && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
            {SEARCH_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-[#86EFAC] text-black border-2 border-black shadow-neo-sm translate-x-0.5'
                    : 'bg-[#15161f] text-zinc-400 border-2 border-zinc-800 hover:border-black hover:text-white'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="flex-1 px-6 sm:px-8 py-6 pb-36">
        {showSearch
          ? renderResults()
          : <BentoHomeDefault onPlaySong={handlePlaySong} />
        }
      </main>

      {/* ── Add to Playlist menu overlay ────────────────────── */}
      {addMenuSong && (
        <AddToPlaylistMenu
          song={addMenuSong}
          onClose={() => setAddMenuSong(null)}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function ResultSection({ title, icon, badge, children }) {
  return (
    <section className="flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#86EFAC] text-[22px]">{icon}</span>
          <h2 className="text-sm font-black uppercase tracking-wider text-white">{title}</h2>
        </div>
        {badge && (
          <span className="neo-badge bg-black text-[#86EFAC] text-[9px] font-mono border border-zinc-700">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-zinc-900 border-2 border-zinc-800" />
      ))}
    </div>
  );
}

function ErrorMsg({ msg, onRetry }) {
  return (
    <div className="neo-card p-10 bg-[#161722] border-2 border-black shadow-neo text-center flex flex-col items-center gap-3 max-w-lg mx-auto my-12 animate-fade-in">
      <span className="material-symbols-outlined text-[48px] text-[#FDA4AF]">cloud_off</span>
      <p className="text-base font-black text-white uppercase tracking-wider">Search Stream Interrupted</p>
      <p className="text-xs font-mono text-zinc-400 max-w-md">{msg || 'Unable to connect to audio API. Verify endpoint or retry.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="neo-btn-mint px-4 py-2 rounded-2xl text-xs uppercase font-black tracking-wider mt-2">
          Retry Connection
        </button>
      )}
    </div>
  );
}

function NoResults({ query }) {
  return (
    <div className="neo-card p-12 bg-[#161722] border-2 border-black shadow-neo text-center flex flex-col items-center gap-2 max-w-md mx-auto my-12 animate-fade-in">
      <span className="material-symbols-outlined text-[48px] text-zinc-600">search_off</span>
      <p className="text-sm font-black uppercase text-zinc-300 tracking-wider">NO RESULTS FOUND FOR "{query}"</p>
      <p className="text-xs font-mono text-zinc-500">Try searching for a different song title, artist, or album</p>
    </div>
  );
}

// ── Bento Grid Default Home Dashboard ─────────────────────────────────

const STATIONS = [
  { id: 'st1', title: 'Arijit Singh Hits', subtitle: 'Bollywood', color: 'from-[#FF2E93] to-[#FF6B00]', badge: 'BOLLYWOOD', query: 'arijit singh hits' },
  { id: 'st2', title: 'Midnight Lofi',     subtitle: 'Chill Focus', color: 'from-[#6366F1] to-[#A855F7]', badge: 'LOFI // CHILL', query: 'lofi chill study beats' },
  { id: 'st3', title: 'Punjabi Bangers',   subtitle: 'Party Hits',  color: 'from-[#F59E0B] to-[#EF4444]', badge: 'PUNJABI // HYPE', query: 'punjabi hits latest' },
  { id: 'st4', title: 'Evergreen Romance', subtitle: 'Love Melodies', color: 'from-[#EC4899] to-[#8B5CF6]', badge: 'ROMANCE', query: 'romantic hindi classics' },
  { id: 'st5', title: 'Global Top 50',     subtitle: 'International', color: 'from-[#06B6D4] to-[#3B82F6]', badge: 'GLOBAL CHARTS', query: 'top english hits' },
];

const CURATED_TRACKS = [
  { id: 'c1', title: 'Blinding Lights', artist: 'The Weeknd', query: 'blinding lights the weeknd' },
  { id: 'c2', title: 'Kesariya', artist: 'Arijit Singh', query: 'kesariya arijit singh' },
  { id: 'c3', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', query: 'starboy the weeknd' },
  { id: 'c4', title: 'Tum Hi Ho', artist: 'Arijit Singh', query: 'tum hi ho aashiqui 2' },
];

function BentoHomeDefault() {
  const { loadSong } = usePlayer();
  const [stationLoading, setStationLoading] = useState(null);

  const playByQuery = async (query, id) => {
    setStationLoading(id);
    try {
      const songs = await saavnSearchSongs(query, 6);
      if (songs.length) loadSong(songs[0], songs, 0);
    } catch (e) { console.error(e); }
    finally { setStationLoading(null); }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
      {/* ── Top Bento Row: Hero Studio (Col 7/8) + Pulse DJ Direct Chat Feed (Col 5/4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Tile 1: Now Playing Studio Hero */}
        <div className="lg:col-span-7 xl:col-span-7">
          <BentoHeroNowPlaying onQuickPlay={playByQuery} />
        </div>

        {/* Bento Tile 2: Pulse DJ Direct Messenger Feed (Somnath Mahanta DM Style) */}
        <div className="lg:col-span-5 xl:col-span-5">
          <BentoPulseDJChat onQuickPlay={playByQuery} stationLoading={stationLoading} />
        </div>
      </div>

      {/* ── Mid Bento Row: Audiophile Spec Console + Trending Contact Thread Hits ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Tile 3: Audiophile Lab Spec Tile */}
        <div className="lg:col-span-4 neo-card p-4 bg-[#14151e] border-2 border-black shadow-neo flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#86EFAC] text-[18px]">equalizer</span>
                AUDIO ENGINE LAB
              </span>
              <span className="neo-badge bg-[#86EFAC] text-black text-[9px] font-mono border border-black font-bold">
                LIVE
              </span>
            </div>

            {/* Stepped Visualizer graphic */}
            <div className="p-3 bg-black/60 rounded-2xl border-2 border-black flex items-end justify-between h-20 gap-1.5 mb-3">
              {[60, 85, 45, 95, 30, 75, 90, 50, 80, 65, 40, 95, 70, 85].map((h, i) => (
                <div key={i} className="flex-1 bg-zinc-800 rounded-sm overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-[#7DD3FC] via-[#86EFAC] to-[#CCFF00] rounded-sm transition-all duration-300"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <span className="text-zinc-500 block uppercase font-bold text-[9px]">BITRATE</span>
                <span className="text-white font-black text-xs">320 KBPS AAC</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <span className="text-zinc-500 block uppercase font-bold text-[9px]">SPATIAL FX</span>
                <span className="text-[#86EFAC] font-black text-xs">DOLBY ATMOS</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <span className="text-zinc-500 block uppercase font-bold text-[9px]">BUFFERING</span>
                <span className="text-white font-black text-xs">0.08s · INSTANT</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <span className="text-zinc-500 block uppercase font-bold text-[9px]">OUTPUT</span>
                <span className="text-[#7DD3FC] font-black text-xs">STUDIO MASTER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Tile 4: Trending Daily Chart Tracks */}
        <div className="lg:col-span-8 neo-card p-4 bg-[#14151e] border-2 border-black shadow-neo flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#FDA4AF] text-[18px]">trending_up</span>
              TRENDING ON PULSE // TOP CURATION
            </span>
            <span className="neo-badge bg-[#FDA4AF] text-black text-[9px] font-mono border border-black font-bold">
              DAILY CHART
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CURATED_TRACKS.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => playByQuery(t.query, t.id)}
                className="p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-[#1c1f2e] border-2 border-zinc-800 hover:border-black transition-all duration-200 flex items-center gap-3 text-left group hover:shadow-neo-sm hover:-translate-x-0.5"
              >
                <span className="font-mono font-bold text-xs text-[#86EFAC] w-6 text-center">
                  #{String(idx + 1).padStart(2, '0')}
                </span>
                <div className="w-10 h-10 rounded-xl bg-black border border-zinc-700 flex items-center justify-center flex-shrink-0 group-hover:border-[#86EFAC] transition-colors">
                  <span className="material-symbols-outlined text-white/50 group-hover:text-[#86EFAC] text-[20px] transition-colors">
                    play_arrow
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-black uppercase text-white truncate group-hover:text-[#86EFAC] transition-colors">
                    {t.title}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 truncate">{t.artist}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bento Tile 5: Popular Radio Stations Banner ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#86EFAC] text-[22px]">radio</span>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              POPULAR PLAYLIST STATIONS
            </h2>
          </div>
          <span className="neo-badge bg-black text-zinc-400 text-[9px] font-mono border border-zinc-800">
            AUTO-GENERATED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {STATIONS.map(st => (
            <button
              key={`card-${st.id}`}
              onClick={() => playByQuery(st.query, st.id)}
              className="group flex flex-col justify-between h-36 rounded-2xl p-3.5 bg-[#14151e] hover:bg-[#1c1f2e] border-2 border-black shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all duration-200 text-left relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${st.color} opacity-20 rounded-bl-full pointer-events-none group-hover:opacity-35 transition-opacity`} />

              <div>
                <span className="neo-badge bg-black text-zinc-300 text-[8px] border border-zinc-800 font-mono mb-1.5 inline-block">
                  {st.badge}
                </span>
                <p className="text-xs font-black uppercase text-white group-hover:text-[#86EFAC] transition-colors">
                  {st.title}
                </p>
                <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{st.subtitle}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">CLICK TO STREAM</span>
                <div className="w-7 h-7 rounded-lg bg-[#86EFAC] text-black border-2 border-black flex items-center justify-center shadow-neo-sm group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[16px] font-bold" style={{fontVariationSettings:"'FILL' 1"}}>
                    play_arrow
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Neo-Brutalist Tip Banner ── */}
      <div className="neo-card p-4 bg-[#161822] border-2 border-black shadow-neo flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-[#FEF08A] text-black border-2 border-black flex items-center justify-center font-black flex-shrink-0 shadow-sm">
          ★
        </div>
        <p className="text-xs font-mono text-zinc-300 leading-relaxed">
          <span className="text-white font-black uppercase text-xs">PRO TIP:</span> Direct messaging audio channel: Tap any quick vibe in the DJ chat or click any station to launch synced lyrics streaming in 320kbps Lossless.
        </p>
      </div>
    </div>
  );
}

// ── Somnath Mahanta DM Style: Pulse DJ Direct Chat Widget ─────────────

function BentoPulseDJChat({ onQuickPlay, stationLoading }) {
  return (
    <div className="neo-card p-4 bg-[#13141e] border-2 border-black shadow-neo flex flex-col justify-between h-full relative overflow-hidden">
      {/* DM Chat Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-black/80">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#86EFAC] text-black font-black text-xs border-2 border-black flex items-center justify-center shadow-sm">
              🎧
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#86EFAC] border-2 border-black rounded-full" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white uppercase tracking-tight">PULSE AI DJ</span>
              <span className="neo-badge bg-[#86EFAC] text-black text-[8px] py-0 px-1 border-black">LIVE</span>
            </div>
            <span className="text-[9px] font-mono text-[#86EFAC] flex items-center gap-1 leading-tight font-bold">
              ● ACTIVE MIX CURATOR
            </span>
          </div>
        </div>

        <span className="neo-badge bg-black text-[#86EFAC] text-[9px] font-mono border border-black">
          DIRECT FEED
        </span>
      </div>

      {/* DM Message Bubbles Stream */}
      <div className="flex flex-col gap-2.5 my-3 overflow-y-auto max-h-[170px] pr-1">
        {/* Message 1: Incoming from DJ */}
        <div className="flex flex-col items-start gap-1">
          <div className="neo-msg-incoming p-2.5 max-w-[95%] bg-[#1a1c27] text-left">
            <p className="text-xs font-bold text-zinc-200 leading-snug">
              🔥 Dropping today's top Bollywood & Punjabi hits! Perfect for coding or chill vibe.
            </p>
            {/* Embedded interactive music suggestion */}
            <div className="mt-2 p-2 rounded-xl bg-black/60 border border-black flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FDA4AF] to-[#FF6B00] border border-black flex items-center justify-center text-[13px] flex-shrink-0">
                  🎵
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black text-white truncate">Arijit Singh Hits</span>
                  <span className="text-[9px] font-mono text-zinc-400">Bollywood // Hot</span>
                </div>
              </div>
              <button
                onClick={() => onQuickPlay('arijit singh hits', 'st1')}
                disabled={stationLoading === 'st1'}
                className="neo-btn-mint px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider flex items-center gap-1 flex-shrink-0"
              >
                {stationLoading === 'st1' ? (
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
                    <span>STREAM</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 pl-2">10:42 AM · READ</span>
        </div>

        {/* Message 2: DJ status note */}
        <div className="flex flex-col items-start gap-1">
          <div className="neo-msg-incoming p-2.5 max-w-[95%] bg-[#1a1c27] text-left">
            <p className="text-xs font-bold text-zinc-300 leading-snug">
              🎧 Spatial Audio Master is enabled on your device. Zero latency 320kbps AAC streaming active.
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="neo-badge bg-black text-[#86EFAC] text-[8px] py-0 px-1.5 border border-black">
                ❤️ 3.2k
              </span>
              <span className="neo-badge bg-black text-[#7DD3FC] text-[8px] py-0 px-1.5 border border-black">
                ⚡ LOSSLESS
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 pl-2">JUST NOW</span>
        </div>
      </div>

      {/* Quick Interactive Vibe Reply Bar */}
      <div className="pt-2 border-t-2 border-black/80 flex flex-col gap-1.5">
        <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold flex items-center gap-1">
          <span>QUICK VIBE REPLY:</span>
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            onClick={() => onQuickPlay('lofi chill study beats', 'st2')}
            className="neo-btn bg-[#181a24] hover:bg-[#C4B5FD] hover:text-black text-zinc-300 text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-black whitespace-nowrap transition-all"
          >
            🌙 Lofi
          </button>
          <button
            onClick={() => onQuickPlay('punjabi hits latest', 'st3')}
            className="neo-btn bg-[#181a24] hover:bg-[#FEF08A] hover:text-black text-zinc-300 text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-black whitespace-nowrap transition-all"
          >
            🔥 Punjabi
          </button>
          <button
            onClick={() => onQuickPlay('romantic hindi classics', 'st4')}
            className="neo-btn bg-[#181a24] hover:bg-[#FDA4AF] hover:text-black text-zinc-300 text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-black whitespace-nowrap transition-all"
          >
            💖 Romance
          </button>
          <button
            onClick={() => onQuickPlay('top english hits', 'st5')}
            className="neo-btn bg-[#181a24] hover:bg-[#7DD3FC] hover:text-black text-zinc-300 text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-black whitespace-nowrap transition-all"
          >
            🌍 Global
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bento Hero Now-Playing Tile ────────────────────────────────────────

function BentoHeroNowPlaying({ onQuickPlay }) {
  const { currentSong, isPlaying, togglePlay, isLiked, toggleLike } = usePlayer();

  if (!currentSong) {
    return (
      <div className="neo-card p-6 bg-[#13141e] border-2 border-black shadow-neo h-full flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="neo-badge bg-[#86EFAC] text-black text-[10px] font-black">
            ✦ READY TO STREAM
          </span>
          <span className="neo-badge bg-black text-zinc-400 text-[9px] font-mono border border-zinc-800">
            AUDIOPHILE READY
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-900 border-2 border-black shadow-neo-sm flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-zinc-600 text-[48px]">album</span>
          </div>
          <div className="flex flex-col text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
              PULSE AUDIO CONSOLE
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-1 max-w-sm">
              Search for any music above or launch our curated Bollywood & Global stations with zero setup.
            </p>
            <div className="mt-3">
              <button
                onClick={() => onQuickPlay('arijit singh hits', 'hero-starter')}
                className="neo-btn-mint px-4 py-2 rounded-2xl text-xs uppercase font-black tracking-wider flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>
                  play_arrow
                </span>
                LAUNCH FEATURED MIX
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-3 border-t border-zinc-800 mt-3">
          <span>SPATIAL AUDIO ENGINE // 24-BIT</span>
          <span className="text-[#86EFAC] font-bold">SYSTEM READY</span>
        </div>
      </div>
    );
  }

  const liked = isLiked(currentSong.id);

  return (
    <div className="neo-card p-5 bg-[#13141e] border-2 border-black shadow-neo h-full flex flex-col justify-between relative overflow-hidden">
      {/* Top status bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="neo-badge bg-[#86EFAC] text-black text-[9px] font-black">
            NOW PLAYING
          </span>
          <span className="neo-badge bg-black text-[#7DD3FC] text-[9px] font-mono border border-zinc-700">
            320 KBPS · LOSSLESS
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="visualizer-bar w-[3px] bg-[#86EFAC] rounded-sm" />
          <span className="visualizer-bar w-[3px] bg-[#7DD3FC] rounded-sm" />
          <span className="visualizer-bar w-[3px] bg-[#FDA4AF] rounded-sm" />
        </div>
      </div>

      {/* Main track display */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 my-2">
        {/* Artwork frame with hard border and shadow */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-black shadow-neo-sm flex-shrink-0 bg-zinc-900">
          <img src={currentSong.thumbnail} alt="" className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : ''}`} />
          {isPlaying && (
            <div className="absolute top-1.5 left-1.5 neo-badge bg-black/80 text-[#86EFAC] text-[8px] py-0 px-1.5 border border-black font-black">
              LIVE
            </div>
          )}
        </div>

        {/* Info & transport */}
        <div className="flex flex-col min-w-0 flex-1 text-center sm:text-left">
          <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-tight truncate leading-tight">
            {currentSong.title}
          </h2>
          <p className="text-xs font-mono text-zinc-400 truncate mt-1">
            {currentSong.artist}
          </p>
          {currentSong.album && (
            <p className="text-[10px] font-mono text-zinc-500 uppercase truncate mt-0.5">
              ALBUM: {currentSong.album}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
            <button
              onClick={togglePlay}
              className="neo-btn-mint px-4 py-2 rounded-2xl text-xs uppercase font-black tracking-wider flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
              <span>{isPlaying ? 'PAUSE TRACK' : 'RESUME PLAY'}</span>
            </button>

            <button
              onClick={() => toggleLike(currentSong)}
              className={`neo-btn p-2 rounded-2xl border-2 border-black ${
                liked ? 'bg-[#FDA4AF] text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={liked ? 'Unlike' : 'Like'}
            >
              <span className="material-symbols-outlined text-[20px] block" style={{fontVariationSettings:`'FILL' ${liked ? 1 : 0}`}}>
                favorite
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom specs */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-3 border-t border-zinc-800 mt-2">
        <span className="text-[#86EFAC] font-bold">● AUDIO STREAM ACTIVE</span>
        <span className="uppercase font-bold">DOLBY SPATIAL MATRIX</span>
      </div>
    </div>
  );
}

