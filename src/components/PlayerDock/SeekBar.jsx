import { formatTime } from '../../utils/timeFormat.js';

export default function SeekBar({ currentTime, duration, onSeek }) {
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-10 text-right tabular-nums font-mono font-bold">
        {formatTime(currentTime)}
      </span>

      {/* Track bar */}
      <div className="relative flex-1 h-2 group cursor-pointer">
        {/* Background track with border */}
        <div className="absolute inset-0 bg-zinc-800 border border-black rounded-sm overflow-hidden">
          {/* Fill gradient */}
          <div
            className="h-full bg-gradient-to-r from-[#CCFF00] via-[#FFE600] to-[#00F0FF] rounded-none transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Range input overlay */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.25}
          value={currentTime}
          onChange={e => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-black rounded-sm shadow-neo-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `calc(${progress}% - 7px)` }}
        />
      </div>

      <span className="text-xs text-zinc-400 w-10 tabular-nums font-mono font-bold">
        {formatTime(duration)}
      </span>
    </div>
  );
}
