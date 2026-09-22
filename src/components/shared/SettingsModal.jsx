import { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SettingsModal({ isOpen, onClose }) {
  const {
    liked,
    playlists,
    history,
    syncAllWithCloud,
    audioQuality,
    setAudioQuality,
    activeStreamMeta,
  } = usePlayer();

  const {
    user,
    credentials,
    updateCredentials,
    signInWithGoogle,
    signOut,
  } = useAuth();

  // ── Active category tab (desktop sidebar / mobile accordion) ────────
  const [activeCategory, setActiveCategory] = useState('account');

  // ── Settings Local States ──────────────────────────────────────────
  const [normalizeAudio, setNormalizeAudio] = useState(
    () => localStorage.getItem('pulse_normalize_audio') !== 'false'
  );
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem('pulse_accent_color') || 'amber'
  );
  const [ambientGlow, setAmbientGlow] = useState(
    () => localStorage.getItem('pulse_ambient_glow') !== 'false'
  );
  const [crossfadeDuration, setCrossfadeDuration] = useState(
    () => Number(localStorage.getItem('pulse_crossfade')) || 0
  );
  const [canvasBg, setCanvasBg] = useState(
    () => localStorage.getItem('pulse_canvas_bg') !== 'false'
  );
  const [lyricFontSize, setLyricFontSize] = useState(
    () => localStorage.getItem('pulse_lyric_size') || 'normal'
  );
  const [romanizedLyrics, setRomanizedLyrics] = useState(
    () => localStorage.getItem('pulse_romanized') === 'true'
  );
  const [explicitFilter, setExplicitFilter] = useState(
    () => localStorage.getItem('pulse_explicit_filter') === 'true'
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => localStorage.getItem('pulse_music_lang') || 'all'
  );
  const [smartRecs, setSmartRecs] = useState(
    () => localStorage.getItem('pulse_smart_recs') !== 'false'
  );
  const [dataSaver, setDataSaver] = useState(
    () => localStorage.getItem('pulse_data_saver') === 'true'
  );
  const [rememberLastSong, setRememberLastSong] = useState(
    () => localStorage.getItem('pulse_remember_song') !== 'false'
  );

  const [supabaseUrl, setSupabaseUrl] = useState(credentials.url || '');
  const [supabaseKey, setSupabaseKey] = useState(credentials.anonKey || '');
  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSupabaseUrl(credentials.url || '');
      setSupabaseKey(credentials.anonKey || '');
      setAuthError(null);
      setSyncStatus(null);
    }
  }, [isOpen, credentials]);

  // Escape key close
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

  // ── Handlers ───────────────────────────────────────────────────────
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
    setSyncStatus({ type: 'success', text: 'Supabase credentials saved successfully.' });
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (err) {
      console.error('[Google Sign-In] Error:', err);
      setAuthError(err.message || 'Failed to initialize Google sign-in. Check Supabase URL & Anon Key.');
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const result = await syncAllWithCloud();
      const likedCount = result?.stats?.likedCount ?? liked?.length ?? 0;
      const plCount = result?.stats?.playlistsCount ?? playlists?.length ?? 0;
      setSyncStatus({
        type: 'success',
        text: `Synced ${likedCount} liked tracks & ${plCount} playlists with Cloud.`,
      });
      setTimeout(() => setSyncStatus(null), 6000);
    } catch (err) {
      console.error('[Supabase Sync Error]:', err);
      setSyncStatus({
        type: 'error',
        text: `Sync failed: ${err.message || 'Database error.'}`,
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const backupData = {
      version: 'cassette-2.4',
      date: new Date().toISOString(),
      liked: liked || [],
      playlists: playlists || [],
      history: history || [],
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cassette_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus({ type: 'success', text: 'Library exported to JSON successfully.' });
    setTimeout(() => setImportStatus(null), 4000);
  };

  // Import JSON backup
  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.liked && Array.isArray(data.liked)) {
          localStorage.setItem('pulse_liked_songs', JSON.stringify(data.liked));
        }
        if (data.playlists && Array.isArray(data.playlists)) {
          localStorage.setItem('pulse_playlists', JSON.stringify(data.playlists));
        }
        setImportStatus({ type: 'success', text: 'Backup imported! Refresh page to see all restored data.' });
      } catch {
        setImportStatus({ type: 'error', text: 'Invalid JSON backup file.' });
      }
    };
    reader.readAsText(file);
  };

  // ── 14 ArchiveTune Categories Metadata ──────────────────────────────
  const CATEGORIES = [
    { id: 'account',       label: 'Account',             icon: 'account_circle',    badgeBg: 'bg-amber-500' },
    { id: 'stats',         label: 'Listening Stats',     icon: 'bar_chart',         badgeBg: 'bg-orange-500' },
    { id: 'appearance',    label: 'Appearance',          icon: 'palette',           badgeBg: 'bg-rose-500' },
    { id: 'playback',      label: 'Playback',            icon: 'graphic_eq',        badgeBg: 'bg-amber-600' },
    { id: 'canvas',        label: 'ArchiveTune Canvas',  icon: 'wallpaper',         badgeBg: 'bg-violet-600' },
    { id: 'lyrics',        label: 'Lyrics',              icon: 'lyrics',            badgeBg: 'bg-emerald-600' },
    { id: 'content',       label: 'Content',             icon: 'explicit',          badgeBg: 'bg-sky-600' },
    { id: 'behavior',      label: 'Behavior',            icon: 'touch_app',         badgeBg: 'bg-indigo-600' },
    { id: 'integration',   label: 'Integration',         icon: 'extension',         badgeBg: 'bg-pink-600' },
    { id: 'ai',            label: 'AI Integration',      icon: 'auto_awesome',      badgeBg: 'bg-amber-400 text-black' },
    { id: 'internet',      label: 'Internet & Data',     icon: 'wifi_tethering',    badgeBg: 'bg-cyan-600' },
    { id: 'storage',       label: 'Storage',             icon: 'folder_zip',        badgeBg: 'bg-teal-600' },
    { id: 'backup',        label: 'Backup & Restore',    icon: 'cloud_sync',        badgeBg: 'bg-amber-500' },
    { id: 'developer',     label: 'Developer Options',   icon: 'code',              badgeBg: 'bg-neutral-600' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div
        className="w-full sm:max-w-4xl bg-[#121214] sm:border sm:border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-[92vh] sm:max-h-[850px] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Top Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/5 bg-[#18181a] flex-shrink-0 pt-safe">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div>
              <h2 className="text-headline-sm font-bold text-white tracking-tight flex items-center gap-2">
                Settings Hub
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  ArchiveTune
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* ── Main Layout: Categories Nav + Content Area ────────────── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Categories Sidebar (Desktop + Tablet) */}
          <aside className="w-56 sm:w-64 flex-shrink-0 border-r border-white/5 bg-[#141416] p-2.5 overflow-y-auto no-scrollbar hidden md:flex flex-col gap-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 px-3 py-1.5">
              Categories
            </p>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-body-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#222225] text-white font-semibold shadow-sm border border-white/10'
                      : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0 text-[14px] ${cat.badgeBg}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  </div>
                  <span className="truncate flex-1">{cat.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </button>
              );
            })}
          </aside>

          {/* Mobile Category Horizontal Pills Strip (< md) */}
          <div className="md:hidden flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex gap-1.5 px-3 py-2.5 bg-[#141416] border-b border-white/5 overflow-x-auto no-scrollbar flex-shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'bg-[#1e1e22] text-neutral-400 border border-white/5 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Content Container (Constrained max-w-md for clean iOS style) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-[#0e0e0e] no-scrollbar">
              <div className="w-full max-w-md mx-auto flex flex-col gap-3">
                {renderActiveCategory()}
              </div>
            </div>
          </div>

          {/* Desktop Content Panel (md+) */}
          <div className="hidden md:block flex-1 overflow-y-auto p-6 space-y-6 bg-[#0e0e0e] no-scrollbar">
            <div className="max-w-xl">
              {renderActiveCategory()}
            </div>
          </div>
        </div>

        {/* ── Modal Footer ──────────────────────────────────────────── */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-[#141416] flex items-center justify-between text-body-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>cassette.fm · YouTube Music Engine + Supabase</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-amber-500 text-black text-label-sm font-bold hover:bg-amber-400 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  // ── Category Views Renderer ─────────────────────────────────────────
  function renderActiveCategory() {
    switch (activeCategory) {
      // 1. Account & Cloud Sync
      case 'account':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-2xl border border-white/10 bg-[#18181a] p-5 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-amber-500 font-mono font-semibold">
                    Cloud Account & Sync
                  </p>
                  <h3 className="text-headline-sm font-semibold text-white mt-1">
                    {user ? 'Google Account Connected' : 'Connect with Google'}
                  </h3>
                  <p className="text-body-sm text-neutral-400 mt-1 max-w-md">
                    {user
                      ? 'Your playlists, liked songs, and listening stats are backed up to Supabase Cloud.'
                      : 'Sign in to automatically sync your library across desktop and mobile devices.'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">
                    {user ? 'verified_user' : 'cloud_sync'}
                  </span>
                </div>
              </div>

              {authError && (
                <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-body-sm">
                  {authError}
                </div>
              )}

              {syncStatus && (
                <div
                  className={`mt-4 p-3 rounded-xl text-body-sm font-medium flex items-center gap-2.5 ${
                    syncStatus.type === 'error'
                      ? 'bg-red-950/50 border border-red-800 text-red-300'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">
                    {syncStatus.type === 'error' ? 'error' : 'check_circle'}
                  </span>
                  <span>{syncStatus.text}</span>
                </div>
              )}

              {user ? (
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata.picture}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border border-amber-500/40 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center">
                        {(user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-label-md font-bold text-white">
                        {user.user_metadata?.full_name || user.user_metadata?.name || 'cassette Listener'}
                      </p>
                      <p className="text-body-xs font-mono text-neutral-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleManualSync}
                      disabled={syncLoading}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black text-label-sm font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${syncLoading ? 'animate-spin' : ''}`}>
                        sync
                      </span>
                      {syncLoading ? 'Syncing...' : 'Sync Cloud'}
                    </button>
                    <button
                      onClick={signOut}
                      className="px-3.5 py-2 rounded-xl border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white text-label-sm transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-3">
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-label-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    Sign in with Google
                  </button>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfigDetails(!showConfigDetails)}
                      className="text-[12px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {showConfigDetails ? 'expand_less' : 'settings'}
                      </span>
                      {showConfigDetails ? 'Hide Cloud Configuration' : 'Configure Custom Supabase Backend'}
                    </button>

                    {showConfigDetails && (
                      <form onSubmit={handleSaveSupabaseConfig} className="mt-3 space-y-3 p-4 rounded-xl bg-[#111113] border border-white/10">
                        <div>
                          <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                            Supabase Project URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://xyzcompany.supabase.co"
                            value={supabaseUrl}
                            onChange={(e) => setSupabaseUrl(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#18181a] border border-white/10 text-white text-body-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                            Supabase Anon Key
                          </label>
                          <input
                            type="password"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={supabaseKey}
                            onChange={(e) => setSupabaseKey(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#18181a] border border-white/10 text-white text-body-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-amber-500 text-black text-label-sm font-bold hover:bg-amber-400 transition-colors cursor-pointer"
                        >
                          Save Credentials
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // 2. Listening Stats
      case 'stats':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#18181a] border border-white/10">
                <span className="text-[11px] font-mono text-neutral-400 block uppercase">LIKED TRACKS</span>
                <span className="text-headline-md font-extrabold text-amber-400 mt-1 block">
                  {liked?.length || 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#18181a] border border-white/10">
                <span className="text-[11px] font-mono text-neutral-400 block uppercase">PLAYLISTS</span>
                <span className="text-headline-md font-extrabold text-white mt-1 block">
                  {playlists?.length || 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#18181a] border border-white/10 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-mono text-neutral-400 block uppercase">SESSION HISTORY</span>
                <span className="text-headline-md font-extrabold text-amber-400 mt-1 block">
                  {history?.length || 0}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-3">
              <h4 className="text-label-md font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-500">insights</span>
                Listening Insights
              </h4>
              <p className="text-body-sm text-neutral-400 leading-relaxed">
                Your highest engagement genres include Indie R&B, Dream Pop, and Neo-Soul. High-resolution OPUS audio playback active on 100% of streams.
              </p>
            </div>
          </div>
        );

      // 3. Appearance
      case 'appearance':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4">
              <div>
                <h4 className="text-headline-sm font-bold text-white">Accent Theme</h4>
                <p className="text-body-sm text-neutral-400 mt-0.5">
                  Select your signature highlight accent across buttons, sliders, and badges.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'amber',   label: 'Warm Amber',  color: '#f59e0b', ring: 'ring-amber-500' },
                  { id: 'rose',    label: 'Rose Pink',   color: '#f43f5e', ring: 'ring-rose-500' },
                  { id: 'violet',  label: 'Neon Violet', color: '#a855f7', ring: 'ring-violet-500' },
                  { id: 'cyan',    label: 'Electric Cyan', color: '#06b6d4', ring: 'ring-cyan-500' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setAccentColor(t.id);
                      localStorage.setItem('pulse_accent_color', t.id);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      accentColor === t.id
                        ? 'bg-[#222225] border-white/30 font-bold text-white ring-2 ' + t.ring
                        : 'bg-[#121214] border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-body-sm truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Glow Toggle */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-label-md font-semibold text-white">Dynamic Album Art Glow</p>
                <p className="text-body-xs text-neutral-400">
                  Diffuse real-time cover art colors into the background canvas
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !ambientGlow;
                  setAmbientGlow(next);
                  localStorage.setItem('pulse_ambient_glow', String(next));
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  ambientGlow ? 'bg-amber-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                    ambientGlow ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      // 4. Playback
      case 'playback':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4">
              <div>
                <h4 className="text-headline-sm font-bold text-white">Audio Streaming Fidelity</h4>
                <p className="text-body-sm text-neutral-400 mt-0.5">
                  Powered by high-bitrate YouTube Music audio streams with automatic Opus/AAC negotiation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'max',      label: 'Maximum (256k)', detail: 'High-Res OPUS Audio' },
                  { id: 'standard', label: 'Balanced (160k)', detail: 'Smooth Bandwidth' },
                  { id: 'datasaver',label: 'Data Saver (128k)', detail: 'Minimal Network Footprint' },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleQualityChange(q.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      audioQuality === q.id
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-[#121214] border-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <p className="text-label-md font-bold">{q.label}</p>
                    <p className="text-body-xs opacity-80 mt-1">{q.detail}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Normalization */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-label-md font-semibold text-white">Normalize Volume</p>
                <p className="text-body-xs text-neutral-400">
                  Prevent sudden volume spikes between different tracks
                </p>
              </div>
              <button
                onClick={handleNormalizeToggle}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  normalizeAudio ? 'bg-amber-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                    normalizeAudio ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Crossfade Slider */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-label-md font-semibold text-white">Crossfade Duration</p>
                <span className="text-label-sm font-mono text-amber-400">{crossfadeDuration}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={crossfadeDuration}
                onChange={(e) => {
                  setCrossfadeDuration(Number(e.target.value));
                  localStorage.setItem('pulse_crossfade', e.target.value);
                }}
                className="w-full"
              />
            </div>
          </div>
        );

      // 5. ArchiveTune Canvas
      case 'canvas':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-3">
              <h4 className="text-headline-sm font-bold text-white">ArchiveTune Canvas Engine</h4>
              <p className="text-body-sm text-neutral-400 leading-relaxed">
                Full-bleed visualizer system with audio-reactive waveforms and subtle cinematic canvas animation.
              </p>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-label-md font-semibold text-white">Full-Screen Canvas Motion</p>
                  <p className="text-body-xs text-neutral-400">Animate live artwork during active playback</p>
                </div>
                <button
                  onClick={() => {
                    const next = !canvasBg;
                    setCanvasBg(next);
                    localStorage.setItem('pulse_canvas_bg', String(next));
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    canvasBg ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      canvasBg ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      // 6. Lyrics
      case 'lyrics':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4">
              <h4 className="text-headline-sm font-bold text-white">Synced Lyrics Typography</h4>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'compact', label: 'Compact' },
                  { id: 'normal',  label: 'Standard' },
                  { id: 'large',   label: 'Large' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setLyricFontSize(s.id);
                      localStorage.setItem('pulse_lyric_size', s.id);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-center text-body-sm font-medium transition-all cursor-pointer ${
                      lyricFontSize === s.id
                        ? 'bg-amber-500 text-black font-bold border-amber-500'
                        : 'bg-[#121214] border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Romanized toggle */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-label-md font-semibold text-white">Romanized Lyrics Support</p>
                  <p className="text-body-xs text-neutral-400">Render Romaji, Pinyin, and Hindi phonetic subtitles</p>
                </div>
                <button
                  onClick={() => {
                    const next = !romanizedLyrics;
                    setRomanizedLyrics(next);
                    localStorage.setItem('pulse_romanized', String(next));
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    romanizedLyrics ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      romanizedLyrics ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      // 7. Content
      case 'content':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4">
              <h4 className="text-headline-sm font-bold text-white">Preferred Music Region</h4>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  localStorage.setItem('pulse_music_lang', e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-white/10 text-white text-body-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="all">Global (All Regions)</option>
                <option value="en">English (US / UK / Global Pop)</option>
                <option value="hi">Hindi & Bollywood</option>
                <option value="pa">Punjabi Pop</option>
                <option value="es">Latin & Spanish</option>
                <option value="kr">K-Pop</option>
                <option value="jp">J-Pop & Anime</option>
              </select>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-label-md font-semibold text-white">Filter Explicit Content</p>
                  <p className="text-body-xs text-neutral-400">Hide songs with explicit lyric advisories</p>
                </div>
                <button
                  onClick={() => {
                    const next = !explicitFilter;
                    setExplicitFilter(next);
                    localStorage.setItem('pulse_explicit_filter', String(next));
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    explicitFilter ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      explicitFilter ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      // 8. Behavior
      case 'behavior':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-label-md font-semibold text-white">Remember Last Song</p>
                  <p className="text-body-xs text-neutral-400">Restore your last playing track and position on launch</p>
                </div>
                <button
                  onClick={() => {
                    const next = !rememberLastSong;
                    setRememberLastSong(next);
                    localStorage.setItem('pulse_remember_song', String(next));
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    rememberLastSong ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      rememberLastSong ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      // 9. Integration
      case 'integration':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-3">
              <h4 className="text-headline-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">sensors</span>
                Connected Services
              </h4>
              <p className="text-body-sm text-neutral-400">
                YouTube Music Stream Pipe active. Discord Rich Presence and Last.fm scrobbling bridge ready for companion integration.
              </p>
            </div>
          </div>
        );

      // 10. AI Integration
      case 'ai':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-headline-sm font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400">auto_awesome</span>
                    Smart DJ & Vibe Matching
                  </h4>
                  <p className="text-body-sm text-neutral-400 mt-1">
                    AI-powered continuous queue curation based on acoustic similarity and harmonic progressions.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-label-md font-semibold text-white">Auto-Generate Dynamic Queue</p>
                  <p className="text-body-xs text-neutral-400">Automatically queue similar songs when playlist ends</p>
                </div>
                <button
                  onClick={() => {
                    const next = !smartRecs;
                    setSmartRecs(next);
                    localStorage.setItem('pulse_smart_recs', String(next));
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    smartRecs ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      smartRecs ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      // 11. Internet & Data
      case 'internet':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-label-md font-semibold text-white">Data Saver Mode</p>
                <p className="text-body-xs text-neutral-400">
                  Switch to 128kbps AAC and disable animated artwork when on metered cellular data
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !dataSaver;
                  setDataSaver(next);
                  localStorage.setItem('pulse_data_saver', String(next));
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  dataSaver ? 'bg-amber-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                    dataSaver ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      // 12. Storage
      case 'storage':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4">
              <h4 className="text-headline-sm font-bold text-white">Browser Storage</h4>
              <div className="p-4 rounded-xl bg-[#121214] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-label-md font-semibold text-white">Local Library Storage</p>
                  <p className="text-body-xs text-neutral-400">
                    {liked?.length || 0} Liked Songs · {playlists?.length || 0} Playlists · {history?.length || 0} History Tracks
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('pulse_search_history');
                    alert('Search history cleared.');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-[12px] text-neutral-400 hover:text-white hover:border-white/30 cursor-pointer"
                >
                  Clear Search History
                </button>
              </div>
            </div>
          </div>
        );

      // 13. Backup & Restore
      case 'backup':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4">
              <div>
                <h4 className="text-headline-sm font-bold text-white">JSON Library Backup</h4>
                <p className="text-body-sm text-neutral-400 mt-0.5">
                  Export or restore your full cassette.fm library including playlists, liked tracks, and tags.
                </p>
              </div>

              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-body-sm font-medium ${
                    importStatus.type === 'error'
                      ? 'bg-red-950/50 border border-red-800 text-red-300'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  {importStatus.text}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-label-md flex items-center gap-2 hover:bg-amber-400 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Export Backup JSON
                </button>

                <label className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-white font-medium text-label-md flex items-center gap-2 cursor-pointer bg-[#121214] transition-colors">
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Restore from JSON
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        );

      // 14. Developer Options
      case 'developer':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4">
              <h4 className="text-headline-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-neutral-400">terminal</span>
                System Diagnostics
              </h4>

              <div className="space-y-2 font-mono text-[12px] p-3.5 rounded-xl bg-[#0e0e0e] border border-white/10 text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">App Version:</span>
                  <span className="text-amber-400">cassette.fm v2.4.0 (ArchiveTune Edition)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Audio Codec:</span>
                  <span className="text-white">{activeStreamMeta?.mimeType || 'audio/webm; codecs="opus"'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Active Format itag:</span>
                  <span className="text-white">#{activeStreamMeta?.itag || '251'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Host Environment:</span>
                  <span className="text-white">Vite PWA · ServiceWorker Ready</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}
