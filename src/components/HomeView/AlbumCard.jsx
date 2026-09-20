export default function AlbumCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-2xl p-2.5 bg-[#14151e] hover:bg-[#1a1c28] border-2 border-black shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 text-left w-full relative"
    >
      {/* Art Frame */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border-2 border-black">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <span className="material-symbols-outlined text-white/20 text-[40px]">
              {item.type === 'playlist' ? 'queue_music' : 'album'}
            </span>
          </div>
        )}

        {/* Floating track count sticker */}
        {item.songCount > 0 && (
          <div className="absolute top-2 left-2 neo-badge bg-black text-[#86EFAC] text-[9px] py-0.5 px-2 border border-black font-mono shadow-sm">
            {item.songCount} TRKS
          </div>
        )}

        {/* Play overlay button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-[#86EFAC] border-2 border-black flex items-center justify-center shadow-neo-sm transform group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-black text-[24px]" style={{fontVariationSettings:"'FILL' 1"}}>
              play_arrow
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 px-0.5">
        <span className="text-xs font-black uppercase tracking-tight text-white truncate group-hover:text-[#86EFAC] transition-colors duration-150">
          {item.title}
        </span>
        <span className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
          {item.artist || item.year || (item.type === 'playlist' ? 'PLAYLIST' : 'ALBUM')}
        </span>
      </div>
    </button>
  );
}
