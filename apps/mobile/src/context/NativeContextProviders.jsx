import React, { createContext, useContext, useState, useEffect, Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlayerStore, playerActions } from '@cassette/core';

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

// ── 2. Theme Context Fallback ────────────────────────────────────────────────
const ThemeContext = createContext({
  themeMode: 'default',
  accentColor: '#ffffff',
  setThemeMode: () => {},
  setAccentColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ── 3. Auth Context Fallback ─────────────────────────────────────────────────
const AuthContext = createContext({
  user: null,
  session: null,
  isAuthenticated: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── 4. Settings Context Fallback ─────────────────────────────────────────────
const SettingsContext = createContext({
  audioQuality: 'max',
  gaplessPlayback: true,
  offlineCacheEnabled: true,
  updateSetting: () => {},
});

export const useSettings = () => useContext(SettingsContext);

// ── 5. Player Context Fallback (bridged to core Zustand store) ───────────────
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
  const [playerState, setPlayerState] = useState(() => usePlayerStore?.getState?.() || {});

  useEffect(() => {
    if (!usePlayerStore?.subscribe) return;
    const unsub = usePlayerStore.subscribe(setPlayerState);
    return () => unsub();
  }, []);

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

  const themeValue = {
    themeMode: 'default',
    accentColor: '#ffffff',
    setThemeMode: () => {},
    setAccentColor: () => {},
  };

  const authValue = {
    user: null,
    session: null,
    isAuthenticated: false,
    signInWithGoogle: async () => {},
    signInWithEmail: async () => {},
    signOut: async () => {},
  };

  const settingsValue = {
    audioQuality: 'max',
    gaplessPlayback: true,
    offlineCacheEnabled: true,
    updateSetting: () => {},
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
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  errorHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
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
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});
