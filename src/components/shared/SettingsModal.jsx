import { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function SettingsModal({ isOpen, onClose }) {
  const {
    liked,
    playlists,
    history,
    syncAllWithCloud,
    importPlaylistFromUrl,
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
    openAuthModal,
  } = useAuth();

  const {
    themeMode,
    setThemeMode,
    customColor,
    setCustomColor,
    extractedColor,
    activeAccentColor,
    presetPalettes,
  } = useTheme();

  // ── Drill-down sub-page state (null = Main Settings Menu) ────────
  const [currentSubPage, setCurrentSubPage] = useState(null);

  // ── Settings Local States ──────────────────────────────────────────
  const [normalizeAudio, setNormalizeAudio] = useState(
    () => localStorage.getItem('pulse_normalize_audio') !== 'false'
  );
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem('pulse_accent_color') || 'white'
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

  // ── Public Playlist URL Importer State ─────────────────────────────
  const [importUrl, setImportUrl] = useState('');
  const [importingUrl, setImportingUrl] = useState(false);
  const [importUrlStatus, setImportUrlStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentSubPage(null);
      setSupabaseUrl(credentials.url || '');
      setSupabaseKey(credentials.anonKey || '');
      setAuthError(null);
      setSyncStatus(null);
      setImportUrlStatus(null);
    }
  }, [isOpen, credentials]);

  // Escape key close or navigate back to main menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (currentSubPage) {
          setCurrentSubPage(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSubPage, onClose]);

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

  // ── Public YouTube Playlist URL Importer Handler ──────────────────
  const handleImportPlaylistUrl = async (targetType = 'playlist') => {
    if (!importUrl.trim()) return;
    setImportingUrl(true);
    setImportUrlStatus(null);

    try {
      const res = await importPlaylistFromUrl(importUrl.trim(), targetType);
      if (targetType === 'liked') {
        setImportUrlStatus({
          type: 'success',
          text: `Imported ${res.count} tracks directly into your Liked Songs!`,
        });
      } else {
        setImportUrlStatus({
          type: 'success',
          text: `Imported playlist "${res.playlist.title}" with ${res.count} tracks into your Library!`,
        });
      }
      setImportUrl('');
      setTimeout(() => setImportUrlStatus(null), 8000);
    } catch (err) {
      console.error('[Playlist Import Error]:', err);
      setImportUrlStatus({
        type: 'error',
        text: err.message || 'Failed to import playlist. Please check if the link is Public or Unlisted.',
      });
    } finally {
      setImportingUrl(false);
    }
  };

  // ── 6 Categorized Settings Sections ────────────────────────────────
  const CATEGORIES = [
    {
      id: 'interface',
      label: 'Interface & Themes',
      description: 'Accent colors, dynamic album art theming & synced lyric sizing',
      icon: 'palette',
      badgeBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
    },
    {
      id: 'quality',
      label: 'Quality & Playback',
      description: 'Streaming audio fidelity, volume normalization, crossfade & smart radio',
      icon: 'graphic_eq',
      badgeBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    },
    {
      id: 'content',
      label: 'Content & Language',
      description: 'Regional music charts, explicit lyrics filter & data saver',
      icon: 'tune',
      badgeBg: 'bg-sky-500/15 text-sky-400 border border-sky-500/25',
    },
    {
      id: 'account',
      label: 'Account & Cloud Sync',
      description: 'Google sign-in, cloud library sync & custom Supabase backend',
      icon: 'account_circle',
      badgeBg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
    },
    {
      id: 'backup',
      label: 'Backup & Import',
      description: 'Import YouTube playlists/albums & export/restore JSON backups',
      icon: 'cloud_sync',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    },
    {
      id: 'devices',
      label: 'About & System Engine',
      description: 'OPUS audio pipeline diagnostics, browser cache & app build info',
      icon: 'info',
      badgeBg: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
    },
  ];

  const activeCategoryObj = CATEGORIES.find((c) => c.id === currentSubPage);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div
        className="w-full sm:max-w-2xl bg-[#101012] sm:border sm:border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-[90vh] sm:max-h-[820px] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Native Mobile / Desktop Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5 bg-[#141416] flex-shrink-0 pt-safe">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (currentSubPage) {
                  setCurrentSubPage(null);
                } else {
                  onClose();
                }
              }}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 active:scale-95 flex-shrink-0"
              aria-label={currentSubPage ? 'Back to Settings' : 'Close Settings'}
              title={currentSubPage ? 'Back to Settings' : 'Close Settings'}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              {currentSubPage && (
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activeCategoryObj?.badgeBg || 'bg-accent/20 text-accent'}`}>
                  <span className="material-symbols-outlined text-[16px]">{activeCategoryObj?.icon || 'tune'}</span>
                </div>
              )}
              <h2 className="text-title-lg font-bold text-white tracking-tight truncate">
                {currentSubPage ? (activeCategoryObj?.label || 'Settings') : 'Settings'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 flex-shrink-0 ml-3"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* ── Main Body: Vertical Category List OR Drill-Down Sub-Page ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-[#0e0e0e] no-scrollbar pb-safe">
          {currentSubPage ? (
            /* ── Drill-down Dedicated Sub-Page Controls ────────────── */
            <div className="w-full max-w-xl mx-auto space-y-4 pb-10 animate-fade-in">
              {renderActiveCategory(currentSubPage)}
            </div>
          ) : (
            /* ── Main Settings Menu (Vertical Category List) ──────── */
            <div className="w-full max-w-xl mx-auto space-y-4 pb-10 animate-fade-in">
              {/* Account Quick Status Banner */}
              <div
                onClick={() => setCurrentSubPage('account')}
                className="p-4 rounded-2xl bg-[#161618] border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {user ? (
                    user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata?.picture}
                        alt="Avatar"
                        className="w-11 h-11 rounded-full border border-accent/40 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-accent text-black font-bold flex items-center justify-center text-title-sm flex-shrink-0">
                        {(user.email || 'U')[0].toUpperCase()}
                      </div>
                    )
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <span className="material-symbols-outlined text-[22px]">account_circle</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-label-md font-bold text-white truncate group-hover:text-accent transition-colors">
                      {user ? (user.user_metadata?.full_name || user.user_metadata?.name || user.email) : 'Cloud Sync & Account'}
                    </p>
                    <p className="text-body-xs text-neutral-400 truncate mt-0.5">
                      {user ? 'Google Account Connected · Library Synced' : 'Sign in to sync your playlists and liked songs'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-neutral-500 group-hover:text-white transition-colors flex-shrink-0">
                  <span className="text-[12px] font-medium hidden sm:inline text-neutral-400">Manage</span>
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </div>
              </div>

              {/* Section Header */}
              <div className="pt-2 px-1">
                <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 font-bold">
                  PREFERENCES & SYSTEM
                </p>
              </div>

              {/* Vertical Category Rows */}
              <div className="space-y-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCurrentSubPage(cat.id)}
                    className="w-full p-4 rounded-2xl bg-[#161618] hover:bg-[#1f1f22] border border-white/5 hover:border-white/15 transition-all text-left flex items-center justify-between gap-3.5 group cursor-pointer active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${cat.badgeBg}`}>
                        <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-label-md font-bold text-white group-hover:text-accent transition-colors truncate">
                          {cat.label}
                        </h3>
                        <p className="text-body-xs text-neutral-400 mt-0.5 line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-[20px] text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Public YouTube Playlist / Track Importer Component ─────────────
  function renderPlaylistUrlImporterSection() {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#18181a] p-5 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] uppercase tracking-widest text-accent font-mono font-semibold">
                Library Importer · YouTube & YT Music
              </p>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-semibold">
                No Cookies Needed
              </span>
            </div>
            <h3 className="text-title-md font-bold text-white mt-1">
              Import YouTube Playlist or Album
            </h3>
            <p className="text-body-sm text-neutral-400 mt-1 max-w-md">
              Paste any public or unlisted YouTube / YouTube Music playlist URL to seamlessly import tracks into your library or merge into Liked Songs.
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">download</span>
          </div>
        </div>

        {importUrlStatus && (
          <div
            className={`p-3.5 rounded-xl text-body-sm font-medium flex items-center gap-2.5 ${
              importUrlStatus.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/40 border border-red-800/60 text-red-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">
              {importUrlStatus.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="flex-1">{importUrlStatus.text}</span>
          </div>
        )}

        {/* URL Input */}
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
              YouTube / YouTube Music Playlist URL or ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && importUrl.trim() && !importingUrl) {
                    handleImportPlaylistUrl('playlist');
                  }
                }}
                placeholder="https://music.youtube.com/playlist?list=... or PL..."
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-[#111113] border border-white/10 text-white font-mono text-body-sm focus:border-accent focus:outline-none placeholder:text-neutral-600"
              />
              {importUrl && (
                <button
                  type="button"
                  onClick={() => setImportUrl('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Supports playlists (`?list=...`), albums, and mix URLs. Make sure the playlist is set to Public or Unlisted on YouTube.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleImportPlaylistUrl('playlist')}
              disabled={importingUrl || !importUrl.trim()}
              className="px-4 py-2.5 rounded-xl bg-accent hover:brightness-110 text-black font-bold text-label-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[17px] ${importingUrl ? 'animate-spin' : ''}`}>
                {importingUrl ? 'sync' : 'playlist_add'}
              </span>
              {importingUrl ? 'Importing Tracks...' : 'Import as Playlist'}
            </button>

            <button
              onClick={() => handleImportPlaylistUrl('liked')}
              disabled={importingUrl || !importUrl.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-[#222225] hover:bg-[#2c2c30] text-neutral-200 hover:text-white text-label-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px] text-rose-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
              Merge into Liked Songs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Category Views Renderer (Drill-Down Sub-Pages) ────────────────
  function renderActiveCategory(targetCategory = currentSubPage) {
    switch (targetCategory) {
      // ── 1. Quality & Playback ──────────────────────────────────────
      case 'quality':
        return (
          <div className="space-y-4 animate-fade-in">
            {/* Section Header */}
            <div className="pb-1">
              <h3 className="text-title-lg font-bold text-white">Quality & Playback</h3>
              <p className="text-body-sm text-neutral-400 mt-0.5">
                Tune stream fidelity, volume normalization, and continuous radio playback.
              </p>
            </div>

            {/* Audio Quality Stream Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-title-sm font-bold text-white">Streaming Audio Fidelity</h4>
                  <p className="text-body-xs text-neutral-400 mt-0.5">
                    High-bitrate OPUS stream negotiation directly from YouTube Music audio backend.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'max',       label: 'Maximum (256k)', detail: 'High-Res OPUS Audio' },
                  { id: 'standard',  label: 'Balanced (160k)', detail: 'Smooth Bandwidth' },
                  { id: 'datasaver', label: 'Data Saver (128k)', detail: 'Minimal Network Footprint' },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleQualityChange(q.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      audioQuality === q.id
                        ? 'bg-accent/15 border-accent text-accent font-bold shadow-md'
                        : 'bg-[#121214] border-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <p className="text-label-md font-bold">{q.label}</p>
                    <p className="text-body-xs opacity-80 mt-1">{q.detail}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Normalization Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between shadow-lg">
              <div className="pr-4">
                <p className="text-label-md font-bold text-white">Normalize Volume</p>
                <p className="text-body-xs text-neutral-400 mt-0.5">
                  Equalize gain across different album masters to prevent loud audio spikes
                </p>
              </div>
              <button
                onClick={handleNormalizeToggle}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  normalizeAudio ? 'bg-accent' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-black transition-transform ${
                    normalizeAudio ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Crossfade Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-label-md font-bold text-white">Crossfade Duration</p>
                  <p className="text-body-xs text-neutral-400 mt-0.5">Smoothly fade between ending and upcoming songs</p>
                </div>
                <span className="text-label-sm font-mono font-bold text-accent px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30">
                  {crossfadeDuration}s
                </span>
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
                className="w-full accent-accent"
              />
            </div>

            {/* Smart Radio Auto-Queue Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between shadow-lg">
              <div className="pr-4">
                <p className="text-label-md font-bold text-white">Smart Radio & Continuous Queue</p>
                <p className="text-body-xs text-neutral-400 mt-0.5">
                  Automatically fetch related mixes and recommendations when your playlist completes
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !smartRecs;
                  setSmartRecs(next);
                  localStorage.setItem('pulse_smart_recs', String(next));
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  smartRecs ? 'bg-accent' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-black transition-transform ${
                    smartRecs ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      // ── 2. Interface & Themes ──────────────────────────────────────
      case 'interface':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="pb-1">
              <h3 className="text-title-lg font-bold text-white">Interface & Themes</h3>
              <p className="text-body-sm text-neutral-400 mt-0.5">
                Customize palette accents, dynamic album color extraction, and synced lyric typography.
              </p>
            </div>

            {/* Theming Engine Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-5 shadow-lg">
              <div>
                <h4 className="text-title-sm font-bold text-white">Theme Accent Engine</h4>
                <p className="text-body-xs text-neutral-400 mt-0.5">
                  Choose between automatic cover-art colors, clean monochrome B&W, or custom palettes.
                </p>
              </div>

              {/* 3 Theme Mode Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Dynamic */}
                <button
                  type="button"
                  onClick={() => setThemeMode('dynamic')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer relative overflow-hidden ${
                    themeMode === 'dynamic'
                      ? 'bg-[#222225] border-white/40 shadow-lg ring-2 ring-accent'
                      : 'bg-[#141416] border-white/5 hover:bg-[#1c1c1f] hover:border-white/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[24px]" style={{ color: extractedColor }}>
                      auto_awesome
                    </span>
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm transition-colors duration-500"
                      style={{ backgroundColor: extractedColor }}
                    />
                  </div>
                  <div>
                    <span className="text-label-md font-bold text-white block">Dynamic (Album Art)</span>
                    <span className="text-[12px] text-neutral-400 block mt-0.5">
                      Extracts real-time cover colors
                    </span>
                  </div>
                </button>

                {/* 2. Monochrome B&W */}
                <button
                  type="button"
                  onClick={() => setThemeMode('default')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer relative overflow-hidden ${
                    themeMode === 'default'
                      ? 'bg-[#222225] border-white/40 shadow-lg ring-2 ring-white'
                      : 'bg-[#141416] border-white/5 hover:bg-[#1c1c1f] hover:border-white/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[24px] text-white">
                      contrast
                    </span>
                    <span className="w-5 h-5 rounded-full bg-white border border-white/20 shadow-sm" />
                  </div>
                  <div>
                    <span className="text-label-md font-bold text-white block">Default (Monochrome)</span>
                    <span className="text-[12px] text-neutral-400 block mt-0.5">
                      Clean B&W minimal aesthetic
                    </span>
                  </div>
                </button>

                {/* 3. Custom Palette */}
                <button
                  type="button"
                  onClick={() => setThemeMode('custom')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer relative overflow-hidden ${
                    themeMode === 'custom'
                      ? 'bg-[#222225] border-white/40 shadow-lg ring-2 ring-accent'
                      : 'bg-[#141416] border-white/5 hover:bg-[#1c1c1f] hover:border-white/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[24px]" style={{ color: customColor }}>
                      palette
                    </span>
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm transition-colors"
                      style={{ backgroundColor: customColor }}
                    />
                  </div>
                  <div>
                    <span className="text-label-md font-bold text-white block">Custom Palette</span>
                    <span className="text-[12px] text-neutral-400 block mt-0.5">
                      Pick any hex color swatch
                    </span>
                  </div>
                </button>
              </div>

              {/* Custom Color Selector Panel */}
              {themeMode === 'custom' && (
                <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm font-bold text-white">Curated Palettes</span>
                    <span className="text-body-xs font-mono text-neutral-400 uppercase">
                      Hex: {customColor}
                    </span>
                  </div>

                  {/* Preset Swatches */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {presetPalettes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCustomColor(p.hex)}
                        title={p.name}
                        className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                          customColor.toLowerCase() === p.hex.toLowerCase()
                            ? 'border-white scale-110 shadow-lg ring-2 ring-white/40'
                            : 'border-white/10 hover:scale-105'
                        }`}
                        style={{ backgroundColor: p.hex }}
                      >
                        {customColor.toLowerCase() === p.hex.toLowerCase() && (
                          <span className="material-symbols-outlined text-[16px] text-black font-bold">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Native Picker */}
                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#222225] border border-white/10 hover:border-white/30 cursor-pointer text-body-sm text-white transition-colors">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: customColor }}
                      />
                      <span>Pick Custom Swatch</span>
                    </label>

                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#f59e0b"
                      maxLength={7}
                      className="w-28 px-3.5 py-2.5 rounded-xl bg-[#222225] border border-white/10 text-white font-mono text-body-sm text-center focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ambient Glow Toggle */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between shadow-lg">
              <div className="pr-4">
                <p className="text-label-md font-bold text-white">Dynamic Album Art Ambient Glow</p>
                <p className="text-body-xs text-neutral-400 mt-0.5">
                  Diffuse real-time cover art colors into the background canvas and player modals
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !ambientGlow;
                  setAmbientGlow(next);
                  localStorage.setItem('pulse_ambient_glow', String(next));
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  ambientGlow ? 'bg-accent' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-black transition-transform ${
                    ambientGlow ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Lyrics Font Size Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4 shadow-lg">
              <div>
                <h4 className="text-title-sm font-bold text-white">Synced Lyrics Font Size</h4>
                <p className="text-body-xs text-neutral-400 mt-0.5">Adjust text size in the full-screen lyrics sheet</p>
              </div>

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
                    className={`py-2.5 px-3 rounded-xl border text-center text-body-sm font-semibold transition-all cursor-pointer ${
                      lyricFontSize === s.id
                        ? 'bg-accent text-black font-bold border-accent shadow-md'
                        : 'bg-[#121214] border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Romanized Lyrics Toggle */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between shadow-lg">
              <div className="pr-4">
                <p className="text-label-md font-bold text-white">Romanized Phonetic Lyrics</p>
                <p className="text-body-xs text-neutral-400 mt-0.5">Render Romaji, Pinyin, and Hindi phonetic pronunciation subtitles</p>
              </div>
              <button
                onClick={() => {
                  const next = !romanizedLyrics;
                  setRomanizedLyrics(next);
                  localStorage.setItem('pulse_romanized', String(next));
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  romanizedLyrics ? 'bg-accent' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-black transition-transform ${
                    romanizedLyrics ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      // ── 3. Content & Language ──────────────────────────────────────
      case 'content':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="pb-1">
              <h3 className="text-title-lg font-bold text-white">Content & Language</h3>
              <p className="text-body-sm text-neutral-400 mt-0.5">
                Filter regions, explicit lyrics, data usage, and track resume behavior.
              </p>
            </div>

            {/* Region / Language Dropdown */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-3 shadow-lg">
              <div>
                <label className="block text-label-md font-bold text-white mb-0.5">
                  Preferred Music Region & Charts
                </label>
                <p className="text-body-xs text-neutral-400 mb-3">
                  Tailor home feed recommendations and trending playlists to your local language
                </p>
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  localStorage.setItem('pulse_music_lang', e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl bg-[#121214] border border-white/10 text-white text-body-sm font-semibold focus:border-accent focus:outline-none cursor-pointer"
              >
                <option value="all">Global (All Regions)</option>
                <option value="en">English (US / UK / Global Pop)</option>
                <option value="hi">Hindi & Bollywood</option>
                <option value="pa">Punjabi Pop</option>
                <option value="es">Latin & Spanish</option>
                <option value="kr">K-Pop</option>
                <option value="jp">J-Pop & Anime</option>
              </select>
            </div>

            {/* Explicit Filter Toggle */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between shadow-lg">
              <div className="pr-4">
                <p className="text-label-md font-bold text-white">Filter Explicit Content</p>
                <p className="text-body-xs text-neutral-400 mt-0.5">Hide tracks with explicit lyric advisories in feeds and search</p>
              </div>
              <button
                onClick={() => {
                  const next = !explicitFilter;
                  setExplicitFilter(next);
                  localStorage.setItem('pulse_explicit_filter', String(next));
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  explicitFilter ? 'bg-accent' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-black transition-transform ${
                    explicitFilter ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Remember Last Song Toggle */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between shadow-lg">
              <div className="pr-4">
                <p className="text-label-md font-bold text-white">Remember Last Playing Song</p>
                <p className="text-body-xs text-neutral-400 mt-0.5">Restore your last active song and playback position upon launching app</p>
              </div>
              <button
                onClick={() => {
                  const next = !rememberLastSong;
                  setRememberLastSong(next);
                  localStorage.setItem('pulse_remember_song', String(next));
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  rememberLastSong ? 'bg-accent' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-black transition-transform ${
                    rememberLastSong ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Data Saver Toggle */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 flex items-center justify-between shadow-lg">
              <div className="pr-4">
                <p className="text-label-md font-bold text-white">Data Saver Mode</p>
                <p className="text-body-xs text-neutral-400 mt-0.5">Switch to lightweight 128k audio format when on mobile networks</p>
              </div>
              <button
                onClick={() => {
                  const next = !dataSaver;
                  setDataSaver(next);
                  localStorage.setItem('pulse_data_saver', String(next));
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  dataSaver ? 'bg-accent' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-black transition-transform ${
                    dataSaver ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Listening Stats Overview Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-3 shadow-lg">
              <h4 className="text-label-md font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-accent">bar_chart</span>
                Personal Library Metrics
              </h4>
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-[#111113] border border-white/5 text-center">
                  <span className="text-[10px] font-mono text-neutral-400 block uppercase">Liked</span>
                  <span className="text-title-md font-extrabold text-accent mt-0.5 block">{liked?.length || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#111113] border border-white/5 text-center">
                  <span className="text-[10px] font-mono text-neutral-400 block uppercase">Playlists</span>
                  <span className="text-title-md font-extrabold text-white mt-0.5 block">{playlists?.length || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#111113] border border-white/5 text-center">
                  <span className="text-[10px] font-mono text-neutral-400 block uppercase">History</span>
                  <span className="text-title-md font-extrabold text-white mt-0.5 block">{history?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // ── 4. Account & Cloud ─────────────────────────────────────────
      case 'account':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="pb-1">
              <h3 className="text-title-lg font-bold text-white">Account & Cloud</h3>
              <p className="text-body-sm text-neutral-400 mt-0.5">
                Manage cloud sync for your library, playlists, and listening preferences.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#18181a] p-5 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-accent font-mono font-semibold">
                    Cloud Account & Sync
                  </p>
                  <h3 className="text-title-md font-bold text-white mt-1">
                    {user ? 'Google Account Connected' : 'Connect with Google'}
                  </h3>
                  <p className="text-body-sm text-neutral-400 mt-1 max-w-md">
                    {user
                      ? 'Your playlists, liked songs, and listening stats are backed up to Supabase Cloud.'
                      : 'Sign in to automatically sync your library across desktop and mobile devices.'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent flex-shrink-0">
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

              {user ? (
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata?.picture}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border border-accent/40 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent text-black font-bold flex items-center justify-center">
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
                      className="px-4 py-2 rounded-xl bg-accent text-black text-label-sm font-bold hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${syncLoading ? 'animate-spin' : ''}`}>
                        sync
                      </span>
                      {syncLoading ? 'Syncing...' : 'Sync Cloud'}
                    </button>
                    <button
                      onClick={() => openAuthModal('profile')}
                      className="px-3.5 py-2 rounded-xl border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white text-label-sm transition-colors cursor-pointer"
                    >
                      Profile
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-label-md flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                      </svg>
                      Sign in with Google
                    </button>

                    <button
                      onClick={() => openAuthModal('signin')}
                      className="w-full py-3 px-4 rounded-xl bg-[#222225] border border-white/10 hover:border-white/30 text-white font-bold text-label-md flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                      Sign in with Email
                    </button>
                  </div>

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
                            className="w-full px-3 py-2 rounded-lg bg-[#18181a] border border-white/10 text-white text-body-sm focus:border-accent focus:outline-none"
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
                            className="w-full px-3 py-2 rounded-lg bg-[#18181a] border border-white/10 text-white text-body-sm focus:border-accent focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-accent text-black text-label-sm font-bold hover:brightness-110 transition-all cursor-pointer"
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

      // ── 5. Backup & Import ─────────────────────────────────────────
      case 'backup':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="pb-1">
              <h3 className="text-title-lg font-bold text-white">Backup & Import</h3>
              <p className="text-body-sm text-neutral-400 mt-0.5">
                Import YouTube playlists directly or export/restore your library via JSON.
              </p>
            </div>

            {/* YouTube Playlist URL Importer */}
            {renderPlaylistUrlImporterSection()}

            {/* JSON Backup & Restore Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4 shadow-lg">
              <div>
                <h4 className="text-title-sm font-bold text-white">JSON Library Backup & Restore</h4>
                <p className="text-body-xs text-neutral-400 mt-0.5">
                  Export or restore your full cassette.fm library including playlists, liked tracks, and tags.
                </p>
              </div>

              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-body-sm font-medium ${
                    importStatus.type === 'error'
                      ? 'bg-red-950/50 border border-red-800 text-red-300'
                      : 'bg-accent/10 border border-accent/30 text-accent'
                  }`}
                >
                  {importStatus.text}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2.5 rounded-xl bg-accent text-black font-bold text-label-md flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-accent/20"
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

      // ── 6. Devices & Engine ────────────────────────────────────────
      case 'devices':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="pb-1">
              <h3 className="text-title-lg font-bold text-white">Devices & Engine</h3>
              <p className="text-body-sm text-neutral-400 mt-0.5">
                Inspect active audio pipeline, browser storage diagnostics, and system version.
              </p>
            </div>

            {/* System Diagnostics Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-4 shadow-lg">
              <h4 className="text-title-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-neutral-400">terminal</span>
                Audio Pipeline Diagnostics
              </h4>

              <div className="space-y-2.5 font-mono text-[12px] p-4 rounded-xl bg-[#0e0e0e] border border-white/10 text-neutral-300">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-neutral-500">App Version:</span>
                  <span className="text-accent font-bold">cassette.fm v2.4.0</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-neutral-500">Audio Codec:</span>
                  <span className="text-white">{activeStreamMeta?.mimeType || 'audio/webm; codecs="opus"'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-neutral-500">Stream Format itag:</span>
                  <span className="text-white font-bold">#{activeStreamMeta?.itag || '251'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500">Host Environment:</span>
                  <span className="text-white">Vite PWA · ServiceWorker Ready</span>
                </div>
              </div>
            </div>

            {/* Storage Management Card */}
            <div className="p-5 rounded-2xl bg-[#18181a] border border-white/10 space-y-3 shadow-lg">
              <h4 className="text-title-sm font-bold text-white">Browser Storage Cache</h4>
              <div className="p-4 rounded-xl bg-[#121214] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-label-md font-semibold text-white">Search History & State</p>
                  <p className="text-body-xs text-neutral-400 mt-0.5">
                    {liked?.length || 0} Liked Songs · {playlists?.length || 0} Playlists · {history?.length || 0} Tracks
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('pulse_search_history');
                    alert('Search history cleared.');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-white/10 text-[12px] text-neutral-300 hover:text-white hover:border-white/30 cursor-pointer bg-[#18181a]"
                >
                  Clear History
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}
