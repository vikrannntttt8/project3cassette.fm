import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function SettingsModal({ isOpen, onClose }) {
  const {
    liked,
    playlists,
    history,
    syncAllWithCloud,
    importPlaylistFromUrl,
    importSpotifyPlaylistFromUrl,
    audioQuality,
    setAudioQuality,
    activeStreamMeta,
    isSettingsOpen,
    closeSettings,
    settingsSubPage,
    openSettingsSubPage,
    closeSettingsSubPage,
  } = usePlayer();

  const settings = useSettings();

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

  const isModalOpen = isOpen !== undefined ? isOpen : isSettingsOpen;
  const dismissSettings = onClose || closeSettings;
  const currentSubPage = settingsSubPage;

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

  // ── Public Playlist URL Importer State (YouTube) ───────────────────
  const [importUrl, setImportUrl] = useState('');
  const [importingUrl, setImportingUrl] = useState(false);
  const [importUrlStatus, setImportUrlStatus] = useState(null);

  // ── Spotify Playlist URL Importer State ───────────────────────────
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [spotifyImporting, setSpotifyImporting] = useState(false);
  const [spotifyProgress, setSpotifyProgress] = useState(null);
  const [spotifyStatus, setSpotifyStatus] = useState(null);
  const spotifyAbortRef = useRef(null);

  useEffect(() => {
    if (isModalOpen) {
      setSupabaseUrl(credentials.url || '');
      setSupabaseKey(credentials.anonKey || '');
      setAuthError(null);
      setSyncStatus(null);
      setImportUrlStatus(null);
    }
  }, [isModalOpen, credentials]);

  // Escape key close or navigate back to main menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (currentSubPage) {
          closeSettingsSubPage();
        } else {
          dismissSettings();
        }
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentSubPage, closeSettingsSubPage, dismissSettings]);

  if (!isModalOpen) return null;

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

  // ── Public Spotify Playlist URL Importer & Fuzzy Matcher ───────────
  const handleImportSpotify = async () => {
    if (!spotifyUrl.trim()) return;
    setSpotifyImporting(true);
    setSpotifyStatus(null);
    setSpotifyProgress({ current: 0, total: 0, percent: 0, currentTrack: null, matchedCount: 0 });

    const controller = new AbortController();
    spotifyAbortRef.current = controller;

    try {
      const res = await importSpotifyPlaylistFromUrl(
        spotifyUrl.trim(),
        (prog) => setSpotifyProgress(prog),
        { signal: controller.signal }
      );
      setSpotifyStatus({
        type: 'success',
        text: `Successfully imported "${res.playlist.title}"! Matched ${res.matchedCount} of ${res.count} tracks on YouTube Music.`,
      });
      setSpotifyUrl('');
      setTimeout(() => setSpotifyStatus(null), 10000);
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
        setSpotifyStatus({ type: 'info', text: 'Spotify import stopped.' });
      } else {
        setSpotifyStatus({
          type: 'error',
          text: err.message || 'Failed to import Spotify playlist. Please check that the URL is public.',
        });
      }
    } finally {
      setSpotifyImporting(false);
      spotifyAbortRef.current = null;
    }
  };

  const handleCancelSpotify = () => {
    if (spotifyAbortRef.current) {
      spotifyAbortRef.current.abort();
    }
  };

  // ── 5 Categorized Settings Sections ──
  const CATEGORIES = [
    {
      id: 'interface',
      label: 'Interface & Behavior',
      description: 'Modal back gesture, drawer closing, layout styles & themes',
      icon: 'tune',
      badgeBg: 'bg-white/10 text-white border border-white/15',
    },
    {
      id: 'quality',
      label: 'Quality & Playback',
      description: 'Audio streaming fidelity, volume normalize, crossfade & radio',
      icon: 'graphic_eq',
      badgeBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    },
    {
      id: 'content',
      label: 'Content & Language',
      description: 'Regional music charts, explicit filter & data saver mode',
      icon: 'language',
      badgeBg: 'bg-sky-500/15 text-sky-400 border border-sky-500/25',
    },
    {
      id: 'backup',
      label: 'Backup & Import',
      description: 'YouTube & Spotify playlist sync, JSON backup & restore',
      icon: 'cloud_sync',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    },
    {
      id: 'devices',
      label: 'About & Diagnostics',
      description: 'OPUS stream pipeline diagnostics & browser cache cleaner',
      icon: 'info',
      badgeBg: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
    },
  ];

  const activeCategoryObj = currentSubPage === 'account'
    ? { id: 'account', label: 'Account & Cloud Sync', icon: 'account_circle', badgeBg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25' }
    : CATEGORIES.find((c) => c.id === currentSubPage);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div
        className="w-full sm:max-w-2xl bg-[#101012] sm:border sm:border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-[90vh] sm:max-h-[820px] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Native Mobile Header with Single Left Back Arrow (Zero Redundant Close Buttons) ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5 bg-[#141416] flex-shrink-0 pt-safe">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (currentSubPage) {
                  closeSettingsSubPage();
                } else {
                  dismissSettings();
                }
              }}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 active:scale-95 flex-shrink-0"
              aria-label={currentSubPage ? 'Back to Settings' : 'Back'}
              title={currentSubPage ? 'Back to Settings' : 'Back'}
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
        </div>

        {/* ── Main Body: Vertical Category List OR Drill-Down Sub-Page ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-[#0e0e0e] no-scrollbar pb-safe">
          {currentSubPage ? (
            /* ── Drill-down Dedicated Sub-Page Controls ────────────── */
            <div className="w-full max-w-xl mx-auto space-y-4 pb-12 animate-fade-in">
              {renderActiveCategory(currentSubPage)}
            </div>
          ) : (
            /* ── Main Settings Menu (Vertical Category List) ──────── */
            <div className="w-full max-w-xl mx-auto space-y-3.5 pb-12 animate-fade-in">
              {/* Primary Account & Cloud Sync Row */}
              <button
                type="button"
                onClick={() => openSettingsSubPage('account')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141416] hover:bg-[#1c1c1f] border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between gap-3 text-left group active:scale-[0.99] shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {user ? (
                    user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata?.picture}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full border border-accent/40 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-accent text-black font-bold flex items-center justify-center text-label-md flex-shrink-0">
                        {(user.email || 'U')[0].toUpperCase()}
                      </div>
                    )
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <span className="material-symbols-outlined text-[19px]">account_circle</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-label-md font-bold text-white truncate group-hover:text-accent transition-colors leading-tight">
                      {user ? (user.user_metadata?.full_name || user.user_metadata?.name || user.email) : 'Account & Cloud Sync'}
                    </p>
                    <p className="text-body-xs text-neutral-400 truncate mt-0.5">
                      {user ? 'Google Connected · Library Synced' : 'Sign in to sync your playlists and liked songs'}
                    </p>
                  </div>
                </div>

                <span className="material-symbols-outlined text-[17px] text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0">
                  chevron_right
                </span>
              </button>

              {/* Section Header */}
              <div className="pt-1.5 px-1">
                <p className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-500 font-bold">
                  PREFERENCES
                </p>
              </div>

              {/* Sleek Compact Vertical Category Rows */}
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => openSettingsSubPage(cat.id)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141416] hover:bg-[#1c1c1f] border border-white/5 hover:border-white/15 transition-all text-left flex items-center justify-between gap-3 group cursor-pointer active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${cat.badgeBg}`}>
                        <span className="material-symbols-outlined text-[19px]">{cat.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-label-md font-bold text-white group-hover:text-accent transition-colors truncate leading-tight">
                          {cat.label}
                        </h3>
                        <p className="text-body-xs text-neutral-400 mt-0.5 line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-[17px] text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0">
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

  // ── Monochrome UI Atoms (Sleek Black/White minimal design) ─────────
  function MonochromeToggle({ label, subtitle, checked, onChange, disabled = false }) {
    return (
      <div className="px-4 py-3.5 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white leading-tight">{label}</p>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
            checked ? 'bg-white' : 'bg-neutral-800 border border-white/10'
          }`}
          aria-pressed={checked}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${
              checked ? 'translate-x-5 bg-black' : 'translate-x-0 bg-neutral-400'
            }`}
          />
        </button>
      </div>
    );
  }

  function MonochromeSelect({ label, subtitle, value, onChange, options = [] }) {
    return (
      <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white leading-tight">{label}</p>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[#111113] border border-white/10 text-white text-xs font-semibold focus:border-white focus:outline-none cursor-pointer flex-shrink-0"
        >
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // ── Public YouTube Playlist / Track Importer Component ─────────────
  function renderPlaylistUrlImporterSection() {
    return (
      <div className="rounded-xl border border-white/10 bg-[#141416] p-3.5 sm:p-4 shadow-lg space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10.5px] uppercase tracking-widest text-accent font-mono font-semibold">
                Library Importer · YouTube & YT Music
              </p>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-semibold">
                No Cookies Needed
              </span>
            </div>
            <h3 className="text-title-sm font-bold text-white mt-1">
              Import YouTube Playlist or Album
            </h3>
            <p className="text-body-xs text-neutral-400 mt-0.5 max-w-md">
              Paste any public or unlisted YouTube / YouTube Music playlist URL to seamlessly import tracks into your library or merge into Liked Songs.
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">download</span>
          </div>
        </div>

        {importUrlStatus && (
          <div
            className={`p-3 rounded-lg text-body-xs font-medium flex items-center gap-2 ${
              importUrlStatus.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/40 border border-red-800/60 text-red-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] flex-shrink-0">
              {importUrlStatus.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="flex-1">{importUrlStatus.text}</span>
          </div>
        )}

        {/* URL Input */}
        <div className="space-y-2.5 pt-0.5">
          <div>
            <label className="block text-[10.5px] font-mono uppercase text-neutral-400 mb-1">
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
                className="w-full pl-3 pr-8 py-2 rounded-lg bg-[#111113] border border-white/10 text-white font-mono text-body-xs focus:border-accent focus:outline-none placeholder:text-neutral-600"
              />
              {importUrl && (
                <button
                  type="button"
                  onClick={() => setImportUrl('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
            </div>
            <p className="text-[10.5px] text-neutral-500 mt-1">
              Supports playlists (`?list=...`), albums, and mix URLs. Set to Public or Unlisted on YouTube.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleImportPlaylistUrl('playlist')}
              disabled={importingUrl || !importUrl.trim()}
              className="px-3.5 py-2 rounded-lg bg-accent hover:brightness-110 text-black font-bold text-label-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[15px] ${importingUrl ? 'animate-spin' : ''}`}>
                {importingUrl ? 'sync' : 'playlist_add'}
              </span>
              {importingUrl ? 'Importing...' : 'Import as Playlist'}
            </button>

            <button
              onClick={() => handleImportPlaylistUrl('liked')}
              disabled={importingUrl || !importUrl.trim()}
              className="px-3 py-2 rounded-lg bg-[#222225] hover:bg-[#2c2c30] text-neutral-200 hover:text-white text-label-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[15px] text-rose-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
              Merge Liked
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Public Spotify Playlist URL Importer & Fuzzy Matcher Component ──
  function renderSpotifyPlaylistImporterSection() {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#141416] p-4 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10.5px] uppercase tracking-widest text-emerald-400 font-mono font-semibold">
                Library Importer · Spotify Matcher
              </p>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Fuzzy Auto-Matcher
              </span>
            </div>
            <h3 className="text-title-sm font-bold text-white mt-1">
              Import &amp; Match Spotify Playlists
            </h3>
            <p className="text-body-xs text-neutral-400 mt-0.5 max-w-md">
              Paste public Spotify playlist or album URLs. cassette.fm sequentially maps each track to YouTube Music OPUS audio streams.
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
          </div>
        </div>

        {spotifyStatus && (
          <div
            className={`p-3 rounded-xl text-body-xs font-medium flex items-center gap-2 ${
              spotifyStatus.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                : spotifyStatus.type === 'info'
                ? 'bg-amber-950/40 border border-amber-800/60 text-amber-300'
                : 'bg-red-950/40 border border-red-800/60 text-red-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] flex-shrink-0">
              {spotifyStatus.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="flex-1">{spotifyStatus.text}</span>
          </div>
        )}

        {/* URL Input */}
        <div className="space-y-2.5">
          <div className="relative">
            <input
              type="text"
              value={spotifyUrl}
              disabled={spotifyImporting}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && spotifyUrl.trim() && !spotifyImporting) {
                  handleImportSpotify();
                }
              }}
              placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
              className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[#111113] border border-white/10 text-white font-mono text-body-xs focus:border-white focus:outline-none placeholder:text-neutral-600 disabled:opacity-50"
            />
            {spotifyUrl && !spotifyImporting && (
              <button
                type="button"
                onClick={() => setSpotifyUrl('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>

          {/* Real-time Progress Bar */}
          {spotifyImporting && spotifyProgress && (
            <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/10 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px] text-emerald-400 animate-spin">sync</span>
                  Matching: {spotifyProgress.current} of {spotifyProgress.total} tracks
                </span>
                <span className="font-mono text-emerald-400 font-bold">{spotifyProgress.percent}%</span>
              </div>

              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${spotifyProgress.percent}%` }}
                />
              </div>

              {spotifyProgress.currentTrack && (
                <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                  <p className="truncate max-w-[280px]">
                    <span className="text-neutral-200 font-medium">{spotifyProgress.currentTrack.title}</span> — {spotifyProgress.currentTrack.artist}
                  </p>
                  <span className="font-mono text-emerald-300">
                    {spotifyProgress.matchedCount} resolved
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-1 flex items-center gap-2">
            {!spotifyImporting ? (
              <button
                onClick={handleImportSpotify}
                disabled={!spotifyUrl.trim()}
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[15px] text-emerald-600">sync_alt</span>
                Sync Spotify Playlist
              </button>
            ) : (
              <button
                onClick={handleCancelSpotify}
                className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">stop</span>
                Stop / Cancel
              </button>
            )}
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
          <div className="space-y-5 animate-fade-in">
            <div className="pb-0.5">
              <h3 className="text-title-md font-bold text-white">Quality &amp; Playback</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Tune stream fidelity, normalization, and radio playback.
              </p>
            </div>

            {/* ── Stream Quality picker ── */}
            <div>
              <p className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-500 font-bold mb-2 px-1">STREAM QUALITY</p>
              <div className="rounded-2xl bg-neutral-900/60 border border-white/5 overflow-hidden">
                <div className="px-4 pt-3.5 pb-3 border-b border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-label-md font-bold text-white">Audio Fidelity</h4>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">
                        High-bitrate OPUS from YouTube Music backend.
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'max',       label: 'Maximum (256k)', detail: 'High-Res OPUS' },
                      { id: 'standard',  label: 'Balanced (160k)', detail: 'Smooth Bandwidth' },
                      { id: 'datasaver', label: 'Data Saver (128k)', detail: 'Minimal Usage' },
                    ].map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleQualityChange(q.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          audioQuality === q.id
                            ? 'bg-accent/15 border-accent text-accent font-bold'
                            : 'bg-black/30 border-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <p className="text-label-sm font-bold">{q.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{q.detail}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Playback toggles grouped card ── */}
            <div>
              <p className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-500 font-bold mb-2 px-1">PLAYBACK</p>
              <div className="rounded-2xl bg-neutral-900/60 border border-white/5 overflow-hidden divide-y divide-white/[0.05]">

                {/* Normalize row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-label-md font-semibold text-white">Normalize Volume</p>
                    <p className="text-xs text-neutral-400 truncate">Equalize gain across album masters</p>
                  </div>
                  <button
                    onClick={handleNormalizeToggle}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      normalizeAudio ? 'bg-accent' : 'bg-neutral-700'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      normalizeAudio ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Smart Radio row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-label-md font-semibold text-white">Smart Radio Queue</p>
                    <p className="text-xs text-neutral-400 truncate">Auto-fetch tracks when queue ends</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !smartRecs;
                      setSmartRecs(next);
                      localStorage.setItem('pulse_smart_recs', String(next));
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      smartRecs ? 'bg-accent' : 'bg-neutral-700'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      smartRecs ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Crossfade row */}
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-label-md font-semibold text-white">Crossfade Duration</p>
                      <p className="text-xs text-neutral-400 truncate">Fade between ending and next song</p>
                    </div>
                    <span className="text-label-xs font-mono font-bold text-accent px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 flex-shrink-0">
                      {crossfade}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={crossfade}
                    onChange={(e) => handleCrossfadeChange(Number(e.target.value))}
                    className="w-full accent-white bg-neutral-800 h-1.5 rounded-full cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      // ── 2. Interface & Behavior (Monochrome Style) ─────────────────
      case 'interface':
        return (
          <div className="space-y-6 animate-fade-in text-white pb-6">
            <div className="pb-0.5">
              <h3 className="text-title-md font-bold text-white tracking-tight">Interface &amp; Behavior</h3>
              <p className="text-body-xs text-neutral-400 mt-0.5">
                Customize navigation back gestures, modal closing, view presentation, and feed layout.
              </p>
            </div>

            {/* 1. NAVIGATION & MODAL BEHAVIOR */}
            <div className="space-y-2">
              <p className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-500 font-bold px-1">
                NAVIGATION &amp; MODAL BEHAVIOR
              </p>
              <div className="rounded-2xl bg-[#141416] border border-white/10 overflow-hidden divide-y divide-white/5 shadow-lg">
                <MonochromeToggle
                  label="Intercept Back to Close Modals"
                  subtitle="Dismiss topmost drawers and modals first before routing backward in history"
                  checked={settings.interceptBackToCloseModals}
                  onChange={settings.setInterceptBackToCloseModals}
                />

                <MonochromeToggle
                  label="Close Drawers on Navigation"
                  subtitle="Automatically close open drawers (lyrics, queue, settings) when switching main views"
                  checked={settings.closeModalsOnNavigation}
                  onChange={settings.setCloseModalsOnNavigation}
                />

                <MonochromeSelect
                  label="Now Playing View Mode"
                  subtitle="Configure how the expanded player sheet is presented"
                  value={settings.nowPlayingViewMode}
                  onChange={settings.setNowPlayingViewMode}
                  options={[
                    { value: 'Fullscreen', label: 'Fullscreen Sheet' },
                    { value: 'Floating Drawer', label: 'Floating Drawer' },
                    { value: 'Mini Bar', label: 'Compact Mini Bar' },
                  ]}
                />

                <MonochromeSelect
                  label="Cover Art Click Action"
                  subtitle="Action executed when tapping album artwork in player"
                  value={settings.coverClickAction}
                  onChange={settings.setCoverClickAction}
                  options={[
                    { value: 'Show Track Info', label: 'Show Track / Album Info' },
                    { value: 'Toggle Play/Pause', label: 'Toggle Play / Pause' },
                    { value: 'Exit Fullscreen', label: 'Exit Fullscreen Sheet' },
                  ]}
                />
              </div>
            </div>

            {/* 2. INTERFACE & LAYOUT PREFERENCES */}
            <div className="space-y-2">
              <p className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-500 font-bold px-1">
                INTERFACE &amp; LAYOUT PREFERENCES
              </p>
              <div className="rounded-2xl bg-[#141416] border border-white/10 overflow-hidden divide-y divide-white/5 shadow-lg">
                <MonochromeToggle
                  label="Compact Artist Lists"
                  subtitle="Switch between card grids and dense horizontal row lists for artists"
                  checked={settings.compactArtists}
                  onChange={settings.setCompactArtists}
                />

                <MonochromeToggle
                  label="Compact Album Lists"
                  subtitle="Switch between card grids and dense horizontal row lists for albums"
                  checked={settings.compactAlbums}
                  onChange={settings.setCompactAlbums}
                />

                <MonochromeToggle
                  label="Artist Page Hero Banners"
                  subtitle="Display prominent video / high-resolution hero banners on artist profile pages"
                  checked={settings.artistBanners}
                  onChange={settings.setArtistBanners}
                />

                <MonochromeToggle
                  label="Show Quick Picks Feed"
                  subtitle="Show instant YouTube Music radio recommendation picks on home screen"
                  checked={settings.showQuickPicks}
                  onChange={settings.setShowQuickPicks}
                />

                <MonochromeToggle
                  label="Show Listen Again Feed"
                  subtitle="Show recently played and quick replay shelf on home screen"
                  checked={settings.showListenAgain}
                  onChange={settings.setShowListenAgain}
                />
              </div>
            </div>

            {/* 3. MOBILE DOCK / NAV VISIBILITY */}
            <div className="space-y-2">
              <p className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-500 font-bold px-1">
                NAVIGATION BAR DESTINATIONS
              </p>
              <div className="rounded-2xl bg-[#141416] border border-white/10 overflow-hidden divide-y divide-white/5 shadow-lg">
                <MonochromeToggle
                  label="Home Tab"
                  subtitle="Display Home feed destination in desktop sidebar & mobile dock"
                  checked={settings.navVisibility?.home !== false}
                  onChange={() => settings.toggleNavDestination('home')}
                />

                <MonochromeToggle
                  label="Radio Tab"
                  subtitle="Display Radio / Instant Mixes in navigation bars"
                  checked={settings.navVisibility?.radio !== false}
                  onChange={() => settings.toggleNavDestination('radio')}
                />

                <MonochromeToggle
                  label="Explore Tab"
                  subtitle="Display Explore / Search quick launcher in mobile bottom dock"
                  checked={settings.navVisibility?.explore !== false}
                  onChange={() => settings.toggleNavDestination('explore')}
                />

                <MonochromeToggle
                  label="Library Tab"
                  subtitle="Display Library, Playlists & Liked songs destination"
                  checked={settings.navVisibility?.library !== false}
                  onChange={() => settings.toggleNavDestination('library')}
                />

                <MonochromeToggle
                  label="Settings Tab"
                  subtitle="Display quick Settings icon in mobile bottom dock"
                  checked={settings.navVisibility?.settings !== false}
                  onChange={() => settings.toggleNavDestination('settings')}
                />
              </div>
            </div>

            {/* 4. THEMES & ACCENT ENGINE */}
            <div className="space-y-2">
              <p className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-500 font-bold px-1">
                THEMES &amp; TYPOGRAPHY
              </p>
              <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-4 shadow-lg">
                <div>
                  <h4 className="text-label-md font-bold text-white">Accent Palette Mode</h4>
                  <p className="text-body-xs text-neutral-400 mt-0.5">
                    Choose between dynamic cover art colors, clean monochrome B&W, or custom palettes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setThemeMode('default')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                      themeMode === 'default'
                        ? 'bg-[#1e1e22] border-white ring-2 ring-white shadow-md'
                        : 'bg-[#101012] border-white/5 hover:border-white/20 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="material-symbols-outlined text-[20px] text-white">contrast</span>
                      <span className="w-4.5 h-4.5 rounded-full bg-white border border-white/20 shadow-sm" />
                    </div>
                    <div>
                      <span className="text-label-sm font-bold text-white block">Default (Monochrome)</span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">Clean B&W minimal</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemeMode('dynamic')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                      themeMode === 'dynamic'
                        ? 'bg-[#1e1e22] border-white/40 ring-2 ring-accent shadow-md'
                        : 'bg-[#101012] border-white/5 hover:border-white/20 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: extractedColor }}>auto_awesome</span>
                      <span className="w-4.5 h-4.5 rounded-full border border-white/20 shadow-sm transition-colors duration-500" style={{ backgroundColor: extractedColor }} />
                    </div>
                    <div>
                      <span className="text-label-sm font-bold text-white block">Dynamic (Album Art)</span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">Real-time cover color</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemeMode('custom')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                      themeMode === 'custom'
                        ? 'bg-[#1e1e22] border-white/40 ring-2 ring-accent shadow-md'
                        : 'bg-[#101012] border-white/5 hover:border-white/20 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: customColor }}>palette</span>
                      <span className="w-4.5 h-4.5 rounded-full border border-white/20 shadow-sm transition-colors" style={{ backgroundColor: customColor }} />
                    </div>
                    <div>
                      <span className="text-label-sm font-bold text-white block">Custom Palette</span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">Pick any hex swatch</span>
                    </div>
                  </button>
                </div>

                {themeMode === 'custom' && (
                  <div className="p-3 rounded-xl bg-[#101012] border border-white/10 space-y-2.5 animate-fade-in">
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {presetPalettes.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setCustomColor(p.hex)}
                          title={p.name}
                          className={`h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                            customColor.toLowerCase() === p.hex.toLowerCase()
                              ? 'border-white scale-105 shadow-md ring-2 ring-white/40'
                              : 'border-white/10 hover:scale-105'
                          }`}
                          style={{ backgroundColor: p.hex }}
                        >
                          {customColor.toLowerCase() === p.hex.toLowerCase() && (
                            <span className="material-symbols-outlined text-[14px] text-black font-bold">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Appearance Details Card */}
              <div className="rounded-2xl bg-[#141416] border border-white/10 overflow-hidden divide-y divide-white/5 shadow-lg">
                <MonochromeToggle
                  label="Dynamic Ambient Glow"
                  subtitle="Diffuse cover art colors into background radial glow"
                  checked={ambientGlow}
                  onChange={(val) => {
                    setAmbientGlow(val);
                    localStorage.setItem('pulse_ambient_glow', String(val));
                  }}
                />

                <MonochromeToggle
                  label="Romanized Phonetic Lyrics"
                  subtitle="Display Romaji, Pinyin, and Hindi romanized pronunciation"
                  checked={romanizedLyrics}
                  onChange={(val) => {
                    setRomanizedLyrics(val);
                    localStorage.setItem('pulse_romanized', String(val));
                  }}
                />

                <MonochromeSelect
                  label="Synced Lyrics Font Size"
                  subtitle="Adjust text size inside full-screen lyrics sheet"
                  value={lyricFontSize}
                  onChange={(val) => {
                    setLyricFontSize(val);
                    localStorage.setItem('pulse_lyric_size', val);
                  }}
                  options={[
                    { value: 'compact', label: 'Compact' },
                    { value: 'normal', label: 'Standard' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </div>
            </div>
          </div>
        );

      // ── 3. Content & Language ──────────────────────────────────────
      case 'content':
        return (
          <div className="space-y-3 animate-fade-in">
            <div className="pb-0.5">
              <h3 className="text-title-md font-bold text-white">Content & Language</h3>
              <p className="text-body-xs text-neutral-400 mt-0.5">
                Filter regions, explicit lyrics, data usage, and track resume behavior.
              </p>
            </div>

            {/* Region / Language Dropdown */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#141416] border border-white/10 space-y-2.5 shadow-lg">
              <div>
                <label className="block text-label-md font-bold text-white mb-0.5">
                  Preferred Music Region & Charts
                </label>
                <p className="text-body-xs text-neutral-400 mb-2">
                  Tailor home feed recommendations and trending playlists to your local language
                </p>
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  localStorage.setItem('pulse_music_lang', e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#101012] border border-white/10 text-white text-body-sm font-semibold focus:border-accent focus:outline-none cursor-pointer"
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


            {/* â”€â”€ Content toggles grouped card â”€â”€ */}
            <div>
              <p className="text-[10.5px] font-mono uppercase tracking-widest text-neutral-500 font-bold mb-2 px-1">FILTERS</p>
              <div className="rounded-2xl bg-neutral-900/60 border border-white/5 overflow-hidden divide-y divide-white/[0.05]">

                {/* Explicit Filter row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-label-md font-semibold text-white">Filter Explicit Content</p>
                    <p className="text-xs text-neutral-400 truncate">Hide explicit tracks from feeds</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !explicitFilter;
                      setExplicitFilter(next);
                      localStorage.setItem('pulse_explicit_filter', String(next));
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      explicitFilter ? 'bg-accent' : 'bg-neutral-700'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      explicitFilter ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Remember Last Song row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-label-md font-semibold text-white">Remember Last Song</p>
                    <p className="text-xs text-neutral-400 truncate">Restore position on next launch</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !rememberLastSong;
                      setRememberLastSong(next);
                      localStorage.setItem('pulse_remember_song', String(next));
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      rememberLastSong ? 'bg-accent' : 'bg-neutral-700'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      rememberLastSong ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Data Saver row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-label-md font-semibold text-white">Data Saver Mode</p>
                    <p className="text-xs text-neutral-400 truncate">Lightweight 128k on mobile networks</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !dataSaver;
                      setDataSaver(next);
                      localStorage.setItem('pulse_data_saver', String(next));
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      dataSaver ? 'bg-accent' : 'bg-neutral-700'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      dataSaver ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>


            {/* Listening Stats Overview Card */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#141416] border border-white/10 space-y-2.5 shadow-lg">
              <h4 className="text-label-md font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-accent">bar_chart</span>
                Personal Library Metrics
              </h4>
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <div className="p-2.5 rounded-lg bg-[#101012] border border-white/5 text-center">
                  <span className="text-[9.5px] font-mono text-neutral-400 block uppercase">Liked</span>
                  <span className="text-title-sm font-extrabold text-accent mt-0.5 block">{liked?.length || 0}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#101012] border border-white/5 text-center">
                  <span className="text-[9.5px] font-mono text-neutral-400 block uppercase">Playlists</span>
                  <span className="text-title-sm font-extrabold text-white mt-0.5 block">{playlists?.length || 0}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#101012] border border-white/5 text-center">
                  <span className="text-[9.5px] font-mono text-neutral-400 block uppercase">History</span>
                  <span className="text-title-sm font-extrabold text-white mt-0.5 block">{history?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // ── 4. Account & Cloud ─────────────────────────────────────────
      case 'account':
        return (
          <div className="space-y-3 animate-fade-in">
            <div className="pb-0.5">
              <h3 className="text-title-md font-bold text-white">Account & Cloud</h3>
              <p className="text-body-xs text-neutral-400 mt-0.5">
                Manage cloud sync for your library, playlists, and listening preferences.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#141416] p-3.5 sm:p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10.5px] uppercase tracking-widest text-accent font-mono font-semibold">
                    Cloud Account & Sync
                  </p>
                  <h3 className="text-title-sm font-bold text-white mt-1">
                    {user ? 'Google Account Connected' : 'Connect with Google'}
                  </h3>
                  <p className="text-body-xs text-neutral-400 mt-0.5 max-w-md">
                    {user
                      ? 'Your playlists, liked songs, and listening stats are backed up to Supabase Cloud.'
                      : 'Sign in to automatically sync your library across desktop and mobile devices.'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {user ? 'verified_user' : 'cloud_sync'}
                  </span>
                </div>
              </div>

              {authError && (
                <div className="mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-body-xs">
                  {authError}
                </div>
              )}

              {user ? (
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata?.picture}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full border border-accent/40 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-accent text-black font-bold flex items-center justify-center text-label-sm">
                        {(user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-label-sm font-bold text-white leading-tight">
                        {user.user_metadata?.full_name || user.user_metadata?.name || 'cassette Listener'}
                      </p>
                      <p className="text-[11px] font-mono text-neutral-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleManualSync}
                      disabled={syncLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-accent text-black text-label-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-[15px] ${syncLoading ? 'animate-spin' : ''}`}>
                        sync
                      </span>
                      {syncLoading ? 'Syncing...' : 'Sync Cloud'}
                    </button>
                    <button
                      onClick={() => openAuthModal('profile')}
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white text-label-xs transition-colors cursor-pointer"
                    >
                      Profile
                    </button>
                    <button
                      onClick={signOut}
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white text-label-xs transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full py-2.5 px-3.5 rounded-lg bg-white text-black hover:bg-neutral-200 font-bold text-label-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md"
                    >
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                      </svg>
                      Sign in with Google
                    </button>

                    <button
                      onClick={() => openAuthModal('signin')}
                      className="w-full py-2.5 px-3.5 rounded-lg bg-[#222225] border border-white/10 hover:border-white/30 text-white font-bold text-label-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                      Sign in with Email
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowConfigDetails(!showConfigDetails)}
                      className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {showConfigDetails ? 'expand_less' : 'settings'}
                      </span>
                      {showConfigDetails ? 'Hide Cloud Configuration' : 'Configure Custom Supabase Backend'}
                    </button>

                    {showConfigDetails && (
                      <form onSubmit={handleSaveSupabaseConfig} className="mt-2.5 space-y-2.5 p-3 rounded-lg bg-[#111113] border border-white/10">
                        <div>
                          <label className="block text-[10.5px] font-mono uppercase text-neutral-400 mb-1">
                            Supabase Project URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://xyzcompany.supabase.co"
                            value={supabaseUrl}
                            onChange={(e) => setSupabaseUrl(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md bg-[#18181a] border border-white/10 text-white text-body-xs focus:border-accent focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] font-mono uppercase text-neutral-400 mb-1">
                            Supabase Anon Key
                          </label>
                          <input
                            type="password"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={supabaseKey}
                            onChange={(e) => setSupabaseKey(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md bg-[#18181a] border border-white/10 text-white text-body-xs focus:border-accent focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-accent text-black text-label-xs font-bold hover:brightness-110 transition-all cursor-pointer"
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
          <div className="space-y-4 animate-fade-in pb-8 text-white">
            <div className="pb-0.5">
              <h3 className="text-title-md font-bold text-white tracking-tight">Backup &amp; Import</h3>
              <p className="text-body-xs text-neutral-400 mt-0.5">
                Import YouTube &amp; Spotify playlists directly or export/restore your library via JSON.
              </p>
            </div>

            {/* YouTube Playlist URL Importer */}
            {renderPlaylistUrlImporterSection()}

            {/* Spotify Playlist URL Importer & Matcher */}
            {renderSpotifyPlaylistImporterSection()}

            {/* JSON Backup & Restore Card */}
            <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-3 shadow-lg">
              <div>
                <h4 className="text-label-md font-bold text-white">JSON Library Backup &amp; Restore</h4>
                <p className="text-body-xs text-neutral-400 mt-0.5">
                  Export or restore your full cassette.fm library including playlists, liked tracks, and tags.
                </p>
              </div>

              {importStatus && (
                <div
                  className={`p-2.5 rounded-lg text-body-xs font-medium ${
                    importStatus.type === 'error'
                      ? 'bg-red-950/50 border border-red-800 text-red-300'
                      : 'bg-accent/10 border border-accent/30 text-accent'
                  }`}
                >
                  {importStatus.text}
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 pt-0.5">
                <button
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-label-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Export Backup JSON
                </button>

                <label className="px-3.5 py-2 rounded-xl border border-white/10 hover:border-white/30 text-white font-semibold text-label-xs flex items-center gap-1.5 cursor-pointer bg-[#101012] transition-colors">
                  <span className="material-symbols-outlined text-[16px]">upload</span>
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
          <div className="space-y-3 animate-fade-in">
            <div className="pb-0.5">
              <h3 className="text-title-md font-bold text-white">Devices & Engine</h3>
              <p className="text-body-xs text-neutral-400 mt-0.5">
                Inspect active audio pipeline, browser storage diagnostics, and system version.
              </p>
            </div>

            {/* System Diagnostics Card */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#141416] border border-white/10 space-y-3 shadow-lg">
              <h4 className="text-label-md font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-neutral-400 text-[18px]">terminal</span>
                Audio Pipeline Diagnostics
              </h4>

              <div className="space-y-2 font-mono text-[11px] p-3 rounded-lg bg-[#0e0e0e] border border-white/10 text-neutral-300">
                <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                  <span className="text-neutral-500">App Version:</span>
                  <span className="text-accent font-bold">cassette.fm v2.4.0</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                  <span className="text-neutral-500">Audio Codec:</span>
                  <span className="text-white">{activeStreamMeta?.mimeType || 'audio/webm; codecs="opus"'}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                  <span className="text-neutral-500">Stream Format itag:</span>
                  <span className="text-white font-bold">#{activeStreamMeta?.itag || '251'}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-neutral-500">Host Environment:</span>
                  <span className="text-white">Vite PWA · ServiceWorker Ready</span>
                </div>
              </div>
            </div>

            {/* Storage Management Card */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#141416] border border-white/10 space-y-2.5 shadow-lg">
              <h4 className="text-label-md font-bold text-white">Browser Storage Cache</h4>
              <div className="p-3 rounded-lg bg-[#101012] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-label-sm font-semibold text-white">Search History & State</p>
                  <p className="text-body-xs text-neutral-400 mt-0.5 text-[11px]">
                    {liked?.length || 0} Liked · {playlists?.length || 0} Playlists · {history?.length || 0} Tracks
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('pulse_search_history');
                    alert('Search history cleared.');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-neutral-300 hover:text-white hover:border-white/30 cursor-pointer bg-[#141416]"
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
