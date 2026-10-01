// Simple reactive store pattern / Zustand-compatible store for cross-platform state
export function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  const getState = () => state;
  const setState = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
    listeners.forEach((listener) => listener(state));
  };
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
}

export const usePlayerStore = createStore({
  currentSong: null,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  queue: [],
  queueIndex: -1,
  history: [],
  audioQuality: 'max',
  isShuffled: false,
  isRepeat: false,
  lyrics: null,
});

export const playerActions = {
  setCurrentSong: (song) => usePlayerStore.setState({ currentSong: song }),
  setIsPlaying: (isPlaying) => usePlayerStore.setState({ isPlaying }),
  setIsLoading: (isLoading) => usePlayerStore.setState({ isLoading }),
  setProgress: (currentTime, duration) => usePlayerStore.setState({ currentTime, duration }),
  setVolume: (volume) => usePlayerStore.setState({ volume, isMuted: false }),
  setQueue: (queue, queueIndex = 0) => usePlayerStore.setState({ queue, queueIndex }),
  setAudioQuality: (audioQuality) => usePlayerStore.setState({ audioQuality }),
};
