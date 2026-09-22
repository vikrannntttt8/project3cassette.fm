export default function AlbumCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-2xl p-3 bg-[#18181a] hover:bg-[#222225] border border-white/5 hover:border-amber-500/40 transition-all duration-200 text-left w-full cursor-pointer"
    >
      {/* Art */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#222225] border border-white/5">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600">
            <span className="material-symbols-outlined text-[36px]">
              {item.type === 'playlist' ? 'queue_music' : 'album'}
            </span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 transform group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
          </div>
        </div>
        {/* Song count badge */}
        {item.songCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-mono text-neutral-300">
            {item.songCount} tracks
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <span className="text-label-md font-bold text-white truncate group-hover:text-amber-300 transition-colors">
          {item.title}
        </span>
        <span className="text-body-xs text-neutral-400 truncate">
          {item.artist || item.year || ''}
        </span>
      </div>
    </button>
  );
}
