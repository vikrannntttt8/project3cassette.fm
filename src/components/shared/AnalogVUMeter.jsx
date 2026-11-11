import { useState, useEffect } from 'react';

/**
 * AnalogVUMeter — Retro LED audio bar visualizer
 * Animates subtly when isPlaying is true.
 */
export default function AnalogVUMeter({ isPlaying = false, className = '' }) {
  const [levels, setLevels] = useState([2, 3, 4, 3, 2]);

  useEffect(() => {
    if (!isPlaying) {
      setLevels([1, 1, 1, 1, 1]);
      return;
    }

    const interval = setInterval(() => {
      setLevels([
        Math.floor(Math.random() * 4) + 1,
        Math.floor(Math.random() * 5) + 2,
        Math.floor(Math.random() * 6) + 2,
        Math.floor(Math.random() * 5) + 1,
        Math.floor(Math.random() * 4) + 1,
      ]);
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={`flex items-end gap-1 h-5 px-2 py-1 rounded bg-black/40 border border-white/5 select-none ${className}`}>
      {levels.map((lvl, i) => (
        <div key={i} className="flex flex-col-reverse gap-0.5 w-1 h-full justify-start">
          {[...Array(6)].map((_, step) => {
            const active = step < lvl;
            let color = 'bg-emerald-500/30';
            if (active) {
              if (step >= 5) color = 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]';
              else if (step >= 4) color = 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)]';
              else color = 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]';
            }
            return (
              <div
                key={step}
                className={`w-full h-0.5 rounded-xs transition-colors duration-75 ${color}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
