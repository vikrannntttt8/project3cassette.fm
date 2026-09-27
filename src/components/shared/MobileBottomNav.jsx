import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * MobileBottomNav — 4-tab clean fixed bottom nav for mobile (md:hidden).
 * ArchiveTune aesthetic with dynamic accent active states & charcoal background.
 */
export default function MobileBottomNav() {
  const { view, setView, isSettingsOpen, setIsSettingsOpen } = usePlayer();
  const { user, openAuthModal, isAuthModalOpen } = useAuth();

  const tabs = [
    {
      icon: 'home',
      label: 'Home',
      action: () => {
        setIsSettingsOpen(false);
        setView('home');
      },
      isActive: view === 'home' && !isSettingsOpen && !isAuthModalOpen,
    },
    {
      icon: 'local_library',
      label: 'Library',
      action: () => {
        setIsSettingsOpen(false);
        setView('library');
      },
      isActive: (view === 'library' || view === 'liked') && !isSettingsOpen && !isAuthModalOpen,
    },
    {
      icon: 'tune',
      label: 'Settings',
      action: () => setIsSettingsOpen(true),
      isActive: isSettingsOpen && !isAuthModalOpen,
    },
    {
      icon: user ? 'account_circle' : 'person',
      label: user ? 'Account' : 'Sign In',
      action: () => openAuthModal(user ? 'profile' : 'signin'),
      isActive: isAuthModalOpen,
    },
  ];

  return (
    <nav
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e0e]/97 backdrop-blur-2xl border-t border-white/10 select-none"
      style={{ paddingBottom: 'var(--safe-bottom, 12px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around max-w-md mx-auto" style={{ height: 'var(--mobile-nav-h, 56px)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={tab.action}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150 cursor-pointer ${
              tab.isActive ? 'text-accent font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            aria-label={tab.label}
            aria-current={tab.isActive ? 'page' : undefined}
            style={{ minHeight: '44px' }}
          >
            {/* Active top indicator pill */}
            {tab.isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-accent" />
            )}

            <span
              className="material-symbols-outlined text-[24px] leading-none relative"
              style={{ fontVariationSettings: tab.isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>

            <span className={`text-[10.5px] font-semibold leading-none mt-0.5 ${tab.isActive ? 'text-accent' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
