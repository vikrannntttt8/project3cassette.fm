import { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SettingsModal({ isOpen, onClose }) {
  const { liked, playlists, history, syncAllWithCloud, audioQuality, setAudioQuality } = usePlayer();
  const {
    user,
    isConfigured,
    credentials,
    updateCredentials,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const [normalizeAudio, setNormalizeAudio] = useState(
    () => localStorage.getItem('pulse_normalize_audio') !== 'false'
  );
  const [supabaseUrl, setSupabaseUrl] = useState(credentials.url || '');
  const [supabaseKey, setSupabaseKey] = useState(credentials.anonKey || '');
  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // { type: 'success' | 'error', text: string }
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSupabaseUrl(credentials.url || '');
      setSupabaseKey(credentials.anonKey || '');
      setAuthError(null);
      setSyncStatus(null);
    }
  }, [isOpen, credentials]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleQualityChange = (val) => {
    setAudioQuality(val);
    localStorage.setItem('pulse_audio_quality', val);
  };

  const handleNormalizeToggle = () => {
    const next = !normalizeAudio;
    setNormalizeAudio(next);
    localStorage.setItem('pulse_normalize_audio', String(next));
  };

  const handleSaveSupabaseConfig = (e) => {
    e.preventDefault();
    updateCredentials(supabaseUrl, supabaseKey);
    setSyncStatus({ type: 'success', text: 'Supabase settings updated successfully.' });
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (err) {
      console.error('[Google Sign-In] Error:', err);
      setAuthError(err.message || 'Failed to initialize Google sign-in. Please ensure Supabase URL & Key are set.');
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      console.log('[SettingsModal] Triggering manual sync...');
      const result = await syncAllWithCloud();
      const likedCount = result?.stats?.likedCount ?? liked?.length ?? 0;
      const plCount = result?.stats?.playlistsCount ?? playlists?.length ?? 0;
      setSyncStatus({
        type: 'success',
        text: `Successfully synced ${likedCount} liked tracks, ${plCount} custom playlists, and playback history to Supabase Cloud.`,
      });
      setTimeout(() => setSyncStatus(null), 6000);
    } catch (err) {
      console.error('[Supabase Sync Error]:', err);
      setSyncStatus({
        type: 'error',
        text: `Sync failed: ${err.message || 'Database error occurred. Ensure schema tables are created in Supabase.'}`,
      });
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className="w-full max-w-2xl bg-[#0a0a0a] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-white">tune</span>
            <h2 className="text-headline-sm font-bold text-white tracking-tight">
              Settings & Cloud Sync
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#333333] hover:border-white text-[#888888] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 no-scrollbar">
          {/* ── 1. Google OAuth & Cloud Sync ─────────────────────── */}
          <section className="rounded-xl border border-[#222222] bg-[#111111] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#888888] font-mono">
                  Cloud Account & Sync
                </p>
                <h3 className="text-headline-sm font-semibold text-white mt-0.5">
                  {user ? 'Google Account Connected' : 'Sync with Google'}
                </h3>
                <p className="text-body-sm text-[#888888] mt-1 max-w-md">
                  {user
                    ? 'Your playlists, liked songs, and listening history are backed up and synced via Supabase Cloud.'
                    : 'Sign in with your Google account to automatically back up your library across all devices with 1-click.'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border border-[#333333] flex items-center justify-center bg-black flex-shrink-0">
                <span className="material-symbols-outlined text-white text-[20px]">
                  {user ? 'verified_user' : 'cloud_sync'}
                </span>
              </div>
            </div>

            {authError && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-body-sm">
                {authError}
              </div>
            )}

            {syncStatus && (
              <div
                className={`mt-4 p-3 rounded-lg text-body-sm font-medium flex items-center gap-2.5 ${
                  syncStatus.type === 'error'
                    ? 'bg-red-950/50 border border-red-800 text-red-300'
                    : 'bg-white/5 border border-white/20 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">
                  {syncStatus.type === 'error' ? 'error' : 'check_circle'}
                </span>
                <span>{typeof syncStatus === 'string' ? syncStatus : syncStatus.text}</span>
              </div>
            )}

            {/* Signed-in User Profile */}
            {user ? (
              <div className="mt-5 pt-4 border-t border-[#222222] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                    <img
                      src={user.user_metadata.avatar_url || user.user_metadata.picture}
                      alt="User avatar"
                      className="w-10 h-10 rounded-full border border-white/20 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center">
                      {(user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-label-md font-bold text-white">
                      {user.user_metadata?.full_name || user.user_metadata?.name || 'cassette.fm Listener'}
                    </p>
                    <p className="text-body-xs font-mono text-[#888888]">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualSync}
                    disabled={syncLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-white text-black text-label-sm font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${syncLoading ? 'animate-spin' : ''}`}>
                      sync
                    </span>
                    {syncLoading ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={signOut}
                    className="px-3 py-1.5 rounded-lg border border-[#333333] hover:border-white text-[#888888] hover:text-white text-label-sm transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              /* Google Sign-in CTA */
              <div className="mt-5 pt-4 border-t border-[#222222] flex flex-col gap-3">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-label-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  Sign in with Google
                </button>

                {/* Collapsible Supabase Project Config (for advanced custom setup) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigDetails(!showConfigDetails)}
                    className="text-[12px] text-[#666666] hover:text-[#999999] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {showConfigDetails ? 'expand_less' : 'settings'}
                    </span>
                    {showConfigDetails ? 'Hide Cloud Config' : 'Configure Custom Supabase Project'}
                  </button>

                  {showConfigDetails && (
                    <form onSubmit={handleSaveSupabaseConfig} className="mt-3 space-y-3 p-4 rounded-lg bg-black border border-[#222222]">
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-[#888888] mb-1">
                          Supabase Project URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://xyzcompany.supabase.co"
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#333333] text-white text-body-sm focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-[#888888] mb-1">
                          Supabase Anon Key
                        </label>
                        <input
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={supabaseKey}
                          onChange={(e) => setSupabaseKey(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#333333] text-white text-body-sm focus:border-white focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-lg bg-white text-black text-label-sm font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Save Cloud Credentials
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ── 2. Audio & Streaming Quality ────────────────────────── */}
          <section className="rounded-xl border border-[#222222] bg-[#111111] p-5 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#888888] font-mono">
                Audio Engine
              </p>
              <h3 className="text-headline-sm font-semibold text-white mt-0.5">
                Stream Fidelity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'max', label: 'Maximum', detail: '256kbps OPUS High-Res' },
                { id: 'high', label: 'High', detail: '160kbps OPUS Balanced' },
                { id: 'medium', label: 'Medium', detail: '128kbps AAC Data-Saver' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleQualityChange(q.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    audioQuality === q.id
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-black border-[#2a2a2a] text-[#888888] hover:border-[#555555] hover:text-white'
                  }`}
                >
                  <p className="text-label-md font-bold">{q.label}</p>
                  <p className="text-body-xs opacity-75 mt-0.5">{q.detail}</p>
                </button>
              ))}
            </div>

            {/* Audio Normalization toggle */}
            <div className="pt-3 border-t border-[#222222] flex items-center justify-between">
              <div>
                <p className="text-label-md font-semibold text-white">Normalize Volume</p>
                <p className="text-body-xs text-[#888888]">
                  Prevent sudden volume spikes between different tracks
                </p>
              </div>
              <button
                onClick={handleNormalizeToggle}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  normalizeAudio ? 'bg-white' : 'bg-[#333333]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                    normalizeAudio ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* ── 3. Library & Cache Stats ────────────────────────────── */}
          <section className="rounded-xl border border-[#222222] bg-[#111111] p-5 space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-[#888888] font-mono">
              Local Library
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-black border border-[#222222]">
                <span className="text-[11px] text-[#666666] font-mono block">LIKED TRACKS</span>
                <span className="text-headline-sm font-bold text-white">{liked?.length || 0}</span>
              </div>
              <div className="p-3 rounded-lg bg-black border border-[#222222]">
                <span className="text-[11px] text-[#666666] font-mono block">CUSTOM PLAYLISTS</span>
                <span className="text-headline-sm font-bold text-white">{playlists?.length || 0}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#1a1a1a] flex items-center justify-between text-body-xs text-[#666666]">
          <span>cassette.fm · YouTube Music Engine + Supabase Cloud</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white text-black text-label-sm font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
