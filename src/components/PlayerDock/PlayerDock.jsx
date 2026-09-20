import { usePlayer } from '../../context/PlayerContext.jsx';
import SeekBar      from './SeekBar.jsx';
import VolumeSlider from './VolumeSlider.jsx';

export default function PlayerDock() {
  const {
    currentSong, isPlaying, isLoading,
    currentTime, duration, seek,
    volume, changeVolume,
    view, toggleView,
    togglePlay, playNext, playPrev,
    isLiked, toggleLike,
  } = usePlayer();

  return (
    <div className={`fixed bottom-4 z-50 pointer-events-auto transition-all duration-300 ${
      view === 'lyrics' ? 'left-4 right-4' : 'left-4 sm:left-[17rem] right-4'
    }`}>
      <div className="bg-[#12131c] border-2 border-black shadow-neo-lg rounded-2xl px-5 py-3 flex items-center justify-between gap-4 max-w-5xl mx-auto">

        {/* ── Left: Track info ─────────────────────────────── */}
        <div className="flex items-center gap-3 w-[230px] min-w-0 flex-shrink-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 border-black bg-zinc-900 shadow-sm">
            {currentSong?.thumbnail ? (
              <img src={currentSong.thumbnail} alt={currentSong.title}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-600 text-[22px]">album</span>
              </div>
            )}
            {/* Loading spinner over thumbnail */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#86EFAC] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black uppercase text-white truncate tracking-tight">
              {currentSong?.title || 'NO TRACK ACTIVE'}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 truncate">
              {currentSong?.artist || 'SELECT SONG TO PLAY'}
            </span>
          </div>

          {currentSong && (
            <button
              onClick={() => toggleLike(currentSong)}
              className={`neo-btn p-1.5 rounded-lg border-2 border-black flex-shrink-0 transition-all ${
                isLiked(currentSong.id) ? 'bg-[#FDA4AF] text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={isLiked(currentSong.id) ? 'Unlike' : 'Like'}
            >
              <span className="material-symbols-outlined text-[16px] block"
                style={{fontVariationSettings:`'FILL' ${isLiked(currentSong.id) ? 1 : 0}`}}>
                favorite
              </span>
            </button>
          )}
        </div>

        {/* ── Center: Controls + Seekbar ────────────────────── */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 max-w-xl">
          {/* Transport */}
          <div className="flex items-center gap-4">
            <button className="text-zinc-500 hover:text-white transition-colors hover:scale-110">
              <span className="material-symbols-outlined text-[18px]">shuffle</span>
            </button>
            <button
              onClick={playPrev}
              className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 hover:scale-110"
              disabled={!currentSong}
            >
              <span className="material-symbols-outlined text-[22px]">skip_previous</span>
            </button>

            {/* Play / Pause Neo Button */}
            <button
              onClick={togglePlay}
              disabled={!currentSong}
              className="neo-btn-mint w-10 h-10 rounded-full border-2 border-black flex items-center justify-center shadow-neo-sm font-black disabled:opacity-40"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[24px] text-black font-bold block"
                  style={{fontVariationSettings:"'FILL' 1"}}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              )}
            </button>

            <button
              onClick={playNext}
              className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 hover:scale-110"
              disabled={!currentSong}
            >
              <span className="material-symbols-outlined text-[22px]">skip_next</span>
            </button>
            <button className="text-zinc-500 hover:text-white transition-colors hover:scale-110">
              <span className="material-symbols-outlined text-[18px]">repeat</span>
            </button>
          </div>

          {/* Seekbar */}
          <SeekBar currentTime={currentTime} duration={duration} onSeek={seek} />
        </div>

        {/* ── Right: Lyrics + Volume ────────────────────────── */}
        <div className="flex items-center gap-3 w-[220px] justify-end flex-shrink-0">
          {/* Lyrics toggle sticker button */}
          <button
            onClick={toggleView}
            className={`neo-btn px-3 py-1.5 rounded-xl font-black uppercase text-xs flex items-center gap-1.5 border-2 border-black shadow-neo-sm transition-all ${
              view === 'lyrics'
                ? 'bg-[#FDA4AF] text-black'
                : 'bg-[#181926] text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">lyrics</span>
            <span>LYRICS</span>
          </button>

          {/* Volume */}
          <VolumeSlider volume={volume} onChange={changeVolume} />
        </div>
      </div>
    </div>
  );
}
