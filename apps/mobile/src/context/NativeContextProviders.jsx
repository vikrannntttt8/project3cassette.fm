import React, { createContext, useContext, useState, useEffect, Component, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlayerStore, playerActions, resolveDirectAudioStream } from '@cassette/core';
import { googleAuthSyncService } from '../services/googleAuthSyncService.js';
import { playTrack, pauseTrack, resumeTrack } from '../services/trackPlayerService.js';

// ── 1. Error Boundary (eliminates white-screen crashes on boot) ───────────────
export class SafeErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SafeErrorBoundary] Uncaught component error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.brandTitle}>cassette.fm</Text>
          <Text style={styles.errorHeading}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'A runtime error occurred.'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={this.handleReset}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Reload UI</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── 2. Settings Context with Local Storage Persistence ─────────────────────────
export const SETTINGS_STORAGE_KEY = 'pulse_app_settings_v2';

export const DEFAULT_SETTINGS = {
  // Themes & Aesthetics
  monochromeMode: false,
  dynamicGlow: true,
  ambientGlow: true,
  customAccentColor: '#ffffff',
  romanizedLyrics: false,
  lyricFontSize: 'normal', // 'small' | 'normal' | 'large'

  // Interface & Layout Preferences
  compactArtists: false,
  compactAlbums: false,
  artistBanners: true,
  showQuickPicks: true,
  showListenAgain: true,
  nowPlayingViewMode: 'Fullscreen',
  coverClickAction: 'Show Track Info',

  // Navigation Destinations
  navVisibility: {
    home: true,
    radio: true,
    explore: true,
    library: true,
    settings: true,
  },

  // Audio Quality & Playback
  audioQuality: 'max', // 'max' (256k) | 'balanced' (160k) | 'datasaver' (128k)
  audioCodec: 'auto',
  playbackSpeed: 1.0,
  preservesPitch: true,
  gaplessPlayback: true,
  removeSilence: true,
  normalizeAudio: true,
  crossfadeDuration: 0,
  smartRecs: true,
  dataSaver: false,
  rememberLastSong: true,

  // Content & Language
  regionalCharts: 'Global (All Regions)',
  explicitFilter: false,
  selectedLanguage: 'all',
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
  resetSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

// ── 3. Theme Context ──────────────────────────────────────────────────────────
const ThemeContext = createContext({
  themeMode: 'default',
  accentColor: '#ffffff',
  monochromeMode: false,
  dynamicGlow: true,
  ambientGlow: true,
  setThemeMode: () => {},
  setAccentColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ── 4. Auth Context ───────────────────────────────────────────────────────────
const AuthContext = createContext({
  user: null,
  session: null,
  isAuthenticated: false,
  isSyncing: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  syncLibrary: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── 5. Player Context ─────────────────────────────────────────────────────────
const PlayerContext = createContext({
  currentSong: null,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 210,
  volume: 0.8,
  queue: [],
  isLiked: false,
  playSong: () => {},
  togglePlay: () => {},
  toggleLike: () => {},
  skipNext: () => {},
  skipPrev: () => {},
  seek: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

// ── 6. Master Native Providers Wrapper ───────────────────────────────────────
export function NativeAppProviders({ children }) {
  // Settings State
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setSettings((prev) => ({
            ...prev,
            ...parsed,
            navVisibility: { ...prev.navVisibility, ...(parsed.navVisibility || {}) },
          }));
        } catch {}
      }
    });
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        [key]: typeof value === 'function' ? value(prev[key]) : value,
      };
      AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS)).catch(() => {});
  }, []);

  // Auth State
  const [authUser, setAuthUser] = useState(googleAuthSyncService.getUser());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = googleAuthSyncService.subscribe((u, syncing) => {
      setAuthUser(u);
      setIsSyncing(syncing);
    });
    return () => unsub();
  }, []);

  // Player State
  const [playerState, setPlayerState] = useState(() => usePlayerStore?.getState?.() || {});

  useEffect(() => {
    if (!usePlayerStore?.subscribe) return;
    const unsub = usePlayerStore.subscribe(setPlayerState);
    return () => unsub();
  }, []);

  const authValue = {
    user: authUser,
    session: googleAuthSyncService.session,
    isAuthenticated: Boolean(authUser && authUser.isConnected),
    isSyncing,
    signInWithGoogle: () => googleAuthSyncService.signInWithGoogle(),
    signInWithEmail: (email, pass) => googleAuthSyncService.signInWithEmail(email, pass),
    signUpWithEmail: (email, pass, name) => googleAuthSyncService.signUpWithEmail(email, pass, name),
    signOut: () => googleAuthSyncService.signOut(),
    syncLibrary: () => googleAuthSyncService.syncYouTubeMusicLibrary(),
  };

  const themeValue = {
    themeMode: settings.monochromeMode ? 'monochrome' : settings.dynamicGlow ? 'dynamic' : 'custom',
    accentColor: settings.customAccentColor || '#ffffff',
    monochromeMode: settings.monochromeMode,
    dynamicGlow: settings.dynamicGlow,
    ambientGlow: settings.ambientGlow,
    setThemeMode: (mode) => updateSetting('monochromeMode', mode === 'monochrome'),
    setAccentColor: (col) => updateSetting('customAccentColor', col),
  };

  const settingsValue = {
    settings,
    updateSetting,
    resetSettings,
  };

  const playerValue = {
    currentSong: playerState.currentSong || null,
    isPlaying: Boolean(playerState.isPlaying),
    isLoading: Boolean(playerState.isLoading),
    currentTime: playerState.currentTime || 0,
    duration: playerState.duration || 210,
    volume: playerState.volume ?? 0.8,
    queue: playerState.queue || [],
    isLiked: false,
    playSong: (s) => playerActions?.setCurrentSong?.(s),
    togglePlay: () => playerActions?.setIsPlaying?.(!playerState.isPlaying),
    toggleLike: () => {},
    skipNext: () => {},
    skipPrev: () => {},
    seek: (t) => playerActions?.setProgress?.(t, playerState.duration || 210),
  };

  return (
    <SafeErrorBoundary>
      <AuthContext.Provider value={authValue}>
        <ThemeContext.Provider value={themeValue}>
          <SettingsContext.Provider value={settingsValue}>
            <PlayerContext.Provider value={playerValue}>
              {children}
            </PlayerContext.Provider>
          </SettingsContext.Provider>
        </ThemeContext.Provider>
      </AuthContext.Provider>
    </SafeErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0e0e0e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  brandTitle: {
    fontSize: 26,
    fontFamily: 'Shrikhand',
    color: '#ffffff',
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  errorHeading: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#000000',
  },
});
