export default function AlbumCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-xl p-3 bg-[#0a0a0a] hover:bg-[#111111] border border-[#222222] hover:border-white transition-all duration-200 text-left w-full"
    >
      {/* Art */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#141414] border border-[#262626]">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white/20 text-[40px]">
              {item.type === 'playlist' ? 'queue_music' : 'album'}
            </span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-black text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
          </div>
        </div>
        {/* Song count badge */}
        {item.songCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 border border-[#333333] px-1.5 py-0.5 rounded text-label-sm text-[#888888]">
            {item.songCount} tracks
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <span className="text-label-lg font-semibold text-white truncate group-hover:underline transition-colors">
          {item.title}
        </span>
        <span className="text-body-sm text-[#888888] truncate">
          {item.artist || item.year || ''}
        </span>
      </div>
    </button>
  );
}
