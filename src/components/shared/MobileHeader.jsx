import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * MobileHeader — Fixed 56px branded top bar for mobile (md:hidden).
 * ArchiveTune aesthetic with warm charcoal background, amber accents, search & settings.
 */
export default function MobileHeader({ onSearchClick }) {
  const { setView, setIsSettingsOpen } = usePlayer();

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 bg-[#0e0e0e]/95 backdrop-blur-2xl border-b border-white/10 select-none pt-safe"
      style={{ height: 'var(--mobile-header-h, 56px)' }}
      aria-label="cassette.fm mobile header"
    >
      {/* Brand logo — left aligned */}
      <button
        onClick={() => setView('home')}
        className="flex items-center gap-1.5 cursor-pointer group"
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
          className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-white bg-[#18181a] border border-white/5 active:scale-95 transition-all cursor-pointer"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[21px]">search</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-white bg-[#18181a] border border-white/5 active:scale-95 transition-all cursor-pointer"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[21px]">settings</span>
        </button>
      </div>
    </header>
  );
}
