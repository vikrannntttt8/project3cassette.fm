import { createStore } from './playerStore.js';

export const useSettingsStore = createStore({
  audioCodec: 'auto',
  playbackSpeed: 1.0,
  preservesPitch: true,
  streamQuality: 'max',
  themeMode: 'default',
  themeAccent: '#ffffff',
});

export const settingsActions = {
  setAudioCodec: (audioCodec) => useSettingsStore.setState({ audioCodec }),
  setPlaybackSpeed: (playbackSpeed) => useSettingsStore.setState({ playbackSpeed }),
  setStreamQuality: (streamQuality) => useSettingsStore.setState({ streamQuality }),
  setThemeMode: (themeMode) => useSettingsStore.setState({ themeMode }),
  setThemeAccent: (themeAccent) => useSettingsStore.setState({ themeAccent }),
};
