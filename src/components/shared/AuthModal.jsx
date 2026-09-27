import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';

export default function AuthModal() {
  const {
    user,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
  } = useAuth();

  const { liked, playlists, history, syncAllWithCloud } = usePlayer();

  const [tab, setTab] = useState(authModalMode || 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    if (authModalMode) {
      setTab(authModalMode);
    }
  }, [authModalMode]);

  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setPassword('');
    }
  }, [isAuthModalOpen]);

  // Escape key listener
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

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
      // Supabase OAuth redirects the browser
    } catch (err) {
      console.error('[OAuth Error]:', err);
      setErrorMsg(err.message || 'Google sign-in could not be initiated. Please verify Supabase config.');
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }

    if (tab === 'forgot') {
      try {
        setLoading(true);
        setErrorMsg(null);
        await resetPassword(email.trim());
        setSuccessMsg('Password reset link sent! Check your email inbox.');
      } catch (err) {
        setErrorMsg(err.message || 'Failed to send reset link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    if (tab === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters');
        return;
      }
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await signUpWithEmail(email, password, fullName);
        if (data?.session) {
          setSuccessMsg('Account created and logged in!');
          setTimeout(() => setIsAuthModalOpen(false), 1200);
        } else {
          setSuccessMsg('Account created! Please check your email to confirm your account, or sign in.');
          setTab('signin');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to create account.');
      } finally {
        setLoading(false);
      }
    } else {
      // Sign In
      try {
        setLoading(true);
        setErrorMsg(null);
        await signInWithEmail(email, password);
        setSuccessMsg('Signed in successfully! Syncing cloud library...');
        setTimeout(() => setIsAuthModalOpen(false), 1000);
      } catch (err) {
        setErrorMsg(err.message || 'Invalid email or password. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setSyncLoading(true);
    setErrorMsg(null);
    try {
      await syncAllWithCloud();
      setSuccessMsg('Cloud library synced successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSyncLoading(false);
    }
  };

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
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-[#141416] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5 bg-[#18181a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-[20px]">
                {user ? 'account_circle' : 'lock'}
              </span>
            </div>
            <div>
              <h3 className="text-label-lg font-bold text-white tracking-tight">
                {user ? 'Account Profile' : 'cassette.fm Account'}
              </h3>
              <p className="text-body-xs text-neutral-400">
                {user ? 'Manage cloud sync and preferences' : 'Sync your liked tracks and playlists'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* If user is already logged in -> Profile & Sync Hub */}
          {user ? (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-[#1c1c1f] border border-white/10 flex items-center gap-3.5">
                {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                  <img
                    src={user.user_metadata.avatar_url || user.user_metadata.picture}
                    alt=""
                    className="w-13 h-13 rounded-full object-cover border-2 border-amber-500/40 flex-shrink-0"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-black font-extrabold flex items-center justify-center text-lg flex-shrink-0 shadow-md">
                    {getInitials(user.user_metadata?.full_name || user.user_metadata?.name, user.email)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-label-md font-bold text-white truncate">
                    {user.user_metadata?.full_name || user.user_metadata?.name || 'cassette Listener'}
                  </h4>
                  <p className="text-body-xs text-neutral-400 font-mono truncate">{user.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud Sync Active
                  </span>
                </div>
              </div>

              {/* Sync Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-[#18181a] border border-white/5">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">Liked</span>
                  <span className="text-label-lg font-bold text-amber-400">{liked?.length || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#18181a] border border-white/5">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">Playlists</span>
                  <span className="text-label-lg font-bold text-white">{playlists?.length || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#18181a] border border-white/5">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">History</span>
                  <span className="text-label-lg font-bold text-amber-400">{history?.length || 0}</span>
                </div>
              </div>

              {/* Feedback messages */}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-body-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-body-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleManualSync}
                  disabled={syncLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-label-md flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] ${syncLoading ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  {syncLoading ? 'Synchronizing Cloud...' : 'Sync Cloud Library Now'}
                </button>

                <button
                  onClick={async () => {
                    await signOut();
                    setSuccessMsg('Signed out successfully.');
                    setTimeout(() => setIsAuthModalOpen(false), 800);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white text-label-sm font-semibold transition-all cursor-pointer"
                >
                  Sign Out of cassette.fm
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out -> Login / Sign Up Forms */
            <div className="space-y-4">
              {/* One-Click Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-white text-black hover:bg-neutral-100 font-bold text-label-md flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">or with email</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              {/* Tab Selector: Sign In vs Create Account */}
              {tab !== 'forgot' ? (
                <div className="grid grid-cols-2 p-1 rounded-xl bg-[#1c1c1f] border border-white/5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('signin');
                      setErrorMsg(null);
                    }}
                    className={`py-2 rounded-lg text-label-sm font-bold transition-all cursor-pointer ${
                      tab === 'signin'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('signup');
                      setErrorMsg(null);
                    }}
                    className={`py-2 rounded-lg text-label-sm font-bold transition-all cursor-pointer ${
                      tab === 'signup'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-label-md font-bold text-white">Reset Password</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('signin');
                      setErrorMsg(null);
                    }}
                    className="text-body-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}

              {/* Feedback messages */}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-body-xs flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-body-xs flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {errorMsg}
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {tab === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maya Lin"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1f] border border-white/10 text-white text-body-sm focus:border-amber-500 focus:outline-none transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1f] border border-white/10 text-white text-body-sm focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>

                {tab !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-mono uppercase text-neutral-400">
                        Password
                      </label>
                      {tab === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTab('forgot');
                            setErrorMsg(null);
                          }}
                          className="text-[11px] text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#1c1c1f] border border-white/10 text-white text-body-sm focus:border-amber-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-label-md flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  )}
                  {tab === 'signin' && 'Sign In'}
                  {tab === 'signup' && 'Create Free Account'}
                  {tab === 'forgot' && 'Send Reset Link'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
