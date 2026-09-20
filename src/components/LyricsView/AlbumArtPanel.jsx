import { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatTime, formatRemaining } from '../../utils/timeFormat.js';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';

export default function AlbumArtPanel() {
  const {
    currentSong, isPlaying, togglePlay,
    currentTime, duration, seek, volume, changeVolume,
    isLiked, toggleLike, playPrev, playNext,
    routeToSongEntity, routeToArtistEntity, audioQuality, setAudioQuality, activeStreamMeta, toggleView,
  } = usePlayer();

  const [addMenuSong, setAddMenuSong] = useState(null);

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const liked = currentSong ? isLiked(currentSong.id) : false;

  return (
    <>
      <section className="lg:col-span-6 flex flex-col justify-center items-center lg:items-start w-full max-w-[360px] sm:max-w-[380px] mx-auto lg:mx-0 select-none">
        {/* Album Artwork — Scaled down for balanced vertical fit */}
        <div className="relative group w-full aspect-square max-w-[260px] sm:max-w-[290px] lg:max-w-[320px] mb-4 sm:mb-5">
          {/* Ambient glow */}
          <div className="absolute -inset-2 rounded-[24px] bg-white/5 opacity-20 blur-xl group-hover:opacity-30 transition-all duration-700 pointer-events-none" />
          {/* Art */}
          {currentSong?.thumbnail ? (
            <img
              src={currentSong.thumbnail}
              alt={currentSong?.title || 'Album Art'}
              className="relative w-full h-full object-cover rounded-[20px] shadow-2xl ring-1 ring-white/10"
            />
          ) : (
            <div className="relative w-full h-full rounded-[20px] bg-[#161616] ring-1 ring-white/10 flex items-center justify-center shadow-2xl">
              <span className="material-symbols-outlined text-white/10 text-[80px]">album</span>
            </div>
          )}
        </div>

        {/* Track metadata & Action buttons */}
        <div className="w-full flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex flex-col pr-3 min-w-0 flex-1">
            <h1 
              onClick={() => {
                if (currentSong) {
                  toggleView(); // close lyrics view
                  routeToSongEntity(currentSong);
                }
              }}
              className="text-[20px] sm:text-[24px] font-bold tracking-tight text-white leading-snug truncate hover:text-neutral-300 cursor-pointer transition-colors"
              title="View track / album details"
            >
              {currentSong?.title || 'No Track Loaded'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span 
                onClick={() => {
                  if (currentSong?.artist) {
                    toggleView();
                    routeToArtistEntity(currentSong.artist, currentSong.artistId);
                  }
                }}
                className="text-body-sm font-medium text-neutral-400 hover:text-white hover:underline cursor-pointer truncate transition-colors"
                title={`View ${currentSong?.artist}'s profile`}
              >
                {currentSong?.artist || '—'}
              </span>

              {/* Live Bitrate / Format Indicator */}
              {currentSong && (
                <button
                  type="button"
                  onClick={() => {
                    const nextQ = audioQuality === 'max' ? 'standard' : audioQuality === 'standard' ? 'datasaver' : 'max';
                    setAudioQuality(nextQ);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.08] hover:bg-white/15 text-[10px] font-mono text-white/70 hover:text-white transition-all ml-1"
                  title={`Active Bitrate: ${activeStreamMeta?.bitrate ? Math.round(activeStreamMeta.bitrate / 1000) + ' kbps' : audioQuality} • Itag: ${activeStreamMeta?.itag || 'N/A'} • Click to change`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${audioQuality === 'max' ? 'bg-white' : audioQuality === 'standard' ? 'bg-neutral-400' : 'bg-neutral-600'}`} />
                  <span>{audioQuality.toUpperCase()}</span>
                  <span className="text-white/40">•</span>
                  <span>{activeStreamMeta?.bitrate ? `${Math.round(activeStreamMeta.bitrate / 1000)}k` : (audioQuality === 'max' ? '140k' : audioQuality === 'standard' ? '131k' : '72k')}</span>
                </button>
              )}
            </div>
          </div>

          {currentSong && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Heart / Like button */}
              <button
                onClick={() => toggleLike(currentSong)}
                className={`p-2 rounded-full transition-transform active:scale-90 hover:bg-white/5 ${
                  liked ? 'text-white' : 'text-neutral-400 hover:text-white'
                }`}
                title={liked ? 'Unlike' : 'Like'}
              >
                <span className="material-symbols-outlined text-[24px]"
                  style={{fontVariationSettings:`'FILL' ${liked ? 1 : 0}`}}>
                  favorite
                </span>
              </button>

              {/* TASK 3: Add to Playlist button */}
              <button
                onClick={() => setAddMenuSong(currentSong)}
                className="p-2 rounded-full text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors"
                title="Add to playlist"
              >
                <span className="material-symbols-outlined text-[24px]">
                  playlist_add
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Seek bar with clean aligned timers */}
        <div className="w-full mb-4">
          <div className="relative w-full flex items-center group cursor-pointer h-2">
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full seek-fill transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.25}
              value={currentTime}
              onChange={e => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            />
          </div>
          {/* Aligned Timers */}
          <div className="flex justify-between items-center text-[12px] text-on-surface-variant mt-1.5 font-mono">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
            <span className="tabular-nums">{formatRemaining(currentTime, duration)}</span>
          </div>
        </div>

        {/* Scaled-down Playback Controls (compact and balanced) */}
        <div className="w-full flex items-center justify-between px-2 mb-4">
          <button className="text-on-surface-variant hover:text-white transition-colors p-1.5">
            <span className="material-symbols-outlined text-[20px]">shuffle</span>
          </button>

          <button
            onClick={playPrev}
            disabled={!currentSong}
            className="text-on-surface-variant hover:text-white transition-colors disabled:opacity-30 p-1.5"
            title="Previous"
          >
            <span className="material-symbols-outlined text-[26px]">skip_previous</span>
          </button>

          {/* Main play/pause button (scaled from 14x14 down to 12x12) */}
          <button
            onClick={togglePlay}
            disabled={!currentSong}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 shadow-xl shadow-white/10 disabled:opacity-40"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            onClick={playNext}
            disabled={!currentSong}
            className="text-on-surface-variant hover:text-white transition-colors disabled:opacity-30 p-1.5"
            title="Next"
          >
            <span className="material-symbols-outlined text-[26px]">skip_next</span>
          </button>

          <button className="text-on-surface-variant hover:text-white transition-colors p-1.5">
            <span className="material-symbols-outlined text-[20px]">repeat</span>
          </button>
        </div>

        {/* Compact Volume slider */}
        <div className="w-full flex items-center gap-2.5 px-1">
          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">volume_down</span>
          <div className="relative flex-1">
            <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div className="bg-on-surface-variant h-full rounded-full" style={{ width: `${volume * 100}%` }} />
            </div>
            <input
              type="range"
              min={0} max={1} step={0.01}
              value={volume}
              onChange={e => changeVolume(parseFloat(e.target.value))}
              className="volume-slider absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            />
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">volume_up</span>
        </div>
      </section>

      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </>
  );
}
