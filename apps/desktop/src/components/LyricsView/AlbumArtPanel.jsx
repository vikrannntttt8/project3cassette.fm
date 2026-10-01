import { usePlayer } from '../../context/PlayerContext.jsx';
import { getHighResImage } from '../../utils/imageUtils.js';
import ArtistLinks from '../shared/ArtistLinks.jsx';
import MarqueeText from '../shared/MarqueeText.jsx';

/**
 * AlbumArtPanel — Left column of the Now Playing / Lyrics view.
 * Contains ONLY: Album Art, Song Title, Artist Name.
 * ALL playback controls live exclusively in the global bottom PlayerDock.
 */
export default function AlbumArtPanel() {
  const {
    currentSong,
    routeToSongEntity,
    routeToArtistEntity,
    toggleView,
  } = usePlayer();

  return (
    <section className="lg:col-span-5 h-full max-h-full flex flex-col justify-center items-center lg:items-start w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] mx-auto lg:mx-0 select-none py-1 gap-4 sm:gap-5">
      {/* Album Artwork */}
      <div className="relative group w-auto aspect-square max-h-[32vh] sm:max-h-[38vh] lg:max-h-[44vh] max-w-[220px] sm:max-w-[280px] lg:max-w-[360px] mx-auto lg:mx-0 flex-shrink-0">
        {/* Ambient glow */}
        <div className="absolute -inset-3 rounded-[28px] bg-white/10 opacity-25 blur-2xl group-hover:opacity-35 transition-all duration-700 pointer-events-none" />
        {currentSong?.thumbnail || currentSong?.cover ? (
          <img
            src={getHighResImage(currentSong.cover || currentSong.thumbnail)}
            alt={currentSong?.title || 'Album Art'}
            className="relative w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5"
          />
        ) : (
          <div className="relative w-full h-full rounded-2xl bg-[#161616] ring-1 ring-white/10 flex items-center justify-center shadow-2xl">
            <span className="material-symbols-outlined text-white/10 text-[64px]">album</span>
          </div>
        )}
      </div>

      {/* Song Title + Artist Name — the ONLY metadata shown here */}
      <div className="w-full flex flex-col gap-1.5 min-w-0">
        {/* Title — clickable to navigate to track/album */}
        <div
          onClick={() => {
            if (currentSong) {
              toggleView();
              routeToSongEntity(currentSong);
            }
          }}
          className="cursor-pointer group/lyrics-title"
          title="View track / album details"
        >
          <MarqueeText
            text={currentSong?.title || 'No Track Loaded'}
            className="text-[20px] sm:text-[24px] font-bold tracking-tight text-white leading-tight group-hover/lyrics-title:underline"
          />
        </div>

        {/* Artist — clickable to navigate to artist page */}
        {currentSong ? (
          <ArtistLinks
            artists={currentSong.artists}
            artist={currentSong.artist}
            artistId={currentSong.artistId}
            className="text-sm text-[#888888] truncate"
            linkClassName="hover:text-white hover:underline cursor-pointer transition-colors"
            onClickArtist={(name, id) => {
              toggleView();
              routeToArtistEntity(name, id);
            }}
          />
        ) : (
          <span className="text-sm text-[#888888]">—</span>
        )}
      </div>
    </section>
  );
}
