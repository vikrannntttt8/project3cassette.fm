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
    presetPalettes,
  } = useTheme();

  const isModalOpen = isOpen !== undefined ? isOpen : isSettingsOpen;
  const dismissSettings = onClose || closeSettings;
  const currentSubPage = settingsSubPage;

  // ── Desktop Active Category State ──────────────────────────────────
  const [activeDesktopCategory, setActiveDesktopCategory] = useState(
    () => currentSubPage || 'interface'
  );

  useEffect(() => {
    if (currentSubPage) {
      setActiveDesktopCategory(currentSubPage);
    }
  }, [currentSubPage]);

  // ── Settings Local States ──────────────────────────────────────────
  const [normalizeAudio, setNormalizeAudio] = useState(
    () => localStorage.getItem('pulse_normalize_audio') !== 'false'
  );
  const [ambientGlow, setAmbientGlow] = useState(
    () => localStorage.getItem('pulse_ambient_glow') !== 'false'
  );
  const [crossfadeDuration, setCrossfadeDuration] = useState(
    () => Number(localStorage.getItem('pulse_crossfade')) || 0
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
        text: err.message || 'Failed to sync with Supabase Cloud. Check connection.',
      });
    } finally {
      setSyncLoading(false);
    }
  };

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
    setImportStatus({ type: 'success', text: 'Backup downloaded successfully.' });
    setTimeout(() => setImportStatus(null), 4000);
  };

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
        setImportStatus({ type: 'success', text: 'Backup restored! Reloading library state...' });
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        setImportStatus({ type: 'error', text: 'Invalid JSON backup file.' });
      }
    };
    reader.readAsText(file);
  };

  // ── Public YouTube Playlist Importer ─────────────────────────────────
  const handleImportPlaylistUrl = async (targetType = 'playlist') => {
    if (!importUrl.trim()) return;
    setImportingUrl(true);
    setImportUrlStatus(null);

    try {
      const res = await importPlaylistFromUrl(importUrl.trim(), targetType);
      if (targetType === 'liked') {
        setImportUrlStatus({
          type: 'success',
          text: `Imported ${res.count} tracks into Liked Songs!`,
        });
      } else {
        setImportUrlStatus({
          type: 'success',
          text: `Imported "${res.playlist.title}" (${res.count} tracks)!`,
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

  // ── All 6 Categorized Settings Sections ──
  const ALL_CATEGORIES = [
    {
      id: 'account',
      label: 'Account & Cloud Sync',
      description: 'Google login, Supabase cloud library backup & device sync',
      icon: 'account_circle',
      badgeBg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
    },
    {
      id: 'interface',
      label: 'Interface & Behavior',
      description: 'Back gestures, drawer controls, layout modes & themes',
      icon: 'tune',
      badgeBg: 'bg-white/10 text-white border border-white/15',
    },
    {
      id: 'quality',
      label: 'Quality & Playback',
      description: 'High-bitrate OPUS, volume normalize, crossfade & radio',
      icon: 'graphic_eq',
      badgeBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    },
    {
      id: 'content',
      label: 'Content & Language',
      description: 'Regional charts, explicit filter, offline data saver',
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
      description: 'OPUS stream pipeline diagnostics & storage cache cleaner',
      icon: 'terminal',
      badgeBg: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
    },
  ];

  const getCategoryObj = (catId) => ALL_CATEGORIES.find((c) => c.id === catId) || ALL_CATEGORIES[1];
  const activeCategoryObj = getCategoryObj(currentSubPage || activeDesktopCategory);

  // ── Monochrome Card Architecture Components ───────────────────────
  function MonochromeCard({ title, subtitle, icon, children, headerAction, className = '' }) {
    return (
      <div className={`rounded-2xl bg-neutral-900/50 border border-white/5 overflow-hidden shadow-lg ${className}`}>
        {(title || subtitle || icon) && (
          <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between gap-3 bg-white/[0.015]">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white flex-shrink-0">
                  <span className="material-symbols-outlined text-[17px]">{icon}</span>
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
                {subtitle && <p className="text-xs text-neutral-400 truncate mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
          </div>
        )}
        <div className="divide-y divide-white/5">
          {children}
        </div>
      </div>
    );
  }

  function MonochromeToggle({ label, subtitle, icon, checked, onChange, disabled = false }) {
    return (
      <div className="py-3.5 px-4 flex items-center justify-between gap-3.5 hover:bg-white/[0.025] transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white flex-shrink-0">
              <span className="material-symbols-outlined text-[17px]">{icon}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white leading-tight">{label}</p>
            {subtitle && <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{subtitle}</p>}
          </div>
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

  function MonochromeSelect({ label, subtitle, icon, value, onChange, options = [] }) {
    return (
      <div className="py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-white/[0.025] transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white flex-shrink-0">
              <span className="material-symbols-outlined text-[17px]">{icon}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white leading-tight">{label}</p>
            {subtitle && <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{subtitle}</p>}
          </div>
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

  // ── Render Category Content (De-chunked ArchiveTune Layout) ─────────
  function renderActiveCategory(targetCategory) {
    switch (targetCategory) {
      // ── 1. Quality & Playback ──────────────────────────────────────
      case 'quality':
        return (
          <div className="space-y-6 animate-fade-in text-white pb-6">
            <MonochromeCard
              title="Streaming Audio Quality & Codec"
              subtitle="High-bitrate audio streams and direct encoding selection"
              icon="graphic_eq"
            >
              <div className="p-4 bg-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'max',       label: 'Maximum (256k)', detail: 'High-Res OPUS Audio' },
                    { id: 'standard',  label: 'Balanced (160k)', detail: 'Smooth Bandwidth' },
                    { id: 'datasaver', label: 'Data Saver (128k)', detail: 'Minimal Mobile Data' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleQualityChange(q.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        audioQuality === q.id
                          ? 'bg-white text-black font-bold border-white shadow-md'
                          : 'bg-[#101012] border-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <p className="text-sm font-bold">{q.label}</p>
                      <p className={`text-xs mt-0.5 ${audioQuality === q.id ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        {q.detail}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <MonochromeSelect
                icon="code"
                label="Audio Codec Format"
                subtitle="Select specific audio stream container preference"
                value={settings.audioCodec || 'auto'}
                onChange={settings.setAudioCodec}
                options={[
                  { value: 'auto', label: 'Auto (Best Quality OPUS / AAC)' },
                  { value: 'opus', label: 'OPUS (High Fidelity / WebM)' },
                  { value: 'aac', label: 'AAC / MP4 (Universal Compatibility)' },
                ]}
              />
            </MonochromeCard>

            <MonochromeCard
              title="Playback Mechanics & Buffering"
              subtitle="Zero-latency transitions, speed control, and smart radio"
              icon="tune"
            >
              <MonochromeToggle
                icon="speed"
                label="Gapless Audio Engine & Aggressive Prefetch"
                subtitle="Background-fetch next track audio & lyrics at 50% for zero-latency crossfades"
                checked={settings.gaplessPlayback}
                onChange={settings.setGaplessPlayback}
              />

              <MonochromeToggle
                icon="motion_photos_off"
                label="Remove Track Silence"
                subtitle="Skip leading and trailing dead silence on stream transitions"
                checked={settings.removeSilence}
                onChange={settings.setRemoveSilence}
              />

              <MonochromeSelect
                icon="slow_motion_video"
                label="Playback Speed"
                subtitle="Adjust audio reproduction tempo and speed"
                value={String(settings.playbackSpeed || 1.0)}
                onChange={(v) => settings.setPlaybackSpeed(Number(v))}
                options={[
                  { value: '0.5', label: '0.5x (Slowed)' },
                  { value: '0.75', label: '0.75x' },
                  { value: '1', label: '1.0x (Normal)' },
                  { value: '1.25', label: '1.25x' },
                  { value: '1.5', label: '1.5x' },
                  { value: '1.75', label: '1.75x' },
                  { value: '2', label: '2.0x (Fast)' },
                ]}
              />

              <MonochromeToggle
                icon="music_note"
                label="Preserve Pitch on Speed Adjustments"
                subtitle="Lock original musical key and pitch even when speed is changed"
                checked={settings.preservesPitch}
                onChange={settings.setPreservesPitch}
              />

              <MonochromeToggle
                icon="volume_up"
                label="Normalize Volume (ReplayGain)"
                subtitle="Equalize audio levels across albums and varying loudness masters"
                checked={normalizeAudio}
                onChange={handleNormalizeToggle}
              />

              <MonochromeToggle
                icon="radio"
                label="Smart Radio Autoplay"
                subtitle="Automatically queue similar songs from YouTube Music when queue ends"
                checked={smartRecs}
                onChange={() => {
                  const next = !smartRecs;
                  setSmartRecs(next);
                  localStorage.setItem('pulse_smart_recs', String(next));
                }}
              />

              <div className="py-3.5 px-4 space-y-2.5 hover:bg-white/[0.025] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white flex-shrink-0">
                      <span className="material-symbols-outlined text-[17px]">timelapse</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">Crossfade Duration</p>
                      <p className="text-xs text-neutral-400 truncate">Seamlessly blend ending and upcoming track</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 flex-shrink-0">
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
                    const v = Number(e.target.value);
                    setCrossfadeDuration(v);
                    localStorage.setItem('pulse_crossfade', String(v));
                  }}
                  className="w-full accent-white bg-neutral-800 h-1.5 rounded-full cursor-pointer"
                />
              </div>
            </MonochromeCard>
          </div>
        );

      // ── 2. Interface & Behavior ────────────────────────────────────
      case 'interface':
        return (
          <div className="space-y-6 animate-fade-in text-white pb-6">
            <MonochromeCard
              title="Themes & Visual Aesthetics"
              subtitle="Monochrome minimalism, dynamic cover art colors, and typography"
              icon="palette"
            >
              <div className="p-4 space-y-3.5">
                <p className="text-xs font-medium text-neutral-400">Accent Palette Engine</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setThemeMode('default')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                      themeMode === 'default'
                        ? 'bg-white text-black font-bold border-white shadow-md'
                        : 'bg-[#101012] border-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="material-symbols-outlined text-[20px]">contrast</span>
                      <span className="w-4 h-4 rounded-full bg-white border border-black/20 shadow-sm" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block">Monochrome B&amp;W</span>
                      <span className={`text-xs block mt-0.5 ${themeMode === 'default' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        Clean Archive Minimal
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemeMode('dynamic')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                      themeMode === 'dynamic'
                        ? 'bg-neutral-800 text-white font-bold border-white ring-2 ring-white/30 shadow-md'
                        : 'bg-[#101012] border-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: extractedColor }}>auto_awesome</span>
                      <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm transition-colors duration-500" style={{ backgroundColor: extractedColor }} />
                    </div>
                    <div>
                      <span className="text-sm font-bold block">Dynamic Glow</span>
                      <span className="text-xs text-neutral-400 block mt-0.5">Real-time cover color</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemeMode('custom')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                      themeMode === 'custom'
                        ? 'bg-neutral-800 text-white font-bold border-white ring-2 ring-white/30 shadow-md'
                        : 'bg-[#101012] border-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: customColor }}>palette</span>
                      <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm transition-colors" style={{ backgroundColor: customColor }} />
                    </div>
                    <div>
                      <span className="text-sm font-bold block">Custom Palette</span>
                      <span className="text-xs text-neutral-400 block mt-0.5">Pick any hex swatch</span>
                    </div>
                  </button>
                </div>

                {themeMode === 'custom' && (
                  <div className="p-3 rounded-xl bg-[#101012] border border-white/10 space-y-2.5 animate-fade-in mt-2">
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {presetPalettes.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setCustomColor(p.hex)}
                          title={p.name}
                          className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                            customColor.toLowerCase() === p.hex.toLowerCase()
                              ? 'border-white scale-105 shadow-md ring-2 ring-white/40'
                              : 'border-white/10 hover:scale-105'
                          }`}
                          style={{ backgroundColor: p.hex }}
                        >
                          {customColor.toLowerCase() === p.hex.toLowerCase() && (
                            <span className="material-symbols-outlined text-[15px] text-black font-bold">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <MonochromeToggle
                icon="blur_on"
                label="Ambient Background Glow"
                subtitle="Diffuse album cover art colors into background radial aura"
                checked={ambientGlow}
                onChange={(val) => {
                  setAmbientGlow(val);
                  localStorage.setItem('pulse_ambient_glow', String(val));
                }}
              />

              <MonochromeToggle
                icon="translate"
                label="Romanized Phonetic Lyrics"
                subtitle="Display Romaji, Pinyin, and Hindi romanized pronunciation in synced lyrics"
                checked={romanizedLyrics}
                onChange={(val) => {
                  setRomanizedLyrics(val);
                  localStorage.setItem('pulse_romanized', String(val));
                }}
              />

              <MonochromeSelect
                icon="format_size"
                label="Synced Lyrics Font Size"
                subtitle="Adjust line text sizing inside full-screen lyrics sheet"
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
            </MonochromeCard>

            <MonochromeCard
              title="Navigation & Modal Behavior"
              subtitle="Configure modal dismissals, gestures, and view presentation"
              icon="navigation"
            >
              <MonochromeToggle
                icon="arrow_back"
                label="Intercept Back to Close Modals"
                subtitle="Dismiss topmost sheets and dialogs first before routing backward in history"
                checked={settings.interceptBackToCloseModals}
                onChange={settings.setInterceptBackToCloseModals}
              />

              <MonochromeToggle
                icon="close_fullscreen"
                label="Close Drawers on Navigation"
                subtitle="Automatically close open drawers (lyrics, queue, settings) when switching main views"
                checked={settings.closeModalsOnNavigation}
                onChange={settings.setCloseModalsOnNavigation}
              />

              <MonochromeSelect
                icon="dock"
                label="Now Playing View Mode"
                subtitle="Configure how the expanded player sheet is presented"
                value={settings.nowPlayingViewMode}
                onChange={settings.setNowPlayingViewMode}
                options={[
                  { value: 'Fullscreen', label: 'Fullscreen Sheet' },
                  { value: 'Floating Drawer', label: 'Floating Modal Drawer' },
                  { value: 'Mini Bar', label: 'Compact Mini Bar' },
                ]}
              />

              <MonochromeSelect
                icon="touch_app"
                label="Cover Art Tap Action"
                subtitle="Action executed when tapping album artwork in player sheet"
                value={settings.coverClickAction}
                onChange={settings.setCoverClickAction}
                options={[
                  { value: 'Show Track Info', label: 'Show Track / Album Info' },
                  { value: 'Toggle Play/Pause', label: 'Toggle Play / Pause' },
                  { value: 'Exit Fullscreen', label: 'Exit Fullscreen Sheet' },
                ]}
              />
            </MonochromeCard>

            <MonochromeCard
              title="Interface & Layout Preferences"
              subtitle="Customize density and visual headers across feeds and artist views"
              icon="view_compact"
            >
              <MonochromeToggle
                icon="group"
                label="Compact Artist Lists"
                subtitle="Switch between card grids and dense horizontal row lists for artists"
                checked={settings.compactArtists}
                onChange={settings.setCompactArtists}
              />

              <MonochromeToggle
                icon="album"
                label="Compact Album Lists"
                subtitle="Switch between card grids and dense horizontal row lists for albums"
                checked={settings.compactAlbums}
                onChange={settings.setCompactAlbums}
              />

              <MonochromeToggle
                icon="image"
                label="Artist Page Hero Banners"
                subtitle="Display high-resolution hero backdrops on artist profile pages"
                checked={settings.artistBanners}
                onChange={settings.setArtistBanners}
              />

              <MonochromeToggle
                icon="bolt"
                label="Show Quick Picks Feed"
                subtitle="Show instant YouTube Music radio recommendation picks on home screen"
                checked={settings.showQuickPicks}
                onChange={settings.setShowQuickPicks}
              />

              <MonochromeToggle
                icon="history"
                label="Show Listen Again Feed"
                subtitle="Show recently played and quick replay shelf on home screen"
                checked={settings.showListenAgain}
                onChange={settings.setShowListenAgain}
              />
            </MonochromeCard>

            <MonochromeCard
              title="Navigation Destinations"
              subtitle="Toggle visible destinations in desktop sidebar and mobile bottom dock"
              icon="tab"
            >
              <MonochromeToggle
                icon="home"
                label="Home Tab"
                subtitle="Display Home feed destination"
                checked={settings.navVisibility?.home !== false}
                onChange={() => settings.toggleNavDestination('home')}
              />

              <MonochromeToggle
                icon="radio"
                label="Radio Tab"
                subtitle="Display Radio / Instant Mixes destination"
                checked={settings.navVisibility?.radio !== false}
                onChange={() => settings.toggleNavDestination('radio')}
              />

              <MonochromeToggle
                icon="explore"
                label="Explore Tab"
                subtitle="Display Search / Explore launcher"
                checked={settings.navVisibility?.explore !== false}
                onChange={() => settings.toggleNavDestination('explore')}
              />

              <MonochromeToggle
                icon="library_music"
                label="Library Tab"
                subtitle="Display Library, Playlists & Liked songs destination"
                checked={settings.navVisibility?.library !== false}
                onChange={() => settings.toggleNavDestination('library')}
              />

              <MonochromeToggle
                icon="tune"
                label="Settings Tab"
                subtitle="Display quick Settings icon in bottom dock"
                checked={settings.navVisibility?.settings !== false}
                onChange={() => settings.toggleNavDestination('settings')}
              />
            </MonochromeCard>
          </div>
        );

      // ── 3. Content & Language ──────────────────────────────────────
      case 'content':
        return (
          <div className="space-y-6 animate-fade-in text-white pb-6">
            <MonochromeCard
              title="Regional Music Charts & Discovery"
              subtitle="Tailor home feed recommendations and trending charts to your region"
              icon="language"
            >
              <div className="p-4 space-y-2">
                <label className="block text-xs font-semibold text-neutral-400">
                  Select Region &amp; Music Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    localStorage.setItem('pulse_music_lang', e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101012] border border-white/10 text-white text-sm font-semibold focus:border-white focus:outline-none cursor-pointer"
                >
                  <option value="all">Global (All Regions)</option>
                  <option value="en">English (US / UK / Global Pop)</option>
                  <option value="hi">Hindi &amp; Bollywood</option>
                  <option value="pa">Punjabi Pop</option>
                  <option value="es">Latin &amp; Spanish</option>
                  <option value="kr">K-Pop</option>
                  <option value="jp">J-Pop &amp; Anime</option>
                </select>
              </div>
            </MonochromeCard>

            <MonochromeCard
              title="Content Filters & State"
              subtitle="Explicit lyrics filtering, session restore, and bandwidth limits"
              icon="filter_list"
            >
              <MonochromeToggle
                icon="explicit"
                label="Filter Explicit Content"
                subtitle="Hide songs labeled with explicit lyrics tags from feeds and searches"
                checked={explicitFilter}
                onChange={() => {
                  const next = !explicitFilter;
                  setExplicitFilter(next);
                  localStorage.setItem('pulse_explicit_filter', String(next));
                }}
              />

              <MonochromeToggle
                icon="replay"
                label="Remember Last Played Track"
                subtitle="Automatically restore playback position on next launch"
                checked={rememberLastSong}
                onChange={() => {
                  const next = !rememberLastSong;
                  setRememberLastSong(next);
                  localStorage.setItem('pulse_remember_song', String(next));
                }}
              />

              <MonochromeToggle
                icon="data_saver_on"
                label="Mobile Data Saver"
                subtitle="Force lightweight 128k audio streams on cellular connections"
                checked={dataSaver}
                onChange={() => {
                  const next = !dataSaver;
                  setDataSaver(next);
                  localStorage.setItem('pulse_data_saver', String(next));
                }}
              />
            </MonochromeCard>
          </div>
        );

      // ── 4. Account & Cloud ─────────────────────────────────────────
      case 'account':
        return (
          <div className="space-y-6 animate-fade-in text-white pb-6">
            <MonochromeCard
              title="Cloud Synchronization"
              subtitle="Supabase PostgreSQL sync for playlists, liked songs, and history"
              icon="cloud_sync"
              headerAction={
                user && (
                  <button
                    onClick={handleManualSync}
                    disabled={syncLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <span className={`material-symbols-outlined text-[15px] ${syncLoading ? 'animate-spin' : ''}`}>
                      sync
                    </span>
                    {syncLoading ? 'Syncing...' : 'Sync Cloud'}
                  </button>
                )
              }
            >
              {authError && (
                <div className="p-3 bg-red-950/40 border-b border-red-800/60 text-red-300 text-xs">
                  {authError}
                </div>
              )}

              {syncStatus && (
                <div className={`p-3 text-xs font-semibold ${syncStatus.type === 'success' ? 'bg-emerald-950/40 text-emerald-300' : 'bg-red-950/40 text-red-300'}`}>
                  {syncStatus.text}
                </div>
              )}

              <div className="p-4 space-y-4">
                {user ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#101012] border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                        <img
                          src={user.user_metadata.avatar_url || user.user_metadata?.picture}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full border border-white/20 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm flex-shrink-0">
                          {(user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {user.user_metadata?.full_name || user.user_metadata?.name || 'cassette Listener'}
                        </p>
                        <p className="text-xs font-mono text-neutral-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAuthModal('profile')}
                        className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Profile
                      </button>
                      <button
                        onClick={signOut}
                        className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-red-500/40 text-neutral-400 hover:text-red-400 text-xs transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-400">
                      Sign in with your Google or email account to sync your playlists and liked tracks across all desktop and mobile devices.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={handleGoogleSignIn}
                        className="py-2.5 px-4 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                        Sign in with Google
                      </button>

                      <button
                        onClick={() => openAuthModal('signin')}
                        className="py-2.5 px-4 rounded-xl bg-[#1a1a1d] border border-white/10 hover:border-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px]">mail</span>
                        Sign in with Email
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowConfigDetails(!showConfigDetails)}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {showConfigDetails ? 'expand_less' : 'settings'}
                    </span>
                    {showConfigDetails ? 'Hide Custom Backend Credentials' : 'Configure Custom Supabase Project'}
                  </button>

                  {showConfigDetails && (
                    <form onSubmit={handleSaveSupabaseConfig} className="mt-3 space-y-3 p-3.5 rounded-xl bg-[#101012] border border-white/10">
                      <div>
                        <label className="block text-[10.5px] font-mono uppercase text-neutral-400 mb-1">
                          Supabase Project URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://xyzcompany.supabase.co"
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#18181a] border border-white/10 text-white text-xs focus:border-white focus:outline-none"
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
                          className="w-full px-3 py-2 rounded-lg bg-[#18181a] border border-white/10 text-white text-xs focus:border-white focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-all cursor-pointer shadow-sm"
                      >
                        Save Custom Backend
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </MonochromeCard>
          </div>
        );

      // ── 5. Backup & Import ─────────────────────────────────────────
      case 'backup':
        return (
          <div className="space-y-6 animate-fade-in pb-8 text-white">
            {/* YouTube Playlist URL Importer */}
            <MonochromeCard
              title="YouTube / YT Music Playlist Importer"
              subtitle="Directly import public or unlisted YouTube playlists into your library"
              icon="download"
            >
              {importUrlStatus && (
                <div
                  className={`p-3 text-xs font-medium flex items-center gap-2 ${
                    importUrlStatus.type === 'success'
                      ? 'bg-emerald-950/40 border-b border-emerald-800/60 text-emerald-300'
                      : 'bg-red-950/40 border-b border-red-800/60 text-red-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {importUrlStatus.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span>{importUrlStatus.text}</span>
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={importUrl}
                    disabled={importingUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && importUrl.trim() && !importingUrl) {
                        handleImportPlaylistUrl('playlist');
                      }
                    }}
                    placeholder="https://music.youtube.com/playlist?list=... or PL..."
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#101012] border border-white/10 text-white font-mono text-xs focus:border-white focus:outline-none placeholder:text-neutral-600 disabled:opacity-50"
                  />
                  {importUrl && !importingUrl && (
                    <button
                      type="button"
                      onClick={() => setImportUrl('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleImportPlaylistUrl('playlist')}
                    disabled={importingUrl || !importUrl.trim()}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40"
                  >
                    <span className={`material-symbols-outlined text-[15px] ${importingUrl ? 'animate-spin' : ''}`}>
                      {importingUrl ? 'sync' : 'playlist_add'}
                    </span>
                    {importingUrl ? 'Importing...' : 'Import as Playlist'}
                  </button>

                  <button
                    onClick={() => handleImportPlaylistUrl('liked')}
                    disabled={importingUrl || !importUrl.trim()}
                    className="px-4 py-2 rounded-xl bg-[#1c1c1f] hover:bg-[#252528] text-white font-semibold text-xs border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[15px] text-rose-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                    Merge to Liked
                  </button>
                </div>
              </div>
            </MonochromeCard>

            {/* Spotify Playlist URL Importer & Fuzzy Matcher */}
            <MonochromeCard
              title="Spotify Playlist Import & Matcher"
              subtitle="Map public Spotify playlist tracks directly to YouTube Music OPUS streams"
              icon="graphic_eq"
            >
              {spotifyStatus && (
                <div
                  className={`p-3 text-xs font-medium flex items-center gap-2 ${
                    spotifyStatus.type === 'success'
                      ? 'bg-emerald-950/40 border-b border-emerald-800/60 text-emerald-300'
                      : spotifyStatus.type === 'info'
                      ? 'bg-amber-950/40 border-b border-amber-800/60 text-amber-300'
                      : 'bg-red-950/40 border-b border-red-800/60 text-red-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {spotifyStatus.type === 'success' ? 'check_circle' : 'info'}
                  </span>
                  <span>{spotifyStatus.text}</span>
                </div>
              )}

              <div className="p-4 space-y-3">
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
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#101012] border border-white/10 text-white font-mono text-xs focus:border-white focus:outline-none placeholder:text-neutral-600 disabled:opacity-50"
                  />
                  {spotifyUrl && !spotifyImporting && (
                    <button
                      type="button"
                      onClick={() => setSpotifyUrl('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {spotifyImporting && spotifyProgress && (
                  <div className="p-3.5 rounded-xl bg-[#101012] border border-white/10 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-emerald-400 animate-spin">sync</span>
                        Matching track {spotifyProgress.current} of {spotifyProgress.total}...
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">{spotifyProgress.percent}%</span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-300 rounded-full"
                        style={{ width: `${spotifyProgress.percent}%` }}
                      />
                    </div>

                    {spotifyProgress.currentTrack && (
                      <div className="flex items-center justify-between pt-0.5 text-[11px] text-neutral-400">
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

                <div className="flex items-center gap-2 pt-1">
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
            </MonochromeCard>

            {/* JSON Backup & Restore Card */}
            <MonochromeCard
              title="JSON Library Backup & Restore"
              subtitle="Export or restore your full cassette.fm library including playlists and liked songs"
              icon="save"
            >
              {importStatus && (
                <div
                  className={`p-3 text-xs font-semibold ${
                    importStatus.type === 'error'
                      ? 'bg-red-950/40 text-red-300 border-b border-red-800'
                      : 'bg-emerald-950/40 text-emerald-300 border-b border-emerald-800'
                  }`}
                >
                  {importStatus.text}
                </div>
              )}

              <div className="p-4 flex flex-wrap gap-2.5">
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Export Backup JSON
                </button>

                <label className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/30 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer bg-[#101012] transition-colors">
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  Restore from JSON
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </MonochromeCard>
          </div>
        );

      // ── 6. Devices & Engine ────────────────────────────────────────
      case 'devices':
        return (
          <div className="space-y-6 animate-fade-in text-white pb-6">
            <MonochromeCard
              title="Audio Pipeline Diagnostics"
              subtitle="Real-time media session, streaming format & client host diagnostics"
              icon="terminal"
            >
              <div className="p-4 font-mono text-xs space-y-2 bg-transparent">
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-neutral-500">App Version:</span>
                  <span className="text-white font-bold">cassette.fm v2.4.0</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-neutral-500">Audio Codec:</span>
                  <span className="text-white">{activeStreamMeta?.mimeType || 'audio/webm; codecs="opus"'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-neutral-500">Stream Format itag:</span>
                  <span className="text-white font-bold">#{activeStreamMeta?.itag || '251 (High Bitrate)'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-neutral-500">Host Environment:</span>
                  <span className="text-white">Vite PWA · ServiceWorker Ready</span>
                </div>
              </div>
            </MonochromeCard>

            <MonochromeCard
              title="Browser Storage Cache"
              subtitle="Local cached playlists, history, and search tokens"
              icon="folder"
            >
              <div className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Search History &amp; Cache</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {liked?.length || 0} Liked · {playlists?.length || 0} Playlists · {history?.length || 0} History Tracks
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('pulse_search_history');
                    alert('Search history cleared.');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-white/30 text-xs text-neutral-300 hover:text-white cursor-pointer bg-[#101012] transition-colors"
                >
                  Clear History
                </button>
              </div>
            </MonochromeCard>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <>
      {/* ── 1. DESKTOP FULL-VIEW SPLIT LAYOUT (>= 1024px / lg) ────────── */}
      <div className="hidden lg:flex fixed inset-0 z-[100] items-center justify-center p-6 xl:p-10 bg-black/85 backdrop-blur-3xl animate-fade-in select-none">
        <div
          className="w-full max-w-6xl h-[85vh] min-h-[660px] max-h-[880px] bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-[280px_1fr] text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Navigation Pane */}
          <aside className="bg-[#101013] border-r border-white/5 flex flex-col justify-between p-5 select-none overflow-hidden">
            <div className="space-y-5 min-h-0 flex flex-col flex-1">
              <div className="flex items-center gap-2.5 px-2 pt-1">
                <div className="w-8 h-8 rounded-xl bg-white text-black font-bold flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight leading-tight">Settings</h2>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">cassette.fm</p>
                </div>
              </div>

              {/* Categories list */}
              <nav className="space-y-1 overflow-y-auto pr-1 no-scrollbar flex-1">
                {ALL_CATEGORIES.map((cat) => {
                  const isActive = (activeDesktopCategory || 'interface') === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveDesktopCategory(cat.id)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                          : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[19px] transition-transform ${isActive ? 'text-black' : 'text-neutral-400 group-hover:text-white'}`}>
                        {cat.icon}
                      </span>
                      <span className="text-sm font-medium truncate flex-1">{cat.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Left Pane Footer */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between px-1 flex-shrink-0">
              <span className="text-[11px] font-mono text-neutral-500">v2.4.0 · PWA</span>
              <button
                type="button"
                onClick={dismissSettings}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer bg-white/5"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                <span>ESC</span>
              </button>
            </div>
          </aside>

          {/* Right Content Pane */}
          <main className="bg-[#0e0e0e] flex flex-col h-full overflow-hidden">
            {/* Top Header of Right Pane */}
            <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-[#0e0e0e]/95 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activeCategoryObj?.badgeBg || 'bg-white/10 text-white'}`}>
                  <span className="material-symbols-outlined text-[18px]">{activeCategoryObj?.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{activeCategoryObj?.label}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{activeCategoryObj?.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissSettings}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                title="Close Settings (Esc)"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>

            {/* Content View */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {renderActiveCategory(activeDesktopCategory || 'interface')}
            </div>
          </main>
        </div>
      </div>

      {/* ── 2. MOBILE FULLSCREEN PWA (< 1024px) ────────────────────────── */}
      <div className="lg:hidden fixed inset-0 z-[100] w-full h-full bg-[#0d0d0d] flex flex-col text-white select-none overflow-hidden animate-fade-in">
        {/* Native Mobile Header with Safe Area Padding */}
        <header className="px-4 py-3.5 border-b border-white/5 bg-[#121215] flex items-center justify-between flex-shrink-0 pt-[max(0.875rem,env(safe-area-inset-top))]">
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
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight truncate leading-tight">
                {currentSubPage ? getCategoryObj(currentSubPage)?.label : 'Settings'}
              </h2>
              <p className="text-[11px] text-neutral-400 truncate">
                {currentSubPage ? 'Preferences' : 'cassette.fm Configuration'}
              </p>
            </div>
          </div>

          {!currentSubPage && (
            <button
              type="button"
              onClick={dismissSettings}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              title="Close"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </header>

        {/* Mobile Scrollable Area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar pb-[max(2.5rem,env(safe-area-inset-bottom))] bg-[#0d0d0d]">
          {currentSubPage ? (
            /* Subpage drill-down content */
            <div className="space-y-4 animate-fade-in">
              {renderActiveCategory(currentSubPage)}
            </div>
          ) : (
            /* Root Categories list for mobile */
            <div className="space-y-4 animate-fade-in">
              {/* Account Quick Card */}
              <button
                type="button"
                onClick={() => openSettingsSubPage('account')}
                className="w-full px-4 py-3.5 rounded-2xl bg-neutral-900/60 border border-white/10 flex items-center justify-between gap-3 text-left group active:scale-[0.99] shadow-lg"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {user ? (
                    user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata?.picture}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border border-white/20 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {(user.email || 'U')[0].toUpperCase()}
                      </div>
                    )
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">account_circle</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate leading-tight">
                      {user ? (user.user_metadata?.full_name || user.user_metadata?.name || user.email) : 'Account & Cloud Sync'}
                    </p>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {user ? 'Google Connected · Library Synced' : 'Sign in to sync your playlists and liked songs'}
                    </p>
                  </div>
                </div>

                <span className="material-symbols-outlined text-[18px] text-neutral-500 group-hover:text-white flex-shrink-0">
                  chevron_right
                </span>
              </button>

              {/* Preferences Categories Card Container */}
              <div className="rounded-2xl bg-neutral-900/50 border border-white/5 overflow-hidden divide-y divide-white/5 shadow-lg">
                {ALL_CATEGORIES.filter(c => c.id !== 'account').map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => openSettingsSubPage(cat.id)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.03] transition-colors group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${cat.badgeBg}`}>
                        <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate leading-tight">
                          {cat.label}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-[18px] text-neutral-500 group-hover:text-white flex-shrink-0">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
