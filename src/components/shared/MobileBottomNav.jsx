import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * MobileBottomNav — 4-tab fixed bottom nav for mobile (md:hidden).
 * ArchiveTune aesthetic with warm amber active states & charcoal background.
 */
export default function MobileBottomNav() {
  const { view, setView, liked, isSettingsOpen, setIsSettingsOpen } = usePlayer();

  const tabs = [
    { icon: 'home',          label: 'Home',     action: () => setView('home'),    isActive: view === 'home' && !isSettingsOpen },
    { icon: 'local_library', label: 'Library',  action: () => setView('library'), isActive: (view === 'library' || view === 'liked') && !isSettingsOpen },
    { icon: 'favorite',      label: 'Liked',    action: () => setView('liked'),   isActive: view === 'liked' && !isSettingsOpen, badge: liked.length },
    { icon: 'tune',          label: 'Settings', action: () => setIsSettingsOpen(true), isActive: isSettingsOpen },
  ];

  return (
    <nav
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e0e]/97 backdrop-blur-2xl border-t border-white/10 select-none"
      style={{ paddingBottom: 'var(--safe-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch" style={{ height: 'var(--mobile-nav-h, 56px)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={tab.action}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150 cursor-pointer ${
              tab.isActive ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            aria-label={tab.label}
            aria-current={tab.isActive ? 'page' : undefined}
            style={{ minHeight: '44px' }}
          >
            {/* Active top indicator pill in amber */}
            {tab.isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            )}

            <span
              className="material-symbols-outlined text-[23px] leading-none relative"
              style={{ fontVariationSettings: tab.isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
              {/* Badge for liked count */}
              {tab.badge > 0 && !tab.isActive && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-black font-extrabold" style={{ fontSize: '8px' }}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                </span>
              )}
            </span>

            <span className={`text-[10px] font-semibold leading-none mt-0.5 ${tab.isActive ? 'text-amber-400' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
