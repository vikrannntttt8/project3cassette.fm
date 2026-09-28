import { useState, useRef, useEffect, useMemo } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatTime, formatDuration } from '../../utils/timeFormat.js';
import { useLrcSync } from '../../hooks/useLrcSync.js';
import { getHighResImage } from '../../utils/imageUtils.js';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import TrackContextMenu from '../shared/TrackContextMenu.jsx';
import MarqueeText from '../shared/MarqueeText.jsx';

/**
 * MobilePlayerSheet — ArchiveTune Now Playing Interface Layout & Visual Hierarchy
 */
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
    clearQueue,
    removeFromQueue,
    autoplay,
    toggleAutoplay,
    lrcString,
    lyricsSource,
    lyricsLoading,
    fetchLyricsForSong,
    isShuffled,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    routeToSongEntity,
    routeToArtistEntity,
  } = usePlayer();

  const [activeSheet, setActiveSheet] = useState('player'); // 'player' | 'lyrics' | 'queue'
  const [addMenuSong, setAddMenuSong] = useState(null);
  const [devicePillOpen, setDevicePillOpen] = useState(false);
  const lyricsContainerRef = useRef(null);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);

  const { lines, activeIndex } = useLrcSync(lrcString, currentTime);

  // Fetch lyrics when opening lyrics sheet if not already loaded
  useEffect(() => {
    if (isOpen && activeSheet === 'lyrics' && !lrcString && !lyricsLoading && currentSong) {
      fetchLyricsForSong(currentSong);
    }
  }, [isOpen, activeSheet, lrcString, lyricsLoading, currentSong, fetchLyricsForSong]);

  // Auto-scroll active lyric line to center
  useEffect(() => {
    if (activeSheet === 'lyrics' && lyricsContainerRef.current && activeIndex >= 0) {
      const el = lyricsContainerRef.current.children[activeIndex];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSheet, activeIndex]);

  // Total Queue Duration calculation
  const totalQueueMinutes = useMemo(() => {
    if (!queue || !queue.length) return 0;
    const totalSecs = queue.reduce((acc, track) => acc + (track.duration || 180), 0);
    return Math.round(totalSecs / 60);
  }, [queue]);

  if (!isOpen || !currentSong) return null;

  const liked = isLiked(currentSong.id || currentSong.videoId);
  const remainingTime = duration > currentTime ? duration - currentTime : 0;
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volPct = Math.round(volume * 100);
  const highResCover = getHighResImage(currentSong.cover || currentSong.thumbnail);

  // Top context label
  const playingFromContext =
    currentSong.album
      ? `Album • ${currentSong.album}`
      : currentSong.artist
      ? `${currentSong.artist} Radio`
      : 'cassette.fm Flow';

  // Swipe & Touch gesture handlers
  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;

    // Ignore mostly horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) return;

    // Swipe down to collapse drawer or sheet
    if (deltaY > 70) {
      if (activeSheet === 'queue' || activeSheet === 'lyrics') {
        setActiveSheet('player');
      } else {
        onClose();
      }
    }
    // Swipe up from main player opens Queue drawer
    else if (deltaY < -60 && activeSheet === 'player') {
      setActiveSheet('queue');
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="md:hidden fixed inset-0 z-[95] bg-[#0c0c0e] flex flex-col text-white animate-sheet-slide-up select-none overflow-hidden"
    >
      {/* ── 1. SUBTLE AMBIENT DYNAMIC THEME (BACKGROUND GLOW ONLY) ──── */}
      {highResCover && (
        <div
          aria-hidden="true"
          className="absolute -top-[10%] -left-[10%] -right-[10%] h-[60%] bg-cover bg-center pointer-events-none opacity-20 blur-[130px] transform scale-125 transition-all duration-1000"
          style={{ backgroundImage: `url(${highResCover})` }}
        />
      )}
      <div className="absolute inset-0 bg-[#0c0c0e]/85 pointer-events-none z-0" />

      {/* ── TOP CONTEXT BAR ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 flex-shrink-0 pt-safe relative z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer shadow-sm"
          aria-label="Dismiss player sheet"
          title="Dismiss"
        >
          <span className="material-symbols-outlined text-[24px]">keyboard_arrow_down</span>
        </button>

        {/* Subtle Top Context Line: Playing from [Playlist / Artist Mix] */}
        <div
          onClick={() => {
            if (currentSong.album) {
              routeToSongEntity(currentSong);
              onClose();
            } else if (currentSong.artist) {
              routeToArtistEntity(currentSong.artist, currentSong.artistId);
              onClose();
            }
          }}
          className="flex flex-col items-center max-w-[210px] text-center cursor-pointer group/context"
          title="View source"
        >
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 group-hover/context:text-neutral-300">
            Playing From
          </span>
          <span className="text-[13px] font-bold text-white tracking-tight truncate max-w-full group-hover/context:underline">
            {playingFromContext}
          </span>
        </div>

        {/* More Context Menu */}
        <TrackContextMenu track={currentSong} onAddToPlaylist={setAddMenuSong}>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer shadow-sm"
            title="Options"
            aria-label="Options"
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </TrackContextMenu>
      </div>

      {/* ── CENTER CONTENT AREA (NOW PLAYING SCREEN) ────────────────── */}
      {activeSheet === 'player' && (
        <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-[calc(1.25rem+var(--safe-bottom,12px))] min-h-0 overflow-y-auto no-scrollbar relative z-10 max-w-md mx-auto w-full">
          
          {/* ── High-Res Cover Artwork Card ── */}
          <div className="my-auto pt-2 pb-3 flex flex-col items-center justify-center">
            <div
              onClick={() => {
                routeToSongEntity(currentSong);
                onClose();
              }}
              className="relative aspect-square w-full max-w-[310px] sm:max-w-[340px] mx-auto rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10 cursor-pointer group transition-transform duration-300 active:scale-[0.98]"
              title="Click to view album release"
            >
              <ImageWithFallback
                src={highResCover}
                alt={currentSong.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                  <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* ── 2. TYPOGRAPHY & TRACK METADATA ROW ── */}
          <div className="flex items-start justify-between gap-4 mt-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                onClick={() => {
                  routeToSongEntity(currentSong);
                  onClose();
                }}
                className="cursor-pointer group/title"
                title="View track release"
              >
                <h2 className="text-2xl font-bold tracking-tight text-white truncate leading-tight group-hover/title:underline">
                  {currentSong.title}
                </h2>
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
                className="text-sm font-medium text-neutral-400 hover:text-white hover:underline truncate block mt-1 cursor-pointer"
                title="View artist profile"
              >
                {currentSong?.artist || 'Unknown Artist'}
              </div>
            </div>

            {/* Action Icons: Outline Heart & More Options on the right */}
            <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
              <button
                type="button"
                onClick={() => toggleLike(currentSong)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                  liked
                    ? 'text-white bg-white/10'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
                aria-label={liked ? 'Unlike' : 'Like'}
                title={liked ? 'Unlike' : 'Like'}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}
                >
                  favorite
                </span>
              </button>

              <TrackContextMenu track={currentSong} onAddToPlaylist={setAddMenuSong} icon="more_horiz">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                  title="More options"
                  aria-label="More options"
                >
                  <span className="material-symbols-outlined text-[24px]">more_horiz</span>
                </button>
              </TrackContextMenu>
            </div>
          </div>

          {/* ── 3. PURE WHITE SCRUBBER & TIMELINE ── */}
          <div className="space-y-2 mt-5">
            {/* Timeline Track: Thin rounded progress bar with solid white fill */}
            <div className="relative w-full h-1.5 rounded-full bg-white/20 flex items-center group cursor-pointer">
              <div
                className="h-full bg-white rounded-full transition-all duration-75"
                style={{ width: `${progressPct}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-sm pointer-events-none transition-transform"
                style={{ left: `calc(${Math.min(Math.max(progressPct, 0), 100)}% - 6px)` }}
              />
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.25"
                value={currentTime || 0}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Seek track"
              />
            </div>

            {/* Timestamps: Elapsed left, Remaining right */}
            <div className="flex items-center justify-between text-xs text-neutral-400 font-normal font-mono tabular-nums px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(remainingTime)}</span>
            </div>
          </div>

          {/* ── 4. CLEAN PLAYBACK CONTROLS & VOLUME ── */}
          <div className="space-y-4 mt-1">
            {/* Main Playback Row: Shuffle, Prev, Solid White Play/Pause, Next, Repeat */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={toggleShuffle}
                className={`p-2.5 rounded-full transition-colors active:scale-90 cursor-pointer ${
                  isShuffled ? 'text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="Toggle Shuffle"
                aria-label="Toggle Shuffle"
              >
                <span className="material-symbols-outlined text-[22px]">shuffle</span>
              </button>

              <button
                type="button"
                onClick={playPrev}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer hover:bg-white/5"
                aria-label="Previous track"
                title="Previous"
              >
                <span className="material-symbols-outlined text-[34px]">skip_previous</span>
              </button>

              {/* Large Solid White Play/Pause Toggle */}
              <button
                type="button"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgba(255,255,255,0.25)] cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span
                    className="material-symbols-outlined text-[36px] font-bold"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={playNext}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer hover:bg-white/5"
                aria-label="Next track"
                title="Next"
              >
                <span className="material-symbols-outlined text-[34px]">skip_next</span>
              </button>

              <button
                type="button"
                onClick={toggleRepeat}
                className={`p-2.5 rounded-full transition-colors active:scale-90 cursor-pointer ${
                  isRepeat ? 'text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="Toggle Repeat"
                aria-label="Toggle Repeat"
              >
                <span className="material-symbols-outlined text-[22px]">repeat</span>
              </button>
            </div>

            {/* Volume Bar: Thin white-and-translucent slider flanked by mute and max-volume speaker icons */}
            <div className="flex items-center gap-3 px-2 pt-1">
              <button
                type="button"
                onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                aria-label="Mute"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {volume === 0 ? 'volume_off' : 'volume_mute'}
                </span>
              </button>

              <div className="relative flex-1 h-1 rounded-full bg-white/20 flex items-center group cursor-pointer">
                <div
                  className="h-full bg-white rounded-full transition-all duration-75"
                  style={{ width: `${volPct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm pointer-events-none"
                  style={{ left: `calc(${Math.min(Math.max(volPct, 0), 100)}% - 5px)` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Volume"
                />
              </div>

              <button
                type="button"
                onClick={() => changeVolume(1)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                aria-label="Max volume"
              >
                <span className="material-symbols-outlined text-[18px]">volume_up</span>
              </button>
            </div>
          </div>

          {/* ── 5. MINIMALIST BOTTOM UTILITY DOCK ── */}
          <div className="pt-5 flex items-center justify-between px-2 border-t border-white/5 mt-3">
            {/* Left: Minimalist speech bubble icon for Lyrics */}
            <button
              type="button"
              onClick={() => setActiveSheet('lyrics')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
              title="View synced lyrics"
              aria-label="Open lyrics"
            >
              <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
            </button>

            {/* Center: Subtle rounded translucent pill displaying active audio output */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDevicePillOpen((p) => !p)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181a] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-[12px] font-medium transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-white">speaker</span>
                <span>Speaker</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              {devicePillOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-2xl bg-[#1c1c1f] border border-white/10 shadow-2xl text-center min-w-[200px] z-50 animate-fade-in">
                  <p className="text-[12px] font-bold text-white">Playback Output</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">High-Fidelity Stereo (Lossless / 256kbps)</p>
                </div>
              )}
            </div>

            {/* Right: Clean hamburger list icon for Queue */}
            <button
              type="button"
              onClick={() => setActiveSheet('queue')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer relative"
              title="Open Queue Drawer"
              aria-label="Open queue drawer"
            >
              <span className="material-symbols-outlined text-[22px]">format_list_bulleted</span>
              {queue.length > 0 && (
                <span className="absolute top-1.5 right-1.5 px-1 min-w-[14px] h-[14px] rounded-full bg-white text-black text-[9px] font-bold font-mono flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── SWIPE-UP QUEUE DRAWER & ACTIVE SONG CARD ────────────────── */}
      {activeSheet === 'queue' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0e] animate-sheet-slide-up relative z-20">
          {/* Drawer Header with Drag Handle */}
          <div className="pt-2 pb-3 px-5 border-b border-white/5 flex-shrink-0 flex flex-col items-center">
            <button
              onClick={() => setActiveSheet('player')}
              className="w-12 h-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors my-1 cursor-pointer"
              title="Swipe down to collapse"
            />

            <div className="w-full flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSheet('player')}
                  className="p-1 rounded-full text-neutral-400 hover:text-white mr-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </button>
                <div>
                  <h3 className="text-[16px] font-bold text-white leading-tight">Playing Queue</h3>
                  <p className="text-[11.5px] font-mono text-neutral-400">
                    {queue.length} songs • ~{totalQueueMinutes} min
                  </p>
                </div>
              </div>

              {/* Action Buttons: Autoplay Loop, Shuffle, Clear Queue */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleAutoplay}
                  className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
                    autoplay ? 'text-white bg-white/10' : 'text-neutral-500 hover:text-white'
                  }`}
                  title={autoplay ? 'Autoplay Loop: Enabled' : 'Autoplay Loop: Disabled'}
                >
                  <span className="material-symbols-outlined text-[18px]">all_inclusive</span>
                  <span className="hidden xs:inline">Autoplay</span>
                </button>

                <button
                  onClick={toggleShuffle}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isShuffled ? 'text-white bg-white/10' : 'text-neutral-500 hover:text-white'
                  }`}
                  title="Shuffle Queue"
                >
                  <span className="material-symbols-outlined text-[18px]">shuffle</span>
                </button>

                <button
                  onClick={clearQueue}
                  className="p-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Clear upcoming queue"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Content Body: Active Song Card + Upcoming List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
            {/* ── "CONTINUE PLAYING" ACTIVE SONG CARD ── */}
            <div>
              <span className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-400 font-bold px-1 block mb-2">
                Now Playing
              </span>
              <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-white/15 shadow-xl flex items-center gap-3.5">
                {/* Thumbnail with Live Visualizer Equalizer */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800 border border-white/10">
                  <ImageWithFallback
                    src={currentSong.thumbnail || currentSong.cover}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-[2px]">
                      <span className="w-[3px] h-3.5 bg-white rounded-full animate-pulse" />
                      <span className="w-[3px] h-5 bg-white rounded-full animate-bounce" />
                      <span className="w-[3px] h-2.5 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-[14px] font-bold text-white truncate leading-tight">
                    {currentSong.title}
                  </p>
                  <p className="text-[12px] text-neutral-400 truncate mt-0.5">
                    {currentSong.artist || 'Unknown Artist'}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── UPCOMING QUEUE LIST ── */}
            <div className="space-y-2 pt-2">
              <span className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-400 font-bold px-1 block">
                Up Next ({queue.length - 1 > 0 ? queue.length - 1 : 0})
              </span>

              {queue.length <= 1 ? (
                <div className="p-8 rounded-2xl bg-neutral-900/40 border border-white/5 text-center space-y-2">
                  <p className="text-[13px] text-neutral-400 font-medium">No upcoming tracks in queue</p>
                  <button
                    onClick={() => startRadio(currentSong)}
                    className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-[12px] font-semibold text-white transition-all cursor-pointer"
                  >
                    Start Infinite Radio
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5 rounded-2xl bg-neutral-900/40 border border-white/5 overflow-hidden">
                  {queue.map((track, i) => {
                    if (i === queueIndex) return null; // Skip active track shown above
                    return (
                      <div
                        key={`${track.id || track.videoId || i}-${i}`}
                        onClick={() => loadSong(track, queue, i)}
                        className="group flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-4 text-center text-[11px] font-mono text-neutral-500">
                            {i + 1}
                          </span>
                          <ImageWithFallback
                            src={track.thumbnail || track.cover}
                            alt=""
                            icon="music_note"
                            iconClassName="text-white/30 text-[18px]"
                            className="w-10 h-10 rounded-xl object-cover bg-neutral-800 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="text-[13px] font-semibold text-white truncate leading-tight group-hover:underline">
                              {track.title}
                            </p>
                            <p className="text-[11.5px] text-neutral-400 truncate mt-0.5">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {track.duration > 0 && (
                            <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                              {formatDuration(track.duration)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(i);
                            }}
                            className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 transition-colors"
                            title="Remove from queue"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE SYNCED LYRICS SHEET ────────────────────────────────── */}
      {activeSheet === 'lyrics' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0e] animate-sheet-slide-up relative z-20">
          {/* Lyrics Header */}
          <div className="pt-2 pb-3 px-5 border-b border-white/5 flex-shrink-0 flex items-center justify-between">
            <button
              onClick={() => setActiveSheet('player')}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="text-center">
              <h3 className="text-[14px] font-bold text-white">Live Synced Lyrics</h3>
              <p className="text-[11px] font-mono text-neutral-400 truncate max-w-[200px]">{currentSong.title}</p>
            </div>
            <button
              onClick={() => fetchLyricsForSong(currentSong)}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              title="Refresh lyrics"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>

          {/* Lyrics Scrollable Body */}
          <div className="flex-1 flex flex-col overflow-hidden relative p-4">
            {lyricsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] text-neutral-400 font-medium">Synchronizing lyrics...</p>
              </div>
            ) : !lines.length ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="material-symbols-outlined text-[36px] text-neutral-600">lyrics</span>
                <p className="text-body-md font-semibold text-neutral-300">No Synced Lyrics Found</p>
                <p className="text-body-xs text-neutral-500">{currentSong.title}</p>
                <button
                  onClick={() => fetchLyricsForSong(currentSong)}
                  className="mt-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-[12px] font-semibold text-white transition-all cursor-pointer"
                >
                  Retry Search
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-[#0c0c0e] to-transparent pointer-events-none z-10" />
                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#0c0c0e] to-transparent pointer-events-none z-10" />

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
                            ? 'text-white text-[24px] scale-[1.04] origin-center drop-shadow-md'
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
        </div>
      )}

      {/* Add To Playlist Modal */}
      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </div>
  );
}
