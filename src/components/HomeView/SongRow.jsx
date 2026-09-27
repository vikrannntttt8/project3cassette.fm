import { formatTime } from '../../utils/timeFormat.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import TrackContextMenu from '../shared/TrackContextMenu.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';

/**
 * SongRow
 * Flat micro-surface row with universal click-to-play handler and single-line ellipsis truncation.
 */
export default function SongRow({ song, index, isActive, isPlaying, onPlay, onAddToPlaylist }) {
  const { isLiked, toggleLike } = usePlayer();
  const liked = isLiked(song.id);

  return (
    <div
      onClick={onPlay}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 cursor-pointer min-h-[52px] select-none ${
        isActive
          ? 'bg-accent/15 text-accent'
          : 'bg-[#18181a]/55 hover:bg-[#18181a] text-white'
      }`}
    >
      {/* Index / Play indicator */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {isActive && isPlaying ? (
          <div className="flex items-end gap-[2px] h-3.5 w-3.5">
            {[...Array(3)].map((_, i) => (
              <span key={i} className="visualizer-bar w-[2.5px] bg-accent rounded-full" />
            ))}
          </div>
        ) : (
          <>
            <span className={`text-[12px] font-mono group-hover:hidden ${isActive ? 'text-accent font-bold' : 'text-neutral-500'}`}>
              {index + 1}
            </span>
            <span
              className="material-symbols-outlined text-[18px] text-white hidden group-hover:block"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
          </>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-[#222225]">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-neutral-500 text-[18px] m-auto block mt-2.5">
            music_note
          </span>
        )}
      </div>

      {/* Title & artist with clean single-line truncation */}
      <div className="flex flex-col min-w-0 flex-1 justify-center overflow-hidden">
        <p
          className={`text-[13.5px] font-semibold leading-tight truncate whitespace-nowrap overflow-hidden text-ellipsis ${
            isActive ? 'text-accent font-bold' : 'text-white'
          }`}
          title={song.title}
        >
          {song.title}
        </p>
        <ArtistLinks
          artists={song.artists}
          artist={song.artist}
          artistId={song.artistId}
          className="text-[11px] text-neutral-400 truncate block mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis"
        />
      </div>

      {/* Album (hidden on small) */}
      {song.album && (
        <span
          className="hidden lg:block text-[12px] text-neutral-400 truncate max-w-[150px]"
          title={song.album}
        >
          {song.album}
        </span>
      )}

      {/* Actions (Only explicit buttons stop propagation) */}
      <div
        className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity ${
          liked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(song);
          }}
          className={`p-1.5 rounded-full transition-transform active:scale-90 min-w-[34px] min-h-[34px] flex items-center justify-center cursor-pointer ${
            liked ? 'text-accent' : 'text-neutral-500 hover:text-white'
          }`}
          title={liked ? 'Unlike' : 'Like'}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}
          >
            favorite
          </span>
        </button>
        <TrackContextMenu track={song} onAddToPlaylist={onAddToPlaylist} />
      </div>

      {/* Duration */}
      <span className="text-[11px] text-neutral-500 font-mono w-9 text-right flex-shrink-0">
        {formatTime(song.duration)}
      </span>
    </div>
  );
}
