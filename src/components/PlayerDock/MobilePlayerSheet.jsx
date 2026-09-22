import { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatTime } from '../../utils/timeFormat.js';
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
    lrcString,
    audioQuality,
    setAudioQuality,
    isShuffled,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'lyrics' | 'queue'
  const [addMenuSong, setAddMenuSong] = useState(null);

  if (!isOpen || !currentSong) return null;

  const liked = isLiked(currentSong.id);
  const remainingTime = duration > currentTime ? duration - currentTime : 0;

  return (
    <div className="md:hidden fixed inset-0 z-[95] bg-[#0e0e0e]/98 backdrop-blur-3xl flex flex-col text-white animate-sheet-slide-up select-none overflow-hidden">
      {/* ── Top Drag Handle & Bar ──────────────────────────────────── */}
      <div className="flex flex-col items-center pt-2 pb-1 px-4 flex-shrink-0 pt-safe">
        <button
          onClick={onClose}
          className="w-10 h-1 rounded-full bg-white/30 hover:bg-white/50 transition-colors my-1 cursor-pointer"
          aria-label="Dismiss player sheet"
        />

        <div className="w-full flex items-center justify-between mt-2">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#18181a] border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[22px]">keyboard_arrow_down</span>
          </button>

          {/* Segmented View Switcher: Track | Lyrics | Queue */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#18181a] border border-white/10">
            <button
              onClick={() => setActiveTab('player')}
              className={`px-3.5 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === 'player'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Track
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-3.5 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Lyrics
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Queue
            </button>
          </div>

          {/* Bitrate Badge Switcher */}
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
            className="px-2.5 py-1 rounded-full bg-[#18181a] border border-white/10 text-[10px] font-mono text-amber-400 font-bold active:scale-95 transition-transform"
          >
            {audioQuality.toUpperCase()}
          </button>
        </div>
      </div>

      {/* ── Center Content Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between px-6 py-4 min-h-0 overflow-y-auto no-scrollbar">
        {/* ── Mode 1: Main Player View ─────────────────────────────── */}
        {activeTab === 'player' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-2">
            {/* Album Artwork without messy glowing halo */}
            <div className="relative aspect-square w-full max-h-[320px] mx-auto rounded-3xl overflow-hidden bg-[#18181a] border border-white/10 my-auto shadow-xl">
              <img
                src={currentSong.cover || currentSong.thumbnail}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Song Meta + Actions with Marquee Title */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <div className="min-w-0 flex-1 overflow-hidden">
                <MarqueeText
                  text={currentSong.title}
                  className="text-headline-sm font-bold text-white tracking-tight"
                />
                <ArtistLinks
                  artists={currentSong.artists}
                  artist={currentSong.artist}
                  artistId={currentSong.artistId}
                  className="text-body-md text-neutral-400 truncate block mt-0.5"
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleLike(currentSong)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                    liked
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      : 'bg-[#18181a] text-neutral-400 border border-white/10 hover:text-white'
                  }`}
                  aria-label={liked ? 'Unlike' : 'Like'}
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                </button>

                <button
                  onClick={() => setAddMenuSong(currentSong)}
                  className="w-11 h-11 rounded-full bg-[#18181a] border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
                  aria-label="Add to playlist"
                >
                  <span className="material-symbols-outlined text-[22px]">playlist_add</span>
                </button>
              </div>
            </div>

            {/* Progress Slider (iOS Clean Scrubber without halo blob) */}
            <div className="space-y-1.5 mt-5">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime || 0}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(remainingTime)}</span>
              </div>
            </div>

            {/* Transport Controls with Working Shuffle & Repeat */}
            <div className="flex items-center justify-between px-2 mt-4">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition-colors cursor-pointer ${
                  isShuffled ? 'text-amber-400' : 'text-neutral-400 hover:text-white'
                }`}
                title="Toggle Shuffle"
              >
                <span className="material-symbols-outlined text-[22px]">shuffle</span>
              </button>

              <button
                onClick={playPrev}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
                aria-label="Previous track"
              >
                <span className="material-symbols-outlined text-[32px]">skip_previous</span>
              </button>

              {/* Clean Solid Amber Play/Pause (No drop shadow halo blob) */}
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-amber-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-none border border-amber-400/50 cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
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
                className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
                aria-label="Next track"
              >
                <span className="material-symbols-outlined text-[32px]">skip_next</span>
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 transition-colors cursor-pointer ${
                  isRepeat ? 'text-amber-400' : 'text-neutral-400 hover:text-white'
                }`}
                title="Toggle Repeat"
              >
                <span className="material-symbols-outlined text-[22px]">repeat</span>
              </button>
            </div>

            {/* Volume Slider Bar */}
            <div className="flex items-center gap-3 px-2 mt-5">
              <span className="material-symbols-outlined text-neutral-400 text-[18px]">volume_mute</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-full volume-slider"
              />
              <span className="material-symbols-outlined text-neutral-400 text-[18px]">volume_up</span>
            </div>
          </div>
        )}

        {/* ── Mode 2: Live Synced Lyrics Sheet ─────────────────────── */}
        {activeTab === 'lyrics' && (
          <div className="flex-1 flex flex-col overflow-y-auto px-2 py-4 space-y-5 text-center no-scrollbar">
            <p className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
              Synced Lyrics
            </p>
            <div className="space-y-4 my-auto">
              <p className="text-headline-md font-extrabold text-amber-400">
                {currentSong.title}
              </p>
              <p className="text-body-lg text-neutral-400 max-w-xs mx-auto leading-relaxed">
                {lrcString
                  ? 'Live synchronized lyrics streaming with YouTube Audio...'
                  : 'Instrumental or lyric data loading...'}
              </p>
            </div>
          </div>
        )}

        {/* ── Mode 3: Up Next Queue ─────────────────────────────────── */}
        {activeTab === 'queue' && (
          <div className="flex-1 flex flex-col overflow-y-auto space-y-2 no-scrollbar">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                Playing Next ({queue.length} tracks)
              </p>
              <button
                onClick={toggleShuffle}
                className={`text-[12px] font-semibold flex items-center gap-1 cursor-pointer ${
                  isShuffled ? 'text-amber-400' : 'text-neutral-400'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">shuffle</span>
                {isShuffled ? 'Shuffled' : 'Shuffle Queue'}
              </button>
            </div>
            {queue.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                onClick={() => loadSong(track, queue, i)}
                className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
                  i === queueIndex
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                    : 'bg-[#18181a]/55 hover:bg-[#18181a] text-white'
                }`}
              >
                <img src={track.thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate">{track.title}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                </div>
                {i === queueIndex && (
                  <span className="material-symbols-outlined text-amber-400 text-[18px]">
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
