export default function VolumeSlider({ volume, onChange }) {
  const pct = Math.round(volume * 100);
  const icon = volume === 0 ? 'volume_off' : volume < 0.4 ? 'volume_down' : 'volume_up';

  return (
    <div className="flex items-center gap-1.5 group">
      <button
        onClick={() => onChange(volume > 0 ? 0 : 0.8)}
        className="text-[#888888] hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </button>

      <div className="relative w-20">
        <div className="w-full h-[3px] bg-[#262626] rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={volume}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="volume-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
