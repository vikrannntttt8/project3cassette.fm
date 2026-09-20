import { formatTime } from '../../utils/timeFormat.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import TrackContextMenu from '../shared/TrackContextMenu.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';

export default function SongRow({ song, index, isActive, isPlaying, onPlay, onAddToPlaylist }) {
  const { isLiked, toggleLike, routeToSongEntity, routeToArtistEntity } = usePlayer();
  const liked = isLiked(song.id);

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
        isActive ? 'bg-white/10 border border-white/20' : 'hover:bg-white/[0.04] border border-transparent'
      }`}
      onClick={onPlay}
    >
      {/* Index / Play indicator */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {isActive && isPlaying ? (
          <div className="flex items-end gap-[2px] h-4 w-4">
            {[...Array(3)].map((_, i) => (
              <span key={i} className="visualizer-bar w-[3px] bg-white rounded-full" />
            ))}
          </div>
        ) : (
          <>
            <span className={`text-label-md font-mono group-hover:hidden ${isActive ? 'text-white font-bold' : 'text-[#888888]'}`}>
              {index + 1}
            </span>
            <span className="material-symbols-outlined text-[18px] text-white hidden group-hover:block"
              style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
          </>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#111111] border border-[#222222]">
        {song.thumbnail
          ? <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
          : <span className="material-symbols-outlined text-white/20 text-[20px] m-auto block mt-2.5">music_note</span>
        }
      </div>

      {/* Title & artist */}
      <div className="flex flex-col min-w-0 flex-1">
        <span
          onClick={(e) => {
            e.stopPropagation();
            routeToSongEntity(song);
          }}
          className={`text-label-lg font-semibold truncate hover:underline cursor-pointer ${
            isActive ? 'text-white font-bold' : 'text-white'
          } transition-colors`}
          title={`View album / single for "${song.title}"`}
        >
          {song.title}
          {song.explicit && (
            <span className="ml-1 text-label-sm bg-white/10 text-[#888888] px-1 rounded align-middle">E</span>
          )}
        </span>
        <ArtistLinks
          artists={song.artists}
          artist={song.artist}
          artistId={song.artistId}
          className="text-body-sm text-[#888888] truncate inline-block"
        />
      </div>

      {/* Album (hidden on small) */}
      {song.album && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            routeToSongEntity(song);
          }}
          className="hidden lg:block text-body-sm text-[#888888] hover:text-white hover:underline truncate max-w-[160px] cursor-pointer transition-colors"
          title={`View album: ${song.album}`}
        >
          {song.album}
        </span>
      )}

      {/* Actions */}
      <div className={`flex items-center gap-1.5 flex-shrink-0 transition-opacity ${
        liked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          onClick={e => { e.stopPropagation(); toggleLike(song); }}
          className={`p-1.5 rounded-full transition-transform active:scale-90 ${
            liked ? 'text-white' : 'text-[#888888] hover:text-white'
          }`}
          title={liked ? 'Unlike' : 'Like'}
        >
          <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings:`'FILL' ${liked ? 1 : 0}`}}>
            favorite
          </span>
        </button>
        <TrackContextMenu track={song} onAddToPlaylist={onAddToPlaylist} />
      </div>

      {/* Duration */}
      <span className="text-label-sm text-[#888888] font-mono w-10 text-right flex-shrink-0">
        {formatTime(song.duration)}
      </span>
    </div>
  );
}
