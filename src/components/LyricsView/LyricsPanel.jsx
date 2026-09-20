import { useRef, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useLrcSync } from '../../hooks/useLrcSync.js';

export default function LyricsPanel() {
  const { lrcString, lyricsSource, lyricsLoading, currentTime, seek } = usePlayer();
  const containerRef = useRef(null);
  const { lines, activeIndex } = useLrcSync(lrcString, currentTime);

  // Auto-scroll active line to center
  useEffect(() => {
    if (!containerRef.current || activeIndex < 0) return;
    const el = containerRef.current.children[activeIndex];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex]);

  if (lyricsLoading) {
    return (
      <section className="lg:col-span-6 neo-card p-8 bg-[#121319] border-2 border-black shadow-neo-lg flex flex-col items-center justify-center gap-3 h-[420px]">
        <div className="w-7 h-7 border-3 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">FETCHING SYNCED LYRICS…</p>
      </section>
    );
  }

  if (!lines.length) {
    return (
      <section className="lg:col-span-6 neo-card p-8 bg-[#121319] border-2 border-black shadow-neo-lg flex items-center justify-center h-[420px]">
        <p className="text-sm font-black uppercase text-zinc-500 tracking-wider">NO LYRICS AVAILABLE FOR THIS TRACK</p>
      </section>
    );
  }

  return (
    <section className="lg:col-span-6 neo-card p-6 bg-[#121319] border-2 border-black shadow-neo-lg h-[460px] flex flex-col justify-center overflow-hidden relative">
      {/* Top and bottom gradient fade masks */}
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#121319] to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#121319] to-transparent pointer-events-none z-10" />

      {/* Lyrics scroll container */}
      <div ref={containerRef} className="overflow-y-auto py-16 space-y-4 px-2"
        style={{ scrollbarWidth: 'none' }}>
        {lines.map((line, i) => {
          const isActive   = i === activeIndex;
          const isPast     = i < activeIndex;

          return (
            <p
              key={i}
              onClick={() => seek(line.time)}
              className={`cursor-pointer leading-snug transition-all duration-200 select-text ${
                isActive
                  ? 'text-[#CCFF00] font-black text-xl sm:text-2xl bg-black/60 border-l-4 border-[#CCFF00] pl-3 py-1.5 rounded-r-lg shadow-neo-sm scale-[1.02] origin-left'
                  : isPast
                  ? 'text-zinc-600 font-bold text-base sm:text-lg pl-3 hover:text-zinc-400'
                  : 'text-zinc-400 font-bold text-base sm:text-lg pl-3 hover:text-white'
              }`}
            >
              {line.text}
            </p>
          );
        })}
      </div>

      {/* Source badge */}
      <div className="absolute bottom-2.5 right-3 z-20">
        <span className="neo-badge bg-black text-[#00F0FF] text-[9px] font-mono border border-black shadow-neo-sm">
          {lyricsSource === 'synced' ? '✦ SYNCED · LRCLIB'
            : lyricsSource === 'plain' ? '✦ PLAIN · SAAVN'
            : '✦ DEMO LYRICS'}
        </span>
      </div>
    </section>
  );
}
