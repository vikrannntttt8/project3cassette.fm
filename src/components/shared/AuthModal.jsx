import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AuthModal() {
  const {
    user,
    isAuthModalOpen,
    setIsAuthModalOpen,
    signInWithGoogle,
    signOut,
    isNative,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [manualCookie, setManualCookie] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMsg(null);
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsAuthModalOpen(false);
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!isNative && !manualCookie.trim()) {
        setShowManualInput(true);
        setLoading(false);
        return;
      }
      await signInWithGoogle(manualCookie.trim() || null);
    } catch (err) {
      console.error('[YouTube Auth Error]:', err);
      setErrorMsg(err.message || 'Failed to complete Google sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      setIsAuthModalOpen(false);
    } catch (err) {
      setErrorMsg('Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#141416] border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {user ? (
          /* ── LOGGED IN PROFILE VIEW ────────────────────────── */
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-lg mb-4 bg-neutral-800">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#141416]" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
            <p className="text-xs text-neutral-400 mb-4">{user.handle || 'Connected to YouTube Music'}</p>

            <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 mb-6 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">sync</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">2-Way Sync Active</p>
                <p className="text-[11px] text-neutral-400">Likes and library sync directly with your YouTube account.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Signing out...' : 'Disconnect YouTube Account'}
            </button>
          </div>
        ) : (
          /* ── SIGN IN VIEW ──────────────────────────────────── */
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[22px]">play_circle</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">YouTube Music Sync</h3>
                <p className="text-xs text-neutral-400">Two-way Google account connection</p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 mb-5 leading-relaxed">
              Sign in with your Google account to unlock full two-way synchronization with YouTube Music.
            </p>

            {/* Feature List */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">favorite</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Two-Way Likes</h4>
                  <p className="text-[11px] text-neutral-400">Tracks liked here automatically sync to your YouTube &quot;Liked Music&quot;.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Personalized Algorithms</h4>
                  <p className="text-[11px] text-neutral-400">Loads your real &quot;Listen Again&quot;, &quot;Quick Picks&quot;, and mixes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">queue_music</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Cloud Playlists & Library</h4>
                  <p className="text-[11px] text-neutral-400">Access and edit your official YouTube playlists seamlessly.</p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-3 hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* Desktop Web Dev Session Injection */}
            {!isNative && (
              <div className="mt-4 pt-3 border-t border-white/5 text-center">
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-400 underline cursor-pointer"
                >
                  {showManualInput ? 'Hide manual cookie injection' : 'Web Dev: Paste YouTube Session Cookie'}
                </button>

                {showManualInput && (
                  <div className="mt-3 text-left">
                    <p className="text-[11px] text-neutral-400 mb-1.5">
                      On Android, login is automated via In-App WebView. For desktop browser testing, paste your YouTube cookie string:
                    </p>
                    <textarea
                      rows={3}
                      value={manualCookie}
                      onChange={(e) => setManualCookie(e.target.value)}
                      placeholder="SAPISID=...; __Secure-3PAPISID=...;"
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="button"
                      onClick={handleSignIn}
                      disabled={loading || !manualCookie.trim()}
                      className="mt-2 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Save & Sync YouTube Session
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
