import { useRef, useEffect, useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useLrcSync } from '../../hooks/useLrcSync.js';

export default function LyricsPanel() {
  const {
    lrcString,
    lyricsSource,
    lyricsLoading,
    currentTime,
    seek,
    currentSong,
    fetchLyricsForSong,
  } = usePlayer();

  const containerRef = useRef(null);
  const { lines, activeIndex } = useLrcSync(lrcString, currentTime);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // Detect manual user scrolling to temporarily pause auto-scroll for 3.5s
  const handleScroll = () => {
    setUserIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrolling(false);
    }, 3500);
  };

  // Auto-scroll active line to center when not actively dragged by user
  useEffect(() => {
    if (!containerRef.current || activeIndex < 0 || userIsScrolling) return;
    const el = containerRef.current.children[activeIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, userIsScrolling]);

  if (lyricsLoading) {
    return (
      <section className="lg:col-span-7 flex flex-col items-center justify-center gap-3 h-full min-h-[300px]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-400 text-body-md font-medium">Fetching time-synced lyrics…</p>
      </section>
    );
  }

  if (!lines.length) {
    return (
      <section className="lg:col-span-7 flex flex-col items-center justify-center gap-3 h-full min-h-[300px] text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-500">
          <span className="material-symbols-outlined text-[28px]">lyrics</span>
        </div>
        <p className="text-neutral-200 text-body-lg font-semibold">No lyrics available for this track</p>
        <p className="text-neutral-500 text-body-sm">{currentSong?.title}</p>
        {currentSong && (
          <button
            onClick={() => fetchLyricsForSong(currentSong)}
            className="mt-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-[12px] font-semibold transition-colors cursor-pointer"
          >
            Retry Fetch
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="lg:col-span-7 h-full flex flex-col justify-center overflow-hidden relative select-none">
      {/* Top & Bottom gradient fade masks */}
      <div className="absolute top-0 inset-x-0 h-16 sm:h-24 bg-gradient-to-b from-[#0e0e0e] to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-20 sm:h-28 bg-gradient-to-t from-[#0e0e0e] to-transparent pointer-events-none z-10" />

      {/* Lyrics scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto py-24 sm:py-28 space-y-6 sm:space-y-8 px-2 text-left no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {lines.map((line, i) => {
          const isActive = i === activeIndex;
          const isPast = activeIndex >= 0 && i < activeIndex;
          const isFarPast = activeIndex >= 0 && i < activeIndex - 2;
          const isFarAhead = activeIndex >= 0 && i > activeIndex + 3;

          return (
            <p
              key={i}
              onClick={() => {
                if (line.time >= 0) {
                  seek(line.time);
                  setUserIsScrolling(false);
                }
              }}
              className={`font-bold tracking-tight cursor-pointer leading-snug transition-all duration-300 select-text ${
                isActive
                  ? 'lyric-active-glow text-accent text-2xl sm:text-3xl lg:text-[34px] scale-[1.03] origin-left drop-shadow-md'
                  : isFarPast
                  ? 'text-white/15 text-lg sm:text-xl lg:text-[22px] hover:text-white/50'
                  : isPast
                  ? 'text-white/30 text-lg sm:text-xl lg:text-[24px] hover:text-white/60'
                  : isFarAhead
                  ? 'text-white/20 text-lg sm:text-xl lg:text-[22px] hover:text-white/50'
                  : 'text-white/40 text-lg sm:text-xl lg:text-[24px] hover:text-white/70'
              }`}
              style={{
                filter: isActive ? 'blur(0)' : isFarPast || isFarAhead ? 'blur(0.3px)' : 'blur(0)',
              }}
            >
              {line.text}
            </p>
          );
        })}
      </div>

      {/* Lyrics source attribution */}
      <div className="absolute bottom-2 right-2 z-20">
        <span className="uppercase tracking-widest text-[10px] text-neutral-600 font-mono bg-[#141416]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5">
          {lyricsSource === 'synced'
            ? '✦ Synced · lrclib'
            : lyricsSource === 'plain'
            ? '✦ Plain Lyrics'
            : '✦ Synchronized'}
        </span>
      </div>
    </section>
  );
}
