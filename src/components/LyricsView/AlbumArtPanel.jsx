import { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatTime, formatRemaining } from '../../utils/timeFormat.js';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';

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
      <section className="lg:col-span-5 h-full max-h-full flex flex-col justify-center items-center lg:items-start w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] mx-auto lg:mx-0 select-none py-1 space-y-3 sm:space-y-4">
        {/* Album Artwork — Auto-scales proportionally with viewport height */}
        <div className="relative group w-auto aspect-square max-h-[28vh] sm:max-h-[32vh] lg:max-h-[36vh] max-w-[220px] sm:max-w-[280px] lg:max-w-[340px] mx-auto lg:mx-0 flex-shrink-1">
          {/* Ambient dynamic glow */}
          <div className="absolute -inset-2 rounded-[24px] bg-white/10 opacity-30 blur-xl group-hover:opacity-40 transition-all duration-700 pointer-events-none" />
          {/* Art */}
          {currentSong?.thumbnail ? (
            <img
              src={currentSong.thumbnail}
              alt={currentSong?.title || 'Album Art'}
              className="relative w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5"
            />
          ) : (
            <div className="relative w-full h-full rounded-2xl bg-[#161616] ring-1 ring-white/10 flex items-center justify-center shadow-2xl">
              <span className="material-symbols-outlined text-white/10 text-[64px]">album</span>
            </div>
          )}
        </div>

        {/* Track metadata & Action buttons */}
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0 flex-1">
            <h1 
              onClick={() => {
                if (currentSong) {
                  toggleView(); // close lyrics view
                  routeToSongEntity(currentSong);
                }
              }}
              className="text-[18px] sm:text-[22px] font-bold tracking-tight text-white leading-tight truncate hover:underline cursor-pointer transition-colors"
              title="View track / album details"
            >
              {currentSong?.title || 'No Track Loaded'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {currentSong ? (
                <ArtistLinks
                  artists={currentSong.artists}
                  artist={currentSong.artist}
                  artistId={currentSong.artistId}
                  className="text-body-sm text-[#888888] truncate"
                  linkClassName="hover:text-white hover:underline cursor-pointer"
                  onClickArtist={(name, id) => {
                    toggleView();
                    routeToArtistEntity(name, id);
                  }}
                />
              ) : (
                <span className="text-body-sm text-[#888888]">—</span>
              )}

              {/* Live Bitrate / Format Indicator */}
              {currentSong && (
                <button
                  type="button"
                  onClick={() => {
                    const nextQ = audioQuality === 'max' ? 'standard' : audioQuality === 'standard' ? 'datasaver' : 'max';
                    setAudioQuality(nextQ);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.08] hover:bg-white/15 text-[10px] font-mono text-white/70 hover:text-white transition-all ml-1 flex-shrink-0"
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
                className={`p-2 rounded-full transition-transform active:scale-90 hover:bg-white/10 cursor-pointer ${
                  liked ? 'text-white' : 'text-[#888888] hover:text-white'
                }`}
                title={liked ? 'Unlike' : 'Like'}
              >
                <span className="material-symbols-outlined text-[22px]"
                  style={{fontVariationSettings:`'FILL' ${liked ? 1 : 0}`}}>
                  favorite
                </span>
              </button>

              {/* Add to Playlist button */}
              <button
                onClick={() => setAddMenuSong(currentSong)}
                className="p-2 rounded-full text-[#888888] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Add to playlist"
              >
                <span className="material-symbols-outlined text-[22px]">
                  playlist_add
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Seek bar with clean aligned timers */}
        <div className="w-full">
          <div className="relative w-full flex items-center group cursor-pointer h-2 py-1">
            <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-150"
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
              className="absolute -top-2 -bottom-2 inset-x-0 w-full opacity-0 cursor-pointer h-5"
            />
          </div>
          {/* Aligned Timers */}
          <div className="flex justify-between items-center text-[11px] text-[#888888] mt-1 font-mono">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
            <span className="tabular-nums">{formatRemaining(currentTime, duration)}</span>
          </div>
        </div>

        {/* Playback Controls (Shuffle, Prev, Play/Pause, Next, Repeat) */}
        <div className="w-full flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            className="text-[#888888] hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
            title="Shuffle"
          >
            <span className="material-symbols-outlined text-[20px]">shuffle</span>
          </button>

          <button
            type="button"
            onClick={playPrev}
            disabled={!currentSong}
            className="text-[#888888] hover:text-white transition-colors disabled:opacity-30 p-2 rounded-full hover:bg-white/5 cursor-pointer"
            title="Previous track"
          >
            <span className="material-symbols-outlined text-[26px]">skip_previous</span>
          </button>

          {/* Main play/pause button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={!currentSong}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-40 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <span
              className="material-symbols-outlined text-[26px] text-black font-bold"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            type="button"
            onClick={playNext}
            disabled={!currentSong}
            className="text-[#888888] hover:text-white transition-colors disabled:opacity-30 p-2 rounded-full hover:bg-white/5 cursor-pointer"
            title="Next track"
          >
            <span className="material-symbols-outlined text-[26px]">skip_next</span>
          </button>

          <button
            type="button"
            className="text-[#888888] hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
            title="Repeat"
          >
            <span className="material-symbols-outlined text-[20px]">repeat</span>
          </button>
        </div>

        {/* Volume slider */}
        <div className="w-full flex items-center gap-2.5 px-2">
          <span className="material-symbols-outlined text-[#888888] text-[16px] flex-shrink-0">volume_down</span>
          <div className="relative flex-1 h-1.5 flex items-center cursor-pointer group">
            <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
              <div className="bg-white h-full rounded-full transition-all" style={{ width: `${volume * 100}%` }} />
            </div>
            <input
              type="range"
              min={0} max={1} step={0.01}
              value={volume}
              onChange={e => changeVolume(parseFloat(e.target.value))}
              className="absolute -top-2 -bottom-2 inset-x-0 w-full opacity-0 cursor-pointer h-5"
            />
          </div>
          <span className="material-symbols-outlined text-[#888888] text-[16px] flex-shrink-0">volume_up</span>
        </div>
      </section>

      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </>
  );
}
