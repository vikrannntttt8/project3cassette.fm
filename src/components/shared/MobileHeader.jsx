import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * MobileHeader — Fixed branded top bar for mobile (md:hidden).
 * Sits flush with mobile status bar (pt-safe pb-1.5) with zero dead space.
 */
export default function MobileHeader({ onSearchClick }) {
  const { setView, setIsSettingsOpen } = usePlayer();

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 bg-[#0e0e0e]/97 backdrop-blur-2xl border-b border-white/10 select-none pt-safe pb-1.5"
      aria-label="cassette.fm mobile header"
    >
      {/* Brand logo — left aligned */}
      <button
        onClick={() => setView('home')}
        className="flex items-center gap-1.5 cursor-pointer group py-1"
        aria-label="Go to Home"
      >
        <span className="font-cassette text-[24px] text-white tracking-tight leading-none group-hover:text-amber-400 transition-colors">
          cassette.fm
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      </button>

      {/* Right actions: Search + Settings */}
      <div className="flex items-center gap-1.5">
        {/* Search toggle */}
        <button
          onClick={onSearchClick}
          className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-white bg-[#18181a] border border-white/5 active:scale-95 transition-all cursor-pointer"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-white bg-[#18181a] border border-white/5 active:scale-95 transition-all cursor-pointer"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
      </div>
    </header>
  );
}
