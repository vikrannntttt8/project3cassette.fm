import { formatTime } from '../../utils/timeFormat.js';

export default function SeekBar({ currentTime, duration, onSeek }) {
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full flex items-center gap-2.5 select-none">
      <span className="text-label-sm text-[#888888] min-w-[38px] text-right tabular-nums font-mono text-[12px]">
        {formatTime(currentTime)}
      </span>

      {/* Track bar — visual is slim but touch area is full 44px */}
      <div className="relative flex-1 min-h-[44px] group cursor-pointer flex items-center">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#262626] rounded-full overflow-hidden">
          {/* Fill pure white */}
          <div
            className="h-full bg-white rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Range input overlay (44px hit area, invisible) */}
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
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      <span className="text-label-sm text-[#888888] min-w-[38px] text-left tabular-nums font-mono text-[12px]">
        {formatTime(duration)}
      </span>
    </div>
  );
}
