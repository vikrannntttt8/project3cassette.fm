import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * MobileBottomNav — 4-tab fixed bottom nav for mobile (md:hidden).
 * Tabs: Home | Library | Liked | Settings
 * Settings tab opens the SettingsModal instead of changing view.
 */
export default function MobileBottomNav() {
  const { view, setView, liked, isSettingsOpen, setIsSettingsOpen } = usePlayer();

  const tabs = [
    { icon: 'home',          label: 'Home',     action: () => setView('home'),    isActive: view === 'home' && !isSettingsOpen },
    { icon: 'local_library', label: 'Library',  action: () => setView('library'), isActive: (view === 'library' || view === 'liked') && !isSettingsOpen },
    { icon: 'favorite',      label: 'Liked',    action: () => setView('liked'),   isActive: view === 'liked' && !isSettingsOpen, badge: liked.length },
    { icon: 'settings',      label: 'Settings', action: () => setIsSettingsOpen(true), isActive: isSettingsOpen },
  ];

  return (
    <nav
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/97 backdrop-blur-xl border-t border-[#1a1a1a] select-none"
      style={{ paddingBottom: 'var(--safe-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch" style={{ height: 'var(--mobile-nav-h, 56px)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={tab.action}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150 cursor-pointer ${
              tab.isActive ? 'text-white' : 'text-[#555555] hover:text-[#aaaaaa]'
            }`}
            aria-label={tab.label}
            aria-current={tab.isActive ? 'page' : undefined}
            style={{ minHeight: '44px' }}
          >
            {/* Active top indicator pill */}
            {tab.isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-white" />
            )}

            <span
              className="material-symbols-outlined text-[22px] leading-none relative"
              style={{ fontVariationSettings: tab.isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
              {/* Badge for liked count */}
              {tab.badge > 0 && !tab.isActive && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                  <span className="text-black font-bold" style={{ fontSize: '8px' }}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                </span>
              )}
            </span>

            <span className={`text-[10px] font-medium leading-none`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
