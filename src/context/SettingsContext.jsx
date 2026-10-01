import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  // ── 1. Navigation & Modal Behavior ──
  interceptBackToCloseModals: true,
  closeModalsOnNavigation: true,
  nowPlayingViewMode: 'Fullscreen', // 'Fullscreen' | 'Floating Drawer' | 'Mini Bar'
  coverClickAction: 'Show Track Info', // 'Toggle Play/Pause' | 'Exit Fullscreen' | 'Show Track Info'

  // ── 2. Interface & Layout Preferences ──
  compactArtists: false,
  compactAlbums: false,
  artistBanners: true,
  showQuickPicks: true,
  showListenAgain: true,

  // ── 3. Mobile Dock / Nav Visibility ──
  navVisibility: {
    home: true,
    radio: true,
    explore: true,
    library: true,
    settings: true,
  },

  // ── 4. Audio & Playback Preferences ──
  audioQuality: 'max', // 'max' | 'standard' | 'datasaver'
  audioCodec: 'auto', // 'auto' | 'opus' | 'mp4'
  playbackSpeed: 1.0, // 0.5, 0.75, 1.0, 1.25, 1.5, 2.0
  preservesPitch: true,
  gaplessPlayback: true,
  removeSilence: true,
  normalizeAudio: true,
  crossfadeDuration: 0,
  smartRecs: true,
  dataSaver: false,
  rememberLastSong: true,

  // ── 5. Lyrics & Content ──
  lyricFontSize: 'normal', // 'small' | 'normal' | 'large'
  romanizedLyrics: false,
  explicitFilter: false,
  selectedLanguage: 'all',
  ambientGlow: true,
  canvasBg: true,
};

const STORAGE_KEY = 'pulse_app_settings_v2';

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          navVisibility: {
            ...DEFAULT_SETTINGS.navVisibility,
            ...(parsed.navVisibility || {}),
          },
        };
      }
    } catch (e) {
      console.warn('[SettingsProvider] Failed to parse saved settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage on any change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[SettingsProvider] Failed to persist settings:', e);
    }
  }, [settings]);

  // Generic updater
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: typeof value === 'function' ? value(prev[key]) : value,
    }));
  }, []);

  // Dedicated updaters
  const setInterceptBackToCloseModals = useCallback((val) => updateSetting('interceptBackToCloseModals', val), [updateSetting]);
  const setCloseModalsOnNavigation = useCallback((val) => updateSetting('closeModalsOnNavigation', val), [updateSetting]);
  const setNowPlayingViewMode = useCallback((val) => updateSetting('nowPlayingViewMode', val), [updateSetting]);
  const setCoverClickAction = useCallback((val) => updateSetting('coverClickAction', val), [updateSetting]);

  const setCompactArtists = useCallback((val) => updateSetting('compactArtists', val), [updateSetting]);
  const setCompactAlbums = useCallback((val) => updateSetting('compactAlbums', val), [updateSetting]);
  const setArtistBanners = useCallback((val) => updateSetting('artistBanners', val), [updateSetting]);
  const setShowQuickPicks = useCallback((val) => updateSetting('showQuickPicks', val), [updateSetting]);
  const setShowListenAgain = useCallback((val) => updateSetting('showListenAgain', val), [updateSetting]);

  const setNavVisibility = useCallback((val) => updateSetting('navVisibility', val), [updateSetting]);
  const toggleNavDestination = useCallback((destId) => {
    setSettings((prev) => {
      const current = prev.navVisibility || DEFAULT_SETTINGS.navVisibility;
      // Safeguard: Ensure at least 1 destination remains visible
      const visibleCount = Object.values(current).filter(Boolean).length;
      if (visibleCount <= 1 && current[destId]) {
        return prev; // Don't allow disabling the last visible tab
      }
      return {
        ...prev,
        navVisibility: {
          ...current,
          [destId]: !current[destId],
        },
      };
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = {
    settings,
    updateSetting,
    resetSettings,

    // Navigation & Modal Behavior
    interceptBackToCloseModals: settings.interceptBackToCloseModals,
    setInterceptBackToCloseModals,
    closeModalsOnNavigation: settings.closeModalsOnNavigation,
    setCloseModalsOnNavigation,
    nowPlayingViewMode: settings.nowPlayingViewMode,
    setNowPlayingViewMode,
    coverClickAction: settings.coverClickAction,
    setCoverClickAction,

    // Interface & Layout
    compactArtists: settings.compactArtists,
    setCompactArtists,
    compactAlbums: settings.compactAlbums,
    setCompactAlbums,
    artistBanners: settings.artistBanners,
    setArtistBanners,
    showQuickPicks: settings.showQuickPicks,
    setShowQuickPicks,
    showListenAgain: settings.showListenAgain,
    setShowListenAgain,

    // Mobile Dock / Nav Visibility
    navVisibility: settings.navVisibility,
    setNavVisibility,
    toggleNavDestination,

    // Playback & Audio Preferences
    audioQuality: settings.audioQuality,
    setAudioQuality: (val) => updateSetting('audioQuality', val),
    audioCodec: settings.audioCodec,
    setAudioCodec: (val) => updateSetting('audioCodec', val),
    playbackSpeed: settings.playbackSpeed,
    setPlaybackSpeed: (val) => updateSetting('playbackSpeed', val),
    preservesPitch: settings.preservesPitch,
    setPreservesPitch: (val) => updateSetting('preservesPitch', val),
    gaplessPlayback: settings.gaplessPlayback,
    setGaplessPlayback: (val) => updateSetting('gaplessPlayback', val),
    removeSilence: settings.removeSilence,
    setRemoveSilence: (val) => updateSetting('removeSilence', val),
    normalizeAudio: settings.normalizeAudio,
    setNormalizeAudio: (val) => updateSetting('normalizeAudio', val),
    crossfadeDuration: settings.crossfadeDuration,
    setCrossfadeDuration: (val) => updateSetting('crossfadeDuration', val),
    smartRecs: settings.smartRecs,
    setSmartRecs: (val) => updateSetting('smartRecs', val),
    dataSaver: settings.dataSaver,
    setDataSaver: (val) => updateSetting('dataSaver', val),
    rememberLastSong: settings.rememberLastSong,
    setRememberLastSong: (val) => updateSetting('rememberLastSong', val),

    // Lyrics & Appearance
    lyricFontSize: settings.lyricFontSize,
    setLyricFontSize: (val) => updateSetting('lyricFontSize', val),
    romanizedLyrics: settings.romanizedLyrics,
    setRomanizedLyrics: (val) => updateSetting('romanizedLyrics', val),
    explicitFilter: settings.explicitFilter,
    setExplicitFilter: (val) => updateSetting('explicitFilter', val),
    selectedLanguage: settings.selectedLanguage,
    setSelectedLanguage: (val) => updateSetting('selectedLanguage', val),
    ambientGlow: settings.ambientGlow,
    setAmbientGlow: (val) => updateSetting('ambientGlow', val),
    canvasBg: settings.canvasBg,
    setCanvasBg: (val) => updateSetting('canvasBg', val),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
