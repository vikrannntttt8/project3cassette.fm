import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * MobileHeader — Fixed branded top bar for mobile (md:hidden).
 * Sits flush with mobile status bar (pt-safe pb-1.5) with zero dead space.
 */
export default function MobileHeader({ onSearchClick }) {
  const { setView, setIsSettingsOpen } = usePlayer();
  const { user, openAuthModal } = useAuth();

  const getInitials = (name, mail) => {
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (mail) return mail.slice(0, 2).toUpperCase();
    return 'CF';
  };

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 bg-[#0e0e0e]/95 backdrop-blur-2xl border-b border-white/10 select-none"
      style={{
        paddingTop: 'var(--safe-top, 0px)',
        height: 'calc(var(--mobile-header-h, 48px) + var(--safe-top, 0px))',
      }}
      aria-label="cassette.fm mobile header"
    >
      {/* Brand logo — left aligned */}
      <button
        onClick={() => setView('home')}
        className="flex items-center gap-1.5 cursor-pointer group py-0.5"
        aria-label="Go to Home"
      >
        <span className="font-cassette text-[22px] text-white tracking-tight leading-none group-hover:text-accent transition-colors">
          cassette.fm
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
      </button>

      {/* Right actions: Search + Account + Settings */}
      <div className="flex items-center gap-2">
        {/* Search toggle */}
        <button
          onClick={onSearchClick}
          className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-white bg-[#18181a] border border-white/5 active:scale-95 transition-all cursor-pointer"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>

        {/* Account / Profile / Sign In */}
        <button
          onClick={() => openAuthModal(user ? 'profile' : 'signin')}
          className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-white bg-[#18181a] border border-white/5 active:scale-95 transition-all cursor-pointer overflow-hidden"
          aria-label={user ? 'Account profile' : 'Sign in'}
          title={user ? `${user.user_metadata?.full_name || user.email} (Connected)` : 'Sign in to cassette.fm'}
        >
          {user ? (
            user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
              <img
                src={user.user_metadata.avatar_url || user.user_metadata.picture}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] font-bold text-accent">
                {getInitials(user.user_metadata?.full_name || user.user_metadata?.name, user.email)}
              </span>
            )
          ) : (
            <span className="material-symbols-outlined text-[19px]">account_circle</span>
          )}
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
