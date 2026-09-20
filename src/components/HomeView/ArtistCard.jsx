import { getHighResImage } from '../../utils/imageUtils.js';

export default function ArtistCard({ artist, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200 w-24 text-center"
    >
      {/* Circular avatar */}
      <div className="relative w-16 h-16 aspect-square rounded-full overflow-hidden bg-[#141414] ring-1 ring-[#333333] group-hover:ring-white transition-all">
        {artist.thumbnail ? (
          <img
            src={getHighResImage(artist.thumbnail)}
            alt={artist.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <span className="material-symbols-outlined text-white/30 text-[32px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            person
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>play_circle</span>
        </div>
      </div>

      {/* Name */}
      <span className="text-label-md font-medium text-white text-center line-clamp-2 group-hover:underline transition-colors">
        {artist.title}
      </span>
      <span className="text-label-sm text-[#888888]">Artist</span>
    </button>
  );
}
