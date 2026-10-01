import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

/**
 * MobileBottomNav — 5-item YouTube Music & SimpMusic inspired mobile navigation bar.
 * Clean, evenly spaced layout with dedicated Home, Radio, Explore, Library, and Settings tabs.
 */
export default function MobileBottomNav({ onOpenSearch }) {
  const {
    view,
    setView,
    isSettingsOpen,
    openSettings,
    closeSettings,
    currentSong,
    startRadio,
    activeChip,
    setActiveChip,
    openMobileSearch,
  } = usePlayer();
  const { isAuthModalOpen } = useAuth();
  const { navVisibility = { home: true, radio: true, explore: true, library: true, settings: true } } = useSettings();

  const handleRadioClick = () => {
    if (isSettingsOpen) closeSettings();
    if (currentSong) {
      startRadio(currentSong);
    } else {
      setView('home');
      if (typeof setActiveChip === 'function') {
        setActiveChip('mixes');
      }
    }
  };

  const handleExploreClick = () => {
    if (isSettingsOpen) closeSettings();
    if (typeof onOpenSearch === 'function') {
      onOpenSearch();
    } else {
      openMobileSearch();
    }
  };

  const allTabs = [
    {
      id: 'home',
      icon: 'home',
      label: 'Home',
      action: () => {
        if (isSettingsOpen) closeSettings();
        setView('home');
        if (typeof setActiveChip === 'function') setActiveChip('all');
      },
      isActive: view === 'home' && !isSettingsOpen && !isAuthModalOpen && (activeChip === 'all' || !activeChip),
    },
    {
      id: 'radio',
      icon: 'radio',
      label: 'Radio',
      action: handleRadioClick,
      isActive: activeChip === 'mixes' && view === 'home' && !isSettingsOpen && !isAuthModalOpen,
    },
    {
      id: 'explore',
      icon: 'explore',
      label: 'Explore',
      action: handleExploreClick,
      isActive: false,
    },
    {
      id: 'library',
      icon: 'library_music',
      label: 'Library',
      action: () => {
        if (isSettingsOpen) closeSettings();
        setView('library');
      },
      isActive: (view === 'library' || view === 'liked') && !isSettingsOpen && !isAuthModalOpen,
    },
    {
      id: 'settings',
      icon: 'tune',
      label: 'Settings',
      action: () => (isSettingsOpen ? closeSettings() : openSettings()),
      isActive: isSettingsOpen && !isAuthModalOpen,
    },
  ];

  const visibleTabs = allTabs.filter(tab => navVisibility[tab.id] !== false);

  return (
    <nav
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0e]/96 backdrop-blur-2xl border-t border-white/10 select-none shadow-[0_-8px_24px_rgba(0,0,0,0.7)]"
      style={{ paddingBottom: 'var(--safe-bottom, 12px)' }}
      aria-label="Mobile navigation"
    >
      <div
        className="grid items-stretch max-w-lg mx-auto"
        style={{
          height: 'var(--mobile-nav-h, 58px)',
          gridTemplateColumns: `repeat(${visibleTabs.length || 1}, minmax(0, 1fr))`,
        }}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={tab.action}
            className={`flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200 cursor-pointer active:scale-95 ${
              tab.isActive ? 'text-accent font-bold' : 'text-neutral-400 hover:text-white'
            }`}
            aria-label={tab.label}
            aria-current={tab.isActive ? 'page' : undefined}
            style={{ minHeight: '48px' }}
          >
            {/* Active top indicator pill */}
            {tab.isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] rounded-full bg-accent shadow-sm" />
            )}

            <span
              className="material-symbols-outlined text-[22px] leading-none transition-transform"
              style={{ fontVariationSettings: tab.isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>

            <span className={`text-[10px] tracking-tight leading-none mt-0.5 ${tab.isActive ? 'text-accent font-semibold' : 'text-neutral-400 font-medium'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
