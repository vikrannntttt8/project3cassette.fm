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
    <section className="lg:col-span-6 neo-card p-6 bg-[#12131c] border-2 border-black shadow-neo-lg h-[470px] flex flex-col justify-center overflow-hidden relative animate-fade-in">
      {/* Smooth top and bottom gradient fade masks (Preserved & Enhanced Fade Feature) */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#12131c] via-[#12131c]/80 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#12131c] via-[#12131c]/80 to-transparent pointer-events-none z-10" />

      {/* Lyrics scroll container */}
      <div ref={containerRef} className="overflow-y-auto py-20 space-y-4 px-2"
        style={{ scrollbarWidth: 'none' }}>
        {lines.map((line, i) => {
          const isActive   = i === activeIndex;
          const isPast     = i < activeIndex;

          return (
            <p
              key={i}
              onClick={() => seek(line.time)}
              className={`cursor-pointer leading-snug transition-all duration-300 select-text ${
                isActive
                  ? 'text-[#86EFAC] font-black text-xl sm:text-2xl bg-black/60 border-l-4 border-[#86EFAC] pl-4 py-2 rounded-r-2xl shadow-neo-sm scale-[1.02] origin-left lyric-active-glow'
                  : isPast
                  ? 'text-zinc-600 font-bold text-base sm:text-lg pl-4 hover:text-zinc-400 opacity-60'
                  : 'text-zinc-400 font-bold text-base sm:text-lg pl-4 hover:text-white'
              }`}
            >
              {line.text}
            </p>
          );
        })}
      </div>

      {/* Source badge */}
      <div className="absolute bottom-3 right-4 z-20">
        <span className="neo-badge bg-black text-[#86EFAC] text-[9px] font-mono border border-black shadow-neo-sm">
          {lyricsSource === 'synced' ? '✦ SYNCED · LRCLIB'
            : lyricsSource === 'plain' ? '✦ PLAIN · SAAVN'
            : '✦ DEMO LYRICS'}
        </span>
      </div>
    </section>
  );
}
