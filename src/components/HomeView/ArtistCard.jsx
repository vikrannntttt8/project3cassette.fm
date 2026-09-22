import { getHighResImage } from '../../utils/imageUtils.js';

export default function ArtistCard({ artist, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#18181a] hover:bg-[#222225] border border-white/5 hover:border-amber-500/30 transition-all duration-200 w-24 sm:w-28 text-center cursor-pointer"
    >
      {/* Circular avatar */}
      <div className="relative w-16 h-16 sm:w-18 sm:h-18 aspect-square rounded-full overflow-hidden bg-[#222225] ring-2 ring-white/10 group-hover:ring-amber-500 transition-all">
        {artist.thumbnail ? (
          <img
            src={getHighResImage(artist.thumbnail)}
            alt={artist.title || artist.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <span className="material-symbols-outlined text-neutral-500 text-[32px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            person
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="material-symbols-outlined text-amber-400 text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            play_circle
          </span>
        </div>
      </div>

      {/* Name */}
      <span className="text-label-md font-bold text-white text-center line-clamp-2 group-hover:text-amber-300 transition-colors">
        {artist.title || artist.name}
      </span>
      <span className="text-[11px] text-neutral-400">Artist</span>
    </button>
  );
}
