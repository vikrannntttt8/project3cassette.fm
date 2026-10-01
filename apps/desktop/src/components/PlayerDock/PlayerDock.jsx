import { useState, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import SeekBar from './SeekBar.jsx';
import VolumeSlider from './VolumeSlider.jsx';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';
import MobilePlayerSheet from './MobilePlayerSheet.jsx';
import MarqueeText from '../shared/MarqueeText.jsx';

export default function PlayerDock() {
  const {
    currentSong,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    seek,
    volume,
    changeVolume,
    view,
    toggleView,
    togglePlay,
    playNext,
    playPrev,
    isLiked,
    toggleLike,
    isSettingsOpen,
    audioQuality,
    setAudioQuality,
    activeStreamMeta,
    isShuffled,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    isDownloaded,
    toggleDownload,
    openPlayerSheet,
    closePlayerSheet,
    isPlayerSheetOpen,
  } = usePlayer();

  const [addMenuSong, setAddMenuSong] = useState(null);
  const touchStartY = useRef(0);

  // Settings guard (already handled by App.jsx but keep as safety)
  if (isSettingsOpen) return null;

  const liked = currentSong ? isLiked(currentSong.id) : false;
  const downloaded = currentSong ? isDownloaded(currentSong.id) : false;

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -30 && window.innerWidth < 768) {
      openPlayerSheet('player');
    }
  };

  const handleMobileDockClick = () => {
    if (!currentSong) return;
    if (window.innerWidth < 768) {
      openPlayerSheet('player');
    }
  };

  return (
    <>
      {/* ── DESKTOP PLAYER BAR (md+) — Full-width Spotify-style bottom dock ── */}
      <div
        className="hidden md:flex fixed bottom-0 left-0 w-full z-50 items-center justify-between px-6 lg:px-8 select-none"
        style={{
          height: '88px',
          background: 'rgba(10, 10, 11, 0.96)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* ── LEFT: Track Info ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 flex-shrink-0 w-[280px] xl:w-[320px] min-w-0">
          {/* Album Art */}
          <div
            className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5 ${isPlaying ? 'ring-1 ring-white/30' : ''}`}
          >
            {currentSong?.thumbnail ? (
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title || 'Track'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-neutral-600 text-[24px]">album</span>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Track Title + Artist */}
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            {currentSong?.title ? (
              <MarqueeText
                text={currentSong.title}
                className="text-sm font-semibold text-white leading-tight tracking-tight"
              />
            ) : (
              <span className="text-sm font-semibold text-white truncate">Nothing playing</span>
            )}
            {currentSong ? (
              <ArtistLinks
                artists={currentSong.artists}
                artist={currentSong.artist}
                artistId={currentSong.artistId}
                className="text-xs font-medium text-neutral-400 truncate mt-0.5 block hover:text-neutral-200 transition-colors"
              />
            ) : (
              <span className="text-xs text-neutral-500 truncate mt-0.5">Search for a song to play</span>
            )}
          </div>

          {/* Like + Save actions */}
          {currentSong && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => toggleLike(currentSong)}
                className={`p-1.5 rounded-full transition-all active:scale-90 cursor-pointer ${liked ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
                title={liked ? 'Unlike' : 'Like'}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}
                >
                  favorite
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAddMenuSong(currentSong)}
                className="p-1.5 rounded-full text-neutral-500 hover:text-white transition-colors cursor-pointer"
                title="Add to playlist"
              >
                <span className="material-symbols-outlined text-[20px]">playlist_add</span>
              </button>
            </div>
          )}
        </div>

        {/* ── CENTER: Transport Controls + Seekbar ───────────────────────── */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl mx-4 xl:mx-8 min-w-0">
          {/* Transport buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`p-1 transition-colors cursor-pointer ${isShuffled ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
              title="Shuffle"
            >
              <span className="material-symbols-outlined text-[18px]">shuffle</span>
            </button>

            <button
              type="button"
              onClick={playPrev}
              className="text-neutral-400 hover:text-white transition-colors disabled:opacity-30 p-1 cursor-pointer"
              disabled={!currentSong}
              aria-label="Previous track"
            >
              <span className="material-symbols-outlined text-[26px]">skip_previous</span>
            </button>

            {/* Play / Pause — primary CTA */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={!currentSong}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-40 cursor-pointer shadow-lg"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span
                  className="material-symbols-outlined text-[22px] text-black"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={playNext}
              className="text-neutral-400 hover:text-white transition-colors disabled:opacity-30 p-1 cursor-pointer"
              disabled={!currentSong}
              aria-label="Next track"
            >
              <span className="material-symbols-outlined text-[26px]">skip_next</span>
            </button>

            <button
              type="button"
              onClick={toggleRepeat}
              className={`p-1 transition-colors cursor-pointer ${isRepeat ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
              title="Repeat"
            >
              <span className="material-symbols-outlined text-[18px]">repeat</span>
            </button>
          </div>

          {/* Seekbar */}
          <div className="w-full">
            <SeekBar currentTime={currentTime} duration={duration} onSeek={seek} />
          </div>
        </div>

        {/* ── RIGHT: Volume + Quality + Lyrics ──────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0 w-[280px] xl:w-[320px] justify-end">
          {/* Lyrics toggle */}
          <button
            type="button"
            onClick={toggleView}
            className="p-1.5 rounded-full text-neutral-500 hover:text-white transition-colors cursor-pointer"
            title="Open lyrics view"
          >
            <span className="material-symbols-outlined text-[20px]">lyrics</span>
          </button>

          {/* Download button */}
          {currentSong && (
            <button
              type="button"
              onClick={() => toggleDownload(currentSong)}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${downloaded ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
              title={downloaded ? 'Saved offline' : 'Download offline'}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: downloaded ? "'FILL' 1" : "'FILL' 0" }}
              >
                {downloaded ? 'download_done' : 'download'}
              </span>
            </button>
          )}

          {/* Quality Badge */}
          {currentSong && (
            <button
              type="button"
              onClick={() => {
                const nextQ = audioQuality === 'max' ? 'standard' : audioQuality === 'standard' ? 'datasaver' : 'max';
                setAudioQuality(nextQ);
              }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-neutral-400 hover:text-white transition-all cursor-pointer select-none"
              title="Click to cycle audio quality"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="font-bold uppercase tracking-wider text-[9px] text-white">{audioQuality}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-300">
                {activeStreamMeta?.bitrate
                  ? `${Math.round(activeStreamMeta.bitrate / 1000)}k`
                  : audioQuality === 'max' ? '256k' : audioQuality === 'standard' ? '160k' : '128k'}
              </span>
            </button>
          )}

          {/* Volume Slider */}
          <VolumeSlider volume={volume} onChange={changeVolume} />
        </div>
      </div>

      {/* ── MOBILE MINI PLAYER (< md) — Hidden when in lyrics view ── */}
      {view !== 'lyrics' && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleMobileDockClick}
          className="md:hidden player-dock-wrap fixed z-50 pointer-events-auto select-none"
        >
        <div className="player-dock-inner cursor-pointer flex items-center justify-between gap-2.5 mx-3">
          {/* Left: thumb + info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
            <div className={`relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5 ${isPlaying ? 'ring-1 ring-white/20' : ''}`}>
              {currentSong?.thumbnail ? (
                <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-neutral-600 text-[18px]">album</span>
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              {currentSong?.title ? (
                <MarqueeText text={currentSong.title} className="text-[13px] font-semibold text-white leading-tight" />
              ) : (
                <span className="text-[13px] font-semibold text-white truncate">Nothing playing</span>
              )}
              {currentSong ? (
                <ArtistLinks
                  artists={currentSong.artists}
                  artist={currentSong.artist}
                  artistId={currentSong.artistId}
                  className="text-[11px] font-medium text-neutral-400 truncate block"
                />
              ) : (
                <span className="text-[11px] text-neutral-500 truncate">Search for a song</span>
              )}
            </div>
          </div>

          {/* Right: prev / play / next */}
          <div
            className="flex items-center gap-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={playPrev}
              className="text-neutral-400 hover:text-white transition-colors disabled:opacity-30 p-1.5 cursor-pointer"
              disabled={!currentSong}
            >
              <span className="material-symbols-outlined text-[22px]">skip_previous</span>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              disabled={!currentSong}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span
                  className="material-symbols-outlined text-[20px] text-black"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={playNext}
              className="text-neutral-400 hover:text-white transition-colors disabled:opacity-30 p-1.5 cursor-pointer"
              disabled={!currentSong}
            >
              <span className="material-symbols-outlined text-[22px]">skip_next</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Full-Height iOS / YT Music Slide-Up Sheet */}
      <MobilePlayerSheet
        isOpen={isPlayerSheetOpen}
        onClose={closePlayerSheet}
      />

      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </>
  );
}
