export default function VolumeSlider({ volume, onChange }) {
  const pct = Math.round(volume * 100);
  const icon = volume === 0 ? 'volume_off' : volume < 0.4 ? 'volume_down' : 'volume_up';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(volume > 0 ? 0 : 0.8)}
        className="neo-btn p-1 rounded-md bg-zinc-800 hover:bg-black text-zinc-300 hover:text-white border border-black transition-all"
        title={volume === 0 ? 'Unmute' : 'Mute'}
      >
        <span className="material-symbols-outlined text-[16px] block">{icon}</span>
      </button>

      <div className="relative w-20">
        <div className="w-full h-2 bg-zinc-800 border border-black rounded-sm overflow-hidden">
          <div
            className="h-full bg-[#00F0FF] transition-all duration-100"
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

      <span className="text-[10px] font-mono font-bold text-zinc-400 w-6 text-right">
        {pct}%
      </span>
    </div>
  );
}
