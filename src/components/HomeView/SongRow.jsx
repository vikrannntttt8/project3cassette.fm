import { formatTime } from '../../utils/timeFormat.js';
import { usePlayer } from '../../context/PlayerContext.jsx';

export default function SongRow({ song, index, isActive, isPlaying, onPlay, onAddToPlaylist }) {
  const { isLiked, toggleLike } = usePlayer();
  const liked = isLiked(song.id);

  const formattedIndex = String(index + 1).padStart(2, '0');

  return (
    <div
      className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
        isActive
          ? 'bg-[#1b1c24] border-2 border-black shadow-neo-sm'
          : 'bg-[#121318]/50 hover:bg-[#171821] border-2 border-transparent hover:border-black hover:shadow-neo-sm'
      }`}
      onClick={onPlay}
    >
      {/* Index / Play indicator */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {isActive && isPlaying ? (
          <div className="flex items-end gap-[3px] h-4 w-4">
            <span className="visualizer-bar w-[3px] bg-[#CCFF00] rounded-sm" />
            <span className="visualizer-bar w-[3px] bg-[#00F0FF] rounded-sm" />
            <span className="visualizer-bar w-[3px] bg-[#FF2E93] rounded-sm" />
          </div>
        ) : (
          <>
            <span className={`text-xs font-mono font-bold group-hover:hidden ${isActive ? 'text-[#CCFF00]' : 'text-zinc-500'}`}>
              {formattedIndex}
            </span>
            <span className="material-symbols-outlined text-[20px] text-white hidden group-hover:block transition-transform group-hover:scale-110"
              style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
          </>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 border-2 border-black shadow-sm">
        {song.thumbnail
          ? <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
          : <span className="material-symbols-outlined text-white/20 text-[20px] m-auto block mt-2.5">music_note</span>
        }
      </div>

      {/* Title & artist */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-xs font-black uppercase tracking-tight truncate ${isActive ? 'text-[#CCFF00]' : 'text-white group-hover:text-[#CCFF00]'} transition-colors`}>
            {song.title}
          </span>
          {song.explicit && (
            <span className="neo-badge bg-[#FFE600] text-black text-[8px] py-0 px-1 border border-black font-black">
              E
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-zinc-400 truncate">{song.artist}</span>
      </div>

      {/* Album */}
      <span className="hidden lg:block text-xs font-mono text-zinc-400 truncate max-w-[170px] uppercase opacity-75">
        {song.album}
      </span>

      {/* Actions */}
      <div className={`flex items-center gap-1.5 flex-shrink-0 transition-opacity ${
        liked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          onClick={e => { e.stopPropagation(); toggleLike(song); }}
          className={`neo-btn p-1 rounded-md border-2 border-black transition-all ${
            liked ? 'bg-[#FF2E93] text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title={liked ? 'Unlike' : 'Like'}
        >
          <span className="material-symbols-outlined text-[16px] block" style={{fontVariationSettings:`'FILL' ${liked ? 1 : 0}`}}>
            favorite
          </span>
        </button>
        <button
          onClick={e => { e.stopPropagation(); onAddToPlaylist?.(); }}
          className="neo-btn p-1 rounded-md border-2 border-black bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          title="Add to playlist"
        >
          <span className="material-symbols-outlined text-[16px] block">playlist_add</span>
        </button>
      </div>

      {/* Duration */}
      <span className="text-xs text-zinc-400 font-mono font-bold w-12 text-right flex-shrink-0">
        {formatTime(song.duration)}
      </span>
    </div>
  );
}
