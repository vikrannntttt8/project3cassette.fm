import { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatTime } from '../../utils/timeFormat.js';
import { useLrcSync } from '../../hooks/useLrcSync.js';
import ArtistLinks from '../shared/ArtistLinks.jsx';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import MarqueeText from '../shared/MarqueeText.jsx';

export default function MobilePlayerSheet({ isOpen, onClose }) {
  const {
    currentSong,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    seek,
    volume,
    changeVolume,
    togglePlay,
    playNext,
    playPrev,
    isLiked,
    toggleLike,
    queue,
    queueIndex,
    loadSong,
    startRadio,
    lrcString,
    lyricsSource,
    lyricsLoading,
    fetchLyricsForSong,
    audioQuality,
    setAudioQuality,
    isShuffled,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    isDownloaded,
    toggleDownload,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'lyrics' | 'queue'
  const [addMenuSong, setAddMenuSong] = useState(null);
  const lyricsContainerRef = useRef(null);
  const touchStartYRef = useRef(0);
  const touchEndYRef = useRef(0);

  const { lines, activeIndex } = useLrcSync(lrcString, currentTime);

  // Trigger lyric fetch when opening lyrics tab if not loaded yet
  useEffect(() => {
    if (isOpen && activeTab === 'lyrics' && !lrcString && !lyricsLoading && currentSong) {
      fetchLyricsForSong(currentSong);
    }
  }, [isOpen, activeTab, lrcString, lyricsLoading, currentSong, fetchLyricsForSong]);

  // Auto-scroll active lyric line to center
  useEffect(() => {
    if (activeTab === 'lyrics' && lyricsContainerRef.current && activeIndex >= 0) {
      const el = lyricsContainerRef.current.children[activeIndex];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeTab, activeIndex]);

  if (!isOpen || !currentSong) return null;

  const liked = isLiked(currentSong.id);
  const downloaded = isDownloaded(currentSong.id);
  const remainingTime = duration > currentTime ? duration - currentTime : 0;

  // Touch gesture handlers for swipe-down to dismiss and swipe-up to open queue/lyrics drawer
  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    touchEndYRef.current = e.changedTouches[0].clientY;
    const deltaY = touchEndYRef.current - touchStartYRef.current;

    // Strong swipe down (delta > 80px) closes the sheet or goes back to player
    if (deltaY > 80) {
      if (activeTab === 'lyrics' || activeTab === 'queue') {
        setActiveTab('player');
      } else {
        onClose();
      }
    }
    // Strong swipe up (delta < -70px) opens lyrics/queue drawer from main player
    else if (deltaY < -70 && activeTab === 'player') {
      setActiveTab('lyrics');
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="md:hidden fixed inset-0 z-[95] bg-[#0c0c0e] flex flex-col text-white animate-sheet-slide-up select-none overflow-hidden"
    >
      {/* ── Ambient Album Backdrop Glow ── */}
      {(currentSong?.cover || currentSong?.thumbnail) && (
        <div
          aria-hidden="true"
          className="absolute -top-[10%] -left-[10%] -right-[10%] h-[55%] bg-cover bg-center pointer-events-none opacity-20 blur-[100px] transform scale-125"
          style={{ backgroundImage: `url(${currentSong.cover || currentSong.thumbnail})` }}
        />
      )}

      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-1.5 pb-2 px-5 flex-shrink-0 pt-safe relative z-10 border-b border-white/5">
        <button
          onClick={onClose}
          className="w-12 h-1.5 rounded-full bg-white/30 hover:bg-white/50 active:bg-white/60 transition-colors my-1 cursor-pointer"
          aria-label="Dismiss player sheet"
        />

        <div className="w-full flex items-center justify-between mt-1.5">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#18181a]/80 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-all cursor-pointer shadow-sm"
            aria-label="Minimize"
          >
            <span className="material-symbols-outlined text-[22px]">keyboard_arrow_down</span>
          </button>

          {/* Segmented View Switcher: Track | Lyrics | Queue */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#18181a]/90 border border-white/10 shadow-inner">
            <button
              onClick={() => setActiveTab('player')}
              className={`px-3.5 py-1 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                activeTab === 'player'
                  ? 'bg-accent text-black shadow-md shadow-accent/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Track
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-3.5 py-1 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-accent text-black shadow-md shadow-accent/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Lyrics
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-accent text-black shadow-md shadow-accent/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Queue ({queue.length})
            </button>
          </div>

          {/* Quality Switcher Badge */}
          <button
            onClick={() => {
              const nextQ =
                audioQuality === 'max'
                  ? 'standard'
                  : audioQuality === 'standard'
                  ? 'datasaver'
                  : 'max';
              setAudioQuality(nextQ);
            }}
            className="px-2.5 py-1 rounded-full bg-[#18181a]/80 border border-white/10 text-[10px] font-mono text-accent font-bold active:scale-95 transition-transform"
            title="Audio stream profile"
          >
            {audioQuality.toUpperCase()}
          </button>
        </div>
      </div>

      {/* ── Center Content Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between px-6 pt-3 pb-[calc(1.5rem+var(--safe-bottom,12px))] min-h-0 overflow-y-auto no-scrollbar relative z-10">
        {/* ── Mode 1: Main Player View ─────────────────────────────── */}
        {activeTab === 'player' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-2 space-y-4">
            {/* Album Artwork with Soft Ambient Elevation */}
            <div
              onClick={() => {
                routeToSongEntity(currentSong);
                onClose();
              }}
              className="relative aspect-square w-full max-h-[320px] mx-auto rounded-[28px] overflow-hidden bg-[#18181a] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/5 my-auto cursor-pointer group"
              title="Open album / track release"
            >
              <img
                src={currentSong.cover || currentSong.thumbnail}
                alt={currentSong.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                  <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Track Title & Artist & Actions */}
            <div className="flex items-center justify-between gap-4 mt-4">
              <div className="min-w-0 flex-1 overflow-hidden">
                <div
                  onClick={() => {
                    routeToSongEntity(currentSong);
                    onClose();
                  }}
                  className="cursor-pointer group/title"
                  title="View track release"
                >
                  <MarqueeText
                    text={currentSong.title}
                    className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight leading-snug group-hover/title:text-accent"
                  />
                </div>
                <div
                  onClick={() => {
                    const artistName =
                      currentSong?.artists?.[0]?.name ||
                      currentSong?.artist ||
                      currentSong?.author?.name ||
                      '';
                    const artistId =
                      currentSong?.artists?.[0]?.id ||
                      currentSong?.artists?.[0]?.browseId ||
                      currentSong?.artistId ||
                      currentSong?.channelId ||
                      currentSong?.author?.id ||
                      null;
                    if (artistName || artistId) {
                      routeToArtistEntity(artistName, artistId);
                      onClose();
                    }
                  }}
                  className="text-[14px] text-neutral-400 font-medium hover:text-accent hover:underline truncate block mt-1 cursor-pointer"
                  title="View artist discography"
                >
                  {currentSong?.artist || 'Unknown Artist'}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Offline Download Button */}
                <button
                  onClick={() => toggleDownload(currentSong)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    downloaded
                      ? 'bg-accent/15 text-accent border border-accent/40 shadow-sm'
                      : 'bg-[#18181a] text-neutral-400 border border-white/10 hover:text-white'
                  }`}
                  title={downloaded ? 'Saved for offline (click to remove)' : 'Download for offline playback'}
                  aria-label={downloaded ? 'Remove offline download' : 'Download track offline'}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: downloaded ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {downloaded ? 'download_done' : 'download'}
                  </span>
                </button>

                {/* Heart / Like button */}
                <button
                  onClick={() => toggleLike(currentSong)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    liked
                      ? 'bg-accent/15 text-accent border border-accent/40 shadow-md shadow-accent/20'
                      : 'bg-[#18181a] text-neutral-400 border border-white/10 hover:text-white'
                  }`}
                  aria-label={liked ? 'Unlike' : 'Like'}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                </button>

                {/* Add to Playlist button */}
                <button
                  onClick={() => setAddMenuSong(currentSong)}
                  className="w-10 h-10 rounded-full bg-[#18181a] border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                  aria-label="Add to playlist"
                >
                  <span className="material-symbols-outlined text-[20px]">playlist_add</span>
                </button>
              </div>
            </div>

            {/* Progress Scrubber */}
            <div className="space-y-1.5 mt-3">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime || 0}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex items-center justify-between text-[11.5px] font-mono text-neutral-400 px-0.5 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(remainingTime)}</span>
              </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center justify-between px-2 mt-2">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-full transition-colors active:scale-95 cursor-pointer ${
                  isShuffled ? 'text-accent' : 'text-neutral-400 hover:text-white'
                }`}
                title="Toggle Shuffle"
              >
                <span className="material-symbols-outlined text-[20px]">shuffle</span>
              </button>

              <button
                onClick={playPrev}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer hover:bg-white/5"
                aria-label="Previous track"
              >
                <span className="material-symbols-outlined text-[30px]">skip_previous</span>
              </button>

              {/* Large YouTube Music Style Accent Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-15 h-15 rounded-full bg-accent text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/25 border border-accent/50 cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span
                    className="material-symbols-outlined text-[34px] font-bold"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                )}
              </button>

              <button
                onClick={playNext}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer hover:bg-white/5"
                aria-label="Next track"
              >
                <span className="material-symbols-outlined text-[30px]">skip_next</span>
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 rounded-full transition-colors active:scale-95 cursor-pointer ${
                  isRepeat ? 'text-accent' : 'text-neutral-400 hover:text-white'
                }`}
                title="Toggle Repeat"
              >
                <span className="material-symbols-outlined text-[20px]">repeat</span>
              </button>
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-3 px-2 mt-2">
              <span className="material-symbols-outlined text-neutral-400 text-[16px]">volume_mute</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-full volume-slider"
              />
              <span className="material-symbols-outlined text-neutral-400 text-[16px]">volume_up</span>
            </div>

            {/* Bottom Swipe Drawer Affordance & Quick Pills */}
            <div className="pt-2 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 w-full justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('lyrics')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#18181a] hover:bg-[#222225] border border-white/10 text-[12px] font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px] text-accent">lyrics</span>
                  <span>Lyrics</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#18181a] hover:bg-[#222225] border border-white/10 text-[12px] font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px] text-accent">queue_music</span>
                  <span>Up Next ({queue.length})</span>
                </button>
              </div>

              <div
                onClick={() => setActiveTab('lyrics')}
                className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer pt-0.5"
              >
                <span className="material-symbols-outlined text-[14px] animate-bounce">keyboard_arrow_up</span>
                <span>Swipe up for Lyrics & Queue</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Mode 2: Live Synced Lyrics Sheet ─────────────────────── */}
        {activeTab === 'lyrics' && (
          <div className="flex-1 flex flex-col overflow-hidden relative py-2">
            {lyricsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] text-neutral-400 font-medium">Fetching synchronized lyrics...</p>
              </div>
            ) : !lines.length ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-500">
                  <span className="material-symbols-outlined text-[26px]">lyrics</span>
                </div>
                <div>
                  <p className="text-body-md font-semibold text-neutral-200">No Synchronized Lyrics Found</p>
                  <p className="text-body-xs text-neutral-500 mt-0.5">{currentSong.title}</p>
                </div>
                <button
                  onClick={() => fetchLyricsForSong(currentSong)}
                  className="mt-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-[12px] font-semibold text-white transition-all cursor-pointer"
                >
                  Retry Search
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top & Bottom gradient fade masks */}
                <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-[#0e0e0e] to-transparent pointer-events-none z-10" />
                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#0e0e0e] to-transparent pointer-events-none z-10" />

                <div
                  ref={lyricsContainerRef}
                  className="overflow-y-auto flex-1 py-10 px-2 space-y-6 text-center no-scrollbar"
                >
                  {lines.map((line, i) => {
                    const isActive = i === activeIndex;
                    const isPast = i < activeIndex;
                    return (
                      <p
                        key={i}
                        onClick={() => seek(line.time)}
                        className={`font-bold tracking-tight cursor-pointer leading-relaxed transition-all duration-300 select-text ${
                          isActive
                            ? 'lyric-active-glow text-accent text-[22px] scale-[1.03] origin-center'
                            : isPast
                            ? 'text-white/30 text-[18px] hover:text-white/60'
                            : 'text-white/40 text-[18px] hover:text-white/70'
                        }`}
                      >
                        {line.text}
                      </p>
                    );
                  })}
                </div>

                <div className="flex-shrink-0 text-center py-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                    {lyricsSource === 'synced' ? '✦ Synced Lyrics (lrclib)' : '✦ Unsynced / Text Lyrics'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Mode 3: Up Next Queue ─────────────────────────────────── */}
        {activeTab === 'queue' && (
          <div className="flex-1 flex flex-col overflow-y-auto space-y-2 no-scrollbar py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-mono uppercase tracking-widest text-accent font-bold">
                  Queue ({queue.length})
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 font-mono">
                  Radio Mix
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startRadio(currentSong)}
                  className="text-[11px] font-semibold text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="Refresh radio queue"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Radio
                </button>
                <button
                  onClick={toggleShuffle}
                  className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                    isShuffled ? 'text-accent' : 'text-neutral-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">shuffle</span>
                  {isShuffled ? 'Shuffled' : 'Shuffle'}
                </button>
              </div>
            </div>

            {queue.map((track, i) => (
              <div
                key={`${track.id || track.videoId}-${i}`}
                onClick={() => loadSong(track, queue, i)}
                className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
                  i === queueIndex
                    ? 'bg-accent/15 border border-accent/30 text-accent font-semibold'
                    : 'bg-[#18181a]/55 hover:bg-[#18181a] text-white'
                }`}
              >
                <img
                  src={track.thumbnail || track.cover}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover bg-neutral-800"
                />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p
                    className="text-[13px] font-semibold truncate whitespace-nowrap overflow-hidden text-ellipsis"
                    title={track.title}
                  >
                    {track.title}
                  </p>
                  <p
                    className="text-[11px] text-neutral-400 truncate whitespace-nowrap overflow-hidden text-ellipsis"
                    title={track.artist}
                  >
                    {track.artist}
                  </p>
                </div>
                {i === queueIndex && (
                  <span className="material-symbols-outlined text-accent text-[18px]">
                    graphic_eq
                  </span>
                )}
              </div>
            ))}
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
