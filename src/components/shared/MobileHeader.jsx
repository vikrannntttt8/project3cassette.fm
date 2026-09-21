import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * MobileHeader — Fixed 56px branded top bar for mobile (md:hidden).
 * Contains: cassette.fm logo (left), search icon + settings icon (right).
 * Replaces the bare top spacing and gives the app a branded identity on phones.
 */
export default function MobileHeader({ onSearchClick }) {
  const { setView, setIsSettingsOpen, view } = usePlayer();

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 bg-black/95 backdrop-blur-xl border-b border-[#1a1a1a] select-none"
      style={{ height: 'var(--mobile-header-h, 56px)' }}
      aria-label="cassette.fm mobile header"
    >
      {/* Brand logo — left aligned */}
      <button
        onClick={() => setView('home')}
        className="flex items-center cursor-pointer group"
        aria-label="Go to Home"
      >
        <span className="font-cassette text-[22px] text-white tracking-tight leading-none group-hover:opacity-80 transition-opacity">
          cassette.fm
        </span>
      </button>

      {/* Right actions: Search + Settings */}
      <div className="flex items-center gap-1">
        {/* Search toggle */}
        <button
          onClick={onSearchClick}
          className="w-10 h-10 flex items-center justify-center rounded-full text-[#888888] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[22px]">search</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-[#888888] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>
      </div>
    </header>
  );
}
