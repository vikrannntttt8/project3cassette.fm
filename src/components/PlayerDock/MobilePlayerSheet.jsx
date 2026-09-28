import { useState, useRef, useEffect, useMemo } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatTime, formatDuration } from '../../utils/timeFormat.js';
import { useLrcSync } from '../../hooks/useLrcSync.js';
import { getHighResImage } from '../../utils/imageUtils.js';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import TrackContextMenu from '../shared/TrackContextMenu.jsx';
import MarqueeText from '../shared/MarqueeText.jsx';

/**
 * MobilePlayerSheet — Archive Tune Inspired Now Playing Screen & Queue Drawer
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
    audioQuality,
    setAudioQuality,
    isShuffled,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    isDownloaded,
    toggleDownload,
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

  // Trigger lyric fetch when opening lyrics sheet if not loaded yet
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
  const downloaded = isDownloaded(currentSong.id || currentSong.videoId);
  const remainingTime = duration > currentTime ? duration - currentTime : 0;
  const highResCover = getHighResImage(currentSong.cover || currentSong.thumbnail);

  // Playing from context label
  const playingFromContext =
    currentSong.album
      ? `Album • ${currentSong.album}`
      : currentSong.artist
      ? `${currentSong.artist} Radio`
      : 'Cassette Flow';

  // Touch gesture handlers
  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;

    // Ignore mostly horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) return;

    // Swipe down
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
      {/* ── Ambient Album Backdrop Glow ── */}
      {highResCover && (
        <div
          aria-hidden="true"
          className="absolute -top-[15%] -left-[15%] -right-[15%] h-[65%] bg-cover bg-center pointer-events-none opacity-25 blur-[120px] transform scale-125 transition-all duration-1000"
          style={{ backgroundImage: `url(${highResCover})` }}
        />
      )}
      <div className="absolute inset-0 bg-[#0c0c0e]/80 pointer-events-none z-0" />

      {/* ── TOP BAR: Playing from Context + Dismiss Button ──────────── */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 flex-shrink-0 pt-safe relative z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer shadow-sm"
          aria-label="Dismiss player sheet"
          title="Dismiss"
        >
          <span className="material-symbols-outlined text-[24px]">keyboard_arrow_down</span>
        </button>

        {/* Subtle Top Context Line */}
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
          className="flex flex-col items-center max-w-[200px] text-center cursor-pointer group/context"
          title="View source"
        >
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 group-hover/context:text-neutral-300">
            Playing From
          </span>
          <span className="text-[13px] font-bold text-white tracking-tight truncate max-w-full group-hover/context:underline">
            {playingFromContext}
          </span>
        </div>

        {/* Quality / More Menu */}
        <div className="flex items-center gap-1">
          <TrackContextMenu track={currentSong} onAddToPlaylist={setAddMenuSong} />
        </div>
      </div>

      {/* ── CENTER CONTENT AREA (MAIN NOW PLAYING SCREEN) ───────────── */}
      {activeSheet === 'player' && (
        <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-[calc(1rem+var(--safe-bottom,12px))] min-h-0 overflow-y-auto no-scrollbar relative z-10 max-w-md mx-auto w-full">
          {/* ── 1. High-Res Artwork Card ── */}
          <div className="my-auto pt-2 pb-4 flex flex-col items-center justify-center">
            <div
              onClick={() => {
                routeToSongEntity(currentSong);
                onClose();
              }}
              className="relative aspect-square w-full max-w-[320px] sm:max-w-[350px] mx-auto rounded-[32px] overflow-hidden bg-neutral-900 border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 cursor-pointer group transition-transform duration-300 active:scale-[0.98]"
              title="Click to view album release"
            >
              <img
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

          {/* ── 2. Track Title & Artist (Left) paired with Heart & Menu (Right) ── */}
          <div className="flex items-center justify-between gap-4 mt-2">
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
                  className="text-[22px] sm:text-[24px] font-extrabold text-white tracking-tight leading-snug group-hover/title:underline"
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
                className="text-[15px] text-neutral-400 font-medium hover:text-white hover:underline truncate block mt-0.5 cursor-pointer"
                title="View artist profile"
              >
                {currentSong?.artist || 'Unknown Artist'}
              </div>
            </div>

            {/* Right Action Icons: Heart & More */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => toggleLike(currentSong)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                  liked
                    ? 'text-white bg-white/10 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
                aria-label={liked ? 'Unlike' : 'Like'}
                title={liked ? 'Unlike' : 'Like'}
              >
                <span
                  className="material-symbols-outlined text-[26px]"
                  style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}
                >
                  favorite
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAddMenuSong(currentSong)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                title="Add to playlist"
                aria-label="Add to playlist"
              >
                <span className="material-symbols-outlined text-[24px]">playlist_add</span>
              </button>
            </div>
          </div>

          {/* ── 3. Modernized Seek Bar with Elapsed/Remaining Timestamps ── */}
          <div className="space-y-1.5 mt-4">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime || 0}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11.5px] font-mono text-neutral-400 px-0.5 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(remainingTime)}</span>
            </div>
          </div>

          {/* ── 4. Playback Controls Row (Shuffle, Prev, Play/Pause, Next, Repeat) ── */}
          <div className="flex items-center justify-between px-2 mt-2">
            <button
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
              onClick={playPrev}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer hover:bg-white/5"
              aria-label="Previous track"
              title="Previous"
            >
              <span className="material-symbols-outlined text-[34px]">skip_previous</span>
            </button>

            {/* Oversized Filled Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_8px_25px_rgba(255,255,255,0.3)] cursor-pointer"
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
              onClick={playNext}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer hover:bg-white/5"
              aria-label="Next track"
              title="Next"
            >
              <span className="material-symbols-outlined text-[34px]">skip_next</span>
            </button>

            <button
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

          {/* ── 5. Clean 3-Element Bottom Utility Strip ── */}
          <div className="pt-5 flex items-center justify-between px-2 border-t border-white/5 mt-2">
            {/* Left: Lyrics Icon */}
            <button
              type="button"
              onClick={() => setActiveSheet('lyrics')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
              title="View synced lyrics"
              aria-label="Open lyrics"
            >
              <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
            </button>

            {/* Center: Device Output Pill ("Speaker") */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDevicePillOpen((p) => !p)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181a] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-[12px] font-medium transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-white">speaker</span>
                <span>This Device</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              {devicePillOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-2xl bg-[#1c1c1f] border border-white/10 shadow-2xl text-center min-w-[200px] z-50 animate-fade-in">
                  <p className="text-[12px] font-bold text-white">Playback Output</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">High-Fidelity Stereo (Lossless / 256kbps)</p>
                </div>
              )}
            </div>

            {/* Right: Queue Sheet Toggle Icon */}
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

      {/* ── DRAWER 1: SWIPE-UP QUEUE DRAWER & ACTIVE SONG CARD ──────── */}
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

              {/* Action Buttons: Clear Queue, Shuffle, Autoplay Loop */}
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
                  <img
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
                    const isUpcoming = i > queueIndex;
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

      {/* ── DRAWER 2: LIVE SYNCED LYRICS SHEET ──────────────────────── */}
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
              <p className="text-[11px] font-mono text-neutral-400">{currentSong.title}</p>
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
