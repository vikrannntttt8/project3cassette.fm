import { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import SeekBar from './SeekBar.jsx';
import VolumeSlider from './VolumeSlider.jsx';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';

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
  } = usePlayer();

  const [addMenuSong, setAddMenuSong] = useState(null);

  // Auto-unmount/hide mini-player dock when full-screen expanded views open (lyrics or settings)
  if (view === 'lyrics' || isSettingsOpen) {
    return null;
  }

  const liked = currentSong ? isLiked(currentSong.id) : false;

  return (
    <>
      <div className="player-dock-wrap fixed z-50 pointer-events-auto transition-all duration-300 left-3 right-3 bottom-3 md:left-[16rem] md:right-4 md:bottom-4 select-none">
        <div
          onClick={() => currentSong && toggleView()}
          className="player-dock-inner cursor-pointer rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6 max-w-5xl mx-auto shadow-2xl border border-[#222222] bg-[#050505]/95 backdrop-blur-2xl hover:border-[#333333] transition-colors"
          title={currentSong ? 'Click to expand Now Playing & Lyrics' : ''}
        >
          {/* ── Left: Track info + Actions ────────────────────── */}
          <div className="flex items-center gap-3 min-w-0 max-w-[180px] xs:max-w-[220px] sm:max-w-[260px] md:max-w-[280px] flex-shrink-0">
            {/* Album Art: clicking triggers dock expand */}
            <div
              className={`player-dock-thumb relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-[#222222] ${
                isPlaying ? 'ring-1 ring-white' : ''
              }`}
            >
              {currentSong?.thumbnail ? (
                <img
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#111111] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#888888] text-[20px]">album</span>
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="player-dock-title text-label-md font-semibold text-white truncate text-[13px] sm:text-[14px]"
                title={currentSong?.title || ''}
              >
                {currentSong?.title || 'Nothing playing'}
              </span>

              {/* Individual Multi-Artist routing with e.stopPropagation */}
              {currentSong ? (
                <ArtistLinks
                  artists={currentSong.artists}
                  artist={currentSong.artist}
                  artistId={currentSong.artistId}
                  className="player-dock-artist text-body-sm text-[#888888] truncate text-[11px] sm:text-[12px] block"
                />
              ) : (
                <span className="player-dock-artist text-body-sm text-[#888888] truncate text-[11px] sm:text-[12px]">
                  Search for a song
                </span>
              )}
            </div>

            {currentSong && (
              <div className="hidden xs:flex items-center gap-0.5 flex-shrink-0">
                {/* Heart / Like button (stops propagation) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(currentSong);
                  }}
                  className={`p-1.5 rounded-full transition-transform active:scale-90 cursor-pointer ${
                    liked ? 'text-white' : 'text-[#888888] hover:text-white'
                  }`}
                  title={liked ? 'Unlike' : 'Like'}
                >
                  <span
                    className="material-symbols-outlined text-[19px] sm:text-[20px]"
                    style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}
                  >
                    favorite
                  </span>
                </button>

                {/* Add to Playlist button (stops propagation) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddMenuSong(currentSong);
                  }}
                  className="p-1.5 rounded-full text-[#888888] hover:text-white transition-colors cursor-pointer"
                  title="Add to playlist"
                >
                  <span className="material-symbols-outlined text-[19px] sm:text-[20px]">
                    playlist_add
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ── Center: Transport Controls + Seekbar ────────────── */}
          <div
            className="hidden sm:flex flex-col items-center gap-1.5 flex-1 min-w-0 max-w-xl mx-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Transport controls */}
            <div className="flex items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="text-[#888888] hover:text-white transition-colors cursor-pointer p-1"
                title="Shuffle"
              >
                <span className="material-symbols-outlined text-[18px]">shuffle</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playPrev();
                }}
                className="text-[#888888] hover:text-white transition-colors disabled:opacity-30 p-1 cursor-pointer"
                disabled={!currentSong}
                aria-label="Previous track"
                title="Previous"
              >
                <span className="material-symbols-outlined text-[24px]">
                  skip_previous
                </span>
              </button>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                disabled={!currentSong}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 shadow-lg shadow-white/10 disabled:opacity-40 cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span
                    className="material-symbols-outlined text-[22px] text-black font-bold"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playNext();
                }}
                className="text-[#888888] hover:text-white transition-colors disabled:opacity-30 p-1 cursor-pointer"
                disabled={!currentSong}
                aria-label="Next track"
                title="Next"
              >
                <span className="material-symbols-outlined text-[24px]">
                  skip_next
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="text-[#888888] hover:text-white transition-colors cursor-pointer p-1"
                title="Repeat"
              >
                <span className="material-symbols-outlined text-[18px]">repeat</span>
              </button>
            </div>

            {/* Seekbar */}
            <div className="w-full" onClick={(e) => e.stopPropagation()}>
              <SeekBar currentTime={currentTime} duration={duration} onSeek={seek} />
            </div>
          </div>

          {/* ── Right: Mobile play controls or Desktop Volume + Lyrics + Bitrate ── */}
          <div
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile-only prev/play/next strip */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); playPrev(); }}
                className="text-[#888888] hover:text-white transition-colors disabled:opacity-30 p-1.5 cursor-pointer"
                disabled={!currentSong}
                aria-label="Previous track"
              >
                <span className="material-symbols-outlined text-[22px]">skip_previous</span>
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                disabled={!currentSong}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 shadow-lg shadow-white/10 disabled:opacity-40 cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span
                    className="material-symbols-outlined text-[20px] text-black font-bold"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); playNext(); }}
                className="text-[#888888] hover:text-white transition-colors disabled:opacity-30 p-1.5 cursor-pointer"
                disabled={!currentSong}
                aria-label="Next track"
              >
                <span className="material-symbols-outlined text-[22px]">skip_next</span>
              </button>
            </div>

            {/* Active Bitrate / Format Badge (desktop) */}
            {currentSong && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextQ =
                    audioQuality === 'max'
                      ? 'standard'
                      : audioQuality === 'standard'
                      ? 'datasaver'
                      : 'max';
                  setAudioQuality(nextQ);
                }}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] text-[10px] font-mono text-[#888888] hover:text-white transition-all cursor-pointer select-none"
                title={`Bitrate: ${
                  activeStreamMeta?.bitrate
                    ? Math.round(activeStreamMeta.bitrate / 1000) + ' kbps'
                    : audioQuality.toUpperCase()
                } • Codec: ${
                  activeStreamMeta?.mimeType
                    ? activeStreamMeta.mimeType.split(';')[0].replace('audio/', '')
                    : 'auto'
                } • Click to cycle quality`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="font-semibold uppercase tracking-wider text-[9px] text-white/90">
                  {audioQuality}
                </span>
                <span className="text-[#555555]">•</span>
                <span className="text-white/80">
                  {activeStreamMeta?.bitrate
                    ? `${Math.round(activeStreamMeta.bitrate / 1000)}k`
                    : audioQuality === 'max'
                    ? '140k'
                    : audioQuality === 'standard'
                    ? '131k'
                    : '72k'}
                </span>
                {activeStreamMeta?.itag && (
                  <span className="text-[#666666] text-[8px]">#{activeStreamMeta.itag}</span>
                )}
              </button>
            )}

            {/* Lyrics toggle button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleView();
              }}
              className="px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5 text-label-sm font-medium transition-all border border-[#333333] bg-transparent text-[#888888] hover:text-white hover:border-[#666666] cursor-pointer"
              title="Open full lyrics & now playing"
            >
              <span className="material-symbols-outlined text-[16px]">lyrics</span>
              <span className="hidden sm:inline text-[12px]">Lyrics</span>
            </button>

            {/* Volume slider */}
            <div className="hidden md:flex" onClick={(e) => e.stopPropagation()}>
              <VolumeSlider volume={volume} onChange={changeVolume} />
            </div>
          </div>
        </div>
      </div>

      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </>
  );
}
