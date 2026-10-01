export default function RecommendationCard({ mix, onPlay }) {
  return (
    <div className="group relative rounded-xl glass-card p-3 flex flex-col gap-3 hover:bg-white/8 transition-all duration-300 cursor-pointer border border-white/5">
      {/* Album art area */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white/5">
        <div className={`w-full h-full bg-gradient-to-br ${mix.gradient} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-white/20 text-[48px]">album</span>
        </div>
        {/* Badge */}
        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded">
          <span className={`text-label-sm ${mix.badgeColor}`}>{mix.badge}</span>
        </div>
        {/* Play button on hover */}
        <button
          onClick={onPlay}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#d0bcff] text-[#3c0091] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-105"
        >
          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <span className="text-label-lg font-semibold text-white group-hover:text-[#d0bcff] transition-colors truncate">
          {mix.title}
        </span>
        <span className="text-body-sm text-on-surface-variant truncate">{mix.subtitle}</span>
      </div>
    </div>
  );
}
