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
      <section className="lg:col-span-6 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-on-surface-variant text-body-md">Loading lyrics…</p>
      </section>
    );
  }

  if (!lines.length) {
    return (
      <section className="lg:col-span-6 flex items-center justify-center">
        <p className="text-on-surface-variant text-body-lg">No lyrics available</p>
      </section>
    );
  }

  return (
    <section className="lg:col-span-6 h-full flex flex-col justify-center overflow-hidden relative">
      {/* Gradient fade masks */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#09090B] to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#09090B] to-transparent pointer-events-none z-10" />

      {/* Lyrics scroll */}
      <div ref={containerRef} className="overflow-y-auto py-20 space-y-7 lg:space-y-9 px-1"
        style={{ scrollbarWidth: 'none' }}>
        {lines.map((line, i) => {
          const isActive   = i === activeIndex;
          const isPast     = i < activeIndex;
          const isFarPast  = i < activeIndex - 2;
          const isFarAhead = i > activeIndex + 3;

          return (
            <p
              key={i}
              onClick={() => seek(line.time)}
              className={`font-bold tracking-tight cursor-pointer leading-snug transition-all duration-400 select-text ${
                isActive
                  ? 'lyric-active-glow text-white text-2xl sm:text-3xl lg:text-[36px] scale-[1.03] origin-left'
                  : isFarPast
                  ? 'text-white/12 text-xl lg:text-[24px] hover:text-white/40'
                  : isPast
                  ? 'text-white/28 text-xl lg:text-[26px] hover:text-white/50'
                  : isFarAhead
                  ? 'text-white/12 text-xl lg:text-[24px] hover:text-white/40'
                  : 'text-white/32 text-xl lg:text-[26px] hover:text-white/60'
              }`}
              style={{ filter: isActive ? 'blur(0)' : isFarPast || isFarAhead ? 'blur(0.4px)' : 'blur(0)' }}
            >
              {line.text}
            </p>
          );
        })}
      </div>

      {/* Source badge */}
      <div className="absolute bottom-1 right-0 z-20">
        <span className="text-label-sm text-outline/50 uppercase tracking-wider">
          {lyricsSource === 'synced' ? '✦ Synced · lrclib'
            : lyricsSource === 'plain' ? '✦ Plain Lyrics'
            : '✦ Demo Lyrics'}
        </span>
      </div>
    </section>
  );
}
