export default function QuickReplayRow({ tracks = [], onPlay }) {
  if (!tracks || !tracks.length) return null;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-headline-sm font-semibold text-white">Quick Replay</span>
        <span className="text-label-sm text-[#888888]">Recently Played</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {tracks.slice(0, 10).map((track, idx) => (
          <button
            key={track.videoId || track.id || idx}
            onClick={() => onPlay?.(track)}
            className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black hover:bg-[#111111] border border-[#262626] hover:border-white transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#333333] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {track.thumbnail ? (
                <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[16px] text-white">play_arrow</span>
              )}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-label-md font-semibold text-white group-hover:underline transition-colors truncate max-w-[110px]">
                {track.title}
              </span>
              <span className="text-body-sm text-[#888888] truncate max-w-[110px]">{track.artist}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
