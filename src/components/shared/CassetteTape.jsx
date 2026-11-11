import { useMemo } from 'react';
import { cleanTrackTitle } from '../../utils/titleCleaner.js';

/**
 * CassetteTape — Authentic Retro Analog Audio Cassette Component
 * Features:
 * - Dual spinning 6-toothed reels when music is playing
 * - Dynamic magnetic tape roll thickness (shrinks on left, grows on right based on playback progress)
 * - 3-digit mechanical tape counter synchronized with currentTime
 * - Realistic cassette details: screw holes, magnetic head window, tape leader ribbon, vintage label
 */
export default function CassetteTape({
  song,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  className = '',
  onClick = null,
}) {
  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(1, Math.max(0, currentTime / duration));
  }, [currentTime, duration]);

  // Tape roll radiuses in pixels (left reel shrinks from 46px to 22px, right reel grows from 22px to 46px)
  const leftTapeRadius = 46 - progress * 24;
  const rightTapeRadius = 22 + progress * 24;

  // Mechanical tape counter (000 - 999)
  const counterValue = useMemo(() => {
    const ticks = Math.floor(currentTime * 1.5) % 1000;
    return String(ticks).padStart(3, '0');
  }, [currentTime]);

  const title = song?.title ? cleanTrackTitle(song.title, song.artist) : 'CASSETTE TAPE';
  const artist = song?.artist || 'ANALOG STEREO';

  return (
    <div
      onClick={onClick}
      className={`relative select-none aspect-[1.58/1] w-full max-w-[340px] sm:max-w-[380px] rounded-2xl bg-[#17171a] border-2 border-[#2b2b30] p-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.03)] cursor-pointer group transition-transform duration-300 active:scale-[0.99] ${className}`}
      style={{
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 20px 40px rgba(0,0,0,0.8)',
      }}
    >
      {/* 4 Corner Screws */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-neutral-600 border border-neutral-800 flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-neutral-400 rotate-45" />
      </div>
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neutral-600 border border-neutral-800 flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-neutral-400 -rotate-12" />
      </div>
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-neutral-600 border border-neutral-800 flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-neutral-400 rotate-90" />
      </div>
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-neutral-600 border border-neutral-800 flex items-center justify-center">
        <div className="w-1.5 h-0.5 bg-neutral-400 rotate-180" />
      </div>

      {/* Main Paper Label Area */}
      <div className="relative w-full h-full rounded-xl bg-[#e3ded4] overflow-hidden flex flex-col justify-between p-2.5 shadow-inner border border-[#c4beaf]">
        
        {/* Top Label Header */}
        <div className="flex items-center justify-between border-b-2 border-neutral-900/80 pb-1 px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] font-black tracking-widest text-neutral-900 bg-neutral-900/10 px-1.5 py-0.5 rounded">
              SIDE A
            </span>
            <span className="text-[8.5px] font-bold text-neutral-600 tracking-wider">
              C-90 HIGH BIAS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[8px] tracking-tight font-extrabold text-neutral-800">
              DOLBY B-NR
            </span>
            <span className="w-2.5 h-2.5 rounded-full border border-neutral-700 bg-neutral-900/20" />
          </div>
        </div>

        {/* Track Title & Artist Band */}
        <div className="px-2 pt-1">
          <p className="font-mono text-xs font-bold text-neutral-900 truncate tracking-tight uppercase">
            {title}
          </p>
          <p className="font-mono text-[10px] text-neutral-600 truncate uppercase">
            {artist}
          </p>
        </div>

        {/* Center Tape Window Area */}
        <div className="relative my-auto w-[82%] mx-auto h-[48%] rounded-lg bg-[#0e0e10] border-2 border-neutral-700/80 overflow-hidden flex items-center justify-between px-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]">
          
          {/* Background Ruler / Tape Scale markings */}
          <div className="absolute inset-x-0 top-1.5 flex justify-center gap-2 text-[7px] font-mono text-neutral-500/80 pointer-events-none">
            <span>100</span>
            <span>50</span>
            <span className="text-white font-bold">0</span>
            <span>50</span>
            <span>100</span>
          </div>

          {/* Left Spool (Supply Reel) */}
          <div className="relative z-10 flex items-center justify-center">
            {/* Magnetic Tape Roll on Left */}
            <div
              className="absolute rounded-full bg-[#4a2e18] border border-[#2d1b0d] shadow-sm transition-all duration-300"
              style={{
                width: `${leftTapeRadius * 2}px`,
                height: `${leftTapeRadius * 2}px`,
              }}
            />

            {/* Rotating White Gear Hub */}
            <div
              className={`relative w-10 h-10 rounded-full bg-[#efeee9] border-2 border-neutral-400 flex items-center justify-center shadow-inner ${
                isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
              }`}
            >
              {/* 6 Teeth / Spokes */}
              <div className="absolute w-7 h-1.5 bg-neutral-700 rounded-sm" />
              <div className="absolute w-7 h-1.5 bg-neutral-700 rounded-sm rotate-60" />
              <div className="absolute w-7 h-1.5 bg-neutral-700 rounded-sm rotate-120" />
              <div className="relative w-4 h-4 rounded-full bg-[#0e0e10] border border-neutral-400" />
            </div>
          </div>

          {/* Center Inspection Glass & Mechanical Counter */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* 3-Digit Counter Box */}
            <div className="px-1.5 py-0.5 rounded bg-black border border-neutral-600 shadow-inner flex items-center gap-0.5 mb-1">
              <span className="font-mono text-[9px] font-bold text-white tracking-widest">
                {counterValue}
              </span>
            </div>

            {/* Clear Viewing Window Slit */}
            <div className="w-12 h-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-xs" />
          </div>

          {/* Right Spool (Take-Up Reel) */}
          <div className="relative z-10 flex items-center justify-center">
            {/* Magnetic Tape Roll on Right */}
            <div
              className="absolute rounded-full bg-[#4a2e18] border border-[#2d1b0d] shadow-sm transition-all duration-300"
              style={{
                width: `${rightTapeRadius * 2}px`,
                height: `${rightTapeRadius * 2}px`,
              }}
            />

            {/* Rotating White Gear Hub */}
            <div
              className={`relative w-10 h-10 rounded-full bg-[#efeee9] border-2 border-neutral-400 flex items-center justify-center shadow-inner ${
                isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
              }`}
            >
              {/* 6 Teeth / Spokes */}
              <div className="absolute w-7 h-1.5 bg-neutral-700 rounded-sm" />
              <div className="absolute w-7 h-1.5 bg-neutral-700 rounded-sm rotate-60" />
              <div className="absolute w-7 h-1.5 bg-neutral-700 rounded-sm rotate-120" />
              <div className="relative w-4 h-4 rounded-full bg-[#0e0e10] border border-neutral-400" />
            </div>
          </div>
        </div>

        {/* Bottom Vintage Stripe & Cassette Brand */}
        <div className="flex items-center justify-between border-t border-neutral-400/60 pt-1 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-red-600 rounded-xs" />
            <span className="w-3 h-1 bg-orange-500 rounded-xs" />
            <span className="w-3 h-1 bg-amber-400 rounded-xs" />
            <span className="text-[8.5px] font-black text-neutral-800 tracking-wider font-mono ml-1">
              CASSETTE.FM
            </span>
          </div>

          <span className="font-mono text-[8px] font-bold text-neutral-600">
            COMPACT CASSETTE
          </span>
        </div>
      </div>

      {/* Trapezoidal Bottom Inset with Magnetic Tape Path */}
      <div className="absolute bottom-1 inset-x-8 h-2.5 bg-[#111113] rounded-t-sm border-t border-[#333338] flex items-center justify-around px-4">
        <div className="w-2 h-1 bg-neutral-800 rounded-full" />
        <div className="w-3 h-1 bg-[#4a2e18] rounded-full" />
        <div className="w-2 h-1 bg-neutral-800 rounded-full" />
      </div>
    </div>
  );
}
