import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatTime, formatRemaining } from '../../utils/timeFormat.js';

export default function AlbumArtPanel() {
  const {
    currentSong, isPlaying, togglePlay,
    currentTime, duration, seek, volume, changeVolume,
    isLiked, toggleLike, playPrev, playNext,
  } = usePlayer();

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const liked = currentSong ? isLiked(currentSong.id) : false;

  return (
    <section className="lg:col-span-6 flex flex-col justify-center items-center lg:items-start w-full max-w-[440px] mx-auto lg:mx-0 animate-fade-in">
      {/* Album Artwork with Neo-Brutalist Frame */}
      <div className="relative w-full aspect-square max-w-[360px] mb-6">
        {currentSong?.thumbnail ? (
          <img
            src={currentSong.thumbnail}
            alt={currentSong?.title || 'Album Art'}
            className="relative w-full h-full object-cover rounded-2xl border-3 border-black shadow-neo-xl"
          />
        ) : (
          <div className="relative w-full h-full rounded-2xl bg-zinc-900 border-3 border-black shadow-neo-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-700 text-[100px]">album</span>
          </div>
        )}

        {/* Live sticker */}
        {isPlaying && (
          <div className="absolute top-3 left-3 neo-badge bg-[#86EFAC] text-black text-[10px] py-1 px-2.5 border-2 border-black shadow-neo-sm font-black">
            ● LIVE PLAYBACK
          </div>
        )}
      </div>

      {/* Track metadata */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex flex-col pr-3 min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase truncate">
            {currentSong?.title || 'NO TRACK LOADED'}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono font-bold text-[#86EFAC] uppercase">
              {currentSong?.artist || '—'}
            </span>
            {currentSong?.album && (
              <span className="text-[10px] font-mono text-zinc-500 uppercase truncate">
                · {currentSong.album}
              </span>
            )}
          </div>
        </div>

        {currentSong && (
          <button
            onClick={() => toggleLike(currentSong)}
            className={`neo-btn p-2 rounded-2xl border-2 border-black flex-shrink-0 ${
              liked ? 'bg-[#FDA4AF] text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title={liked ? 'Unlike' : 'Like'}
          >
            <span className="material-symbols-outlined text-[24px] block"
              style={{fontVariationSettings:`'FILL' ${liked ? 1 : 0}`}}>
              favorite
            </span>
          </button>
        )}
      </div>

      {/* Seek bar */}
      <div className="w-full mb-5">
        <div className="relative w-full h-2.5 bg-zinc-800 border-2 border-black rounded-full overflow-hidden cursor-pointer group">
          <div
            className="h-full bg-gradient-to-r from-[#86EFAC] via-[#FEF08A] to-[#7DD3FC] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={e => seek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-400 mt-1.5 font-mono font-bold">
          <span>{formatTime(currentTime)}</span>
          <span>{formatRemaining(currentTime, duration)}</span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="w-full flex items-center justify-between px-1 mb-4">
        <button className="text-zinc-500 hover:text-white transition-colors hover:scale-110">
          <span className="material-symbols-outlined text-[22px]">shuffle</span>
        </button>
        <button
          onClick={playPrev}
          disabled={!currentSong}
          className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 hover:scale-110"
        >
          <span className="material-symbols-outlined text-[28px]">skip_previous</span>
        </button>

        {/* Main play/pause button */}
        <button
          onClick={togglePlay}
          disabled={!currentSong}
          className="neo-btn-mint w-13 h-13 rounded-full border-2 border-black flex items-center justify-center shadow-neo font-black disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[30px] text-black font-bold block" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <button
          onClick={playNext}
          disabled={!currentSong}
          className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 hover:scale-110"
        >
          <span className="material-symbols-outlined text-[28px]">skip_next</span>
        </button>
        <button className="text-zinc-500 hover:text-white transition-colors hover:scale-110">
          <span className="material-symbols-outlined text-[22px]">repeat</span>
        </button>
      </div>

      {/* Volume slider */}
      <div className="w-full flex items-center gap-2.5 px-1">
        <span className="material-symbols-outlined text-zinc-400 text-[18px]">volume_down</span>
        <div className="relative flex-1">
          <div className="w-full h-2 bg-zinc-800 border border-black rounded-sm overflow-hidden">
            <div className="bg-[#00F0FF] h-full" style={{ width: `${volume * 100}%` }} />
          </div>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={volume}
            onChange={e => changeVolume(parseFloat(e.target.value))}
            className="volume-slider absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>
        <span className="material-symbols-outlined text-zinc-400 text-[18px]">volume_up</span>
      </div>
    </section>
  );
}
