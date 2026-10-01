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
      className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer min-h-[48px] select-none ${
        isActive
          ? 'bg-accent/15 text-accent border border-accent/20'
          : 'bg-[#18181a]/40 hover:bg-[#18181a] text-white border border-transparent hover:border-white/5'
      }`}
    >
      {/* Index / Play indicator */}
      <div className="w-5 flex-shrink-0 flex items-center justify-center">
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

      {/* Thumbnail (Compact 40px) */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#222225] border border-white/5 relative">
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
          className={`text-[13.5px] font-semibold leading-tight tracking-tight truncate whitespace-nowrap overflow-hidden text-ellipsis ${
            isActive ? 'text-accent font-bold' : 'text-white'
          }`}
          title={song.title}
        >
          {song.title}
        </p>
        <div className="flex items-center gap-1.5 text-[11.5px] text-neutral-400 font-normal truncate mt-0.5">
          <ArtistLinks
            artists={song.artists}
            artist={song.artist}
            artistId={song.artistId}
            className="truncate whitespace-nowrap overflow-hidden text-ellipsis hover:text-white"
          />
          {song.album && (
            <>
              <span className="text-neutral-600">•</span>
              <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] hidden xs:inline" title={song.album}>
                {song.album}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions: Like + 3-Dot Context Menu (Touch friendly) */}
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(song);
          }}
          className={`p-1.5 rounded-full transition-transform active:scale-90 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer ${
            liked ? 'text-accent' : 'text-neutral-400 hover:text-white'
          }`}
          title={liked ? 'Unlike' : 'Like'}
          aria-label={liked ? 'Unlike' : 'Like'}
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
      <span className="text-[11px] text-neutral-500 font-mono w-8 text-right flex-shrink-0 hidden xs:inline">
        {formatTime(song.duration)}
      </span>
    </div>
  );
}
