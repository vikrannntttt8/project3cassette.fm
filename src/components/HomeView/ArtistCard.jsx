export default function ArtistCard({ artist, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#14151e] hover:bg-[#1a1c28] border-2 border-black shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all duration-200 w-28 text-center"
    >
      {/* Avatar frame */}
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-900 border-2 border-black shadow-sm group-hover:scale-105 transition-transform duration-200">
        {artist.thumbnail ? (
          <img
            src={artist.thumbnail}
            alt={artist.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-white/30 text-[32px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            person
          </span>
        )}
        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#86EFAC] text-[26px]" style={{fontVariationSettings:"'FILL' 1"}}>
            play_circle
          </span>
        </div>
      </div>

      {/* Name */}
      <span className="text-xs font-black uppercase text-white tracking-tight line-clamp-1 group-hover:text-[#86EFAC] transition-colors duration-150 w-full px-1">
        {artist.title}
      </span>
      <span className="neo-badge bg-black text-[#86EFAC] text-[8px] py-0.5 px-2 border border-black font-mono">
        ARTIST
      </span>
    </button>
  );
}
