import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { fetchSongLyrics } from '../utils/saavn.js';
import { resolveYouTubeVideoId } from '../utils/youtubeEngine.js';
import { DEMO_LRC } from '../utils/lrcParser.js';
import { useLibrary } from '../hooks/useLibrary.js';
import { useSettings } from './SettingsContext.jsx';
import { apiUrl } from '../utils/apiConfig.js';
import {
  getOfflineTracks,
  getLast70OfflineTracks,
  saveTrackOffline,
  removeOfflineTrack,
  isTrackOffline,
  recordPlayedSongOffline,
} from '../services/offlineStorage.js';
import { getHighResImage } from '../utils/imageUtils.js';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  // ── YouTube IFrame Player Instance & Refs ──────────────────────────
  const ytPlayerRef    = useRef(null);
  const ytReadyRef     = useRef(false);
  const currentSongRef = useRef(null);
  const pendingSongRef = useRef(null);

  // ── Playback state ────────────────────────────────────────────────
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(0.8);
  const [isMuted,     setIsMuted]     = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [isOnline,    setIsOnline]    = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // ── Offline Downloads & Last 70 Rolling Cache state ────────────────
  const [offlineTracks, setOfflineTracks] = useState([]);
  const [last70Tracks,  setLast70Tracks]  = useState([]);

  useEffect(() => {
    const refreshOffline = () => {
      getOfflineTracks().then((tracks) => setOfflineTracks(tracks || []));
      getLast70OfflineTracks().then((tracks) => setLast70Tracks(tracks || []));
    };

    refreshOffline();

    const handleOfflineChange = () => refreshOffline();
    window.addEventListener('cassette:offline-changed', handleOfflineChange);

    const handleNetworkOnline = () => setIsOnline(true);
    const handleNetworkOffline = () => {
      setIsOnline(false);
      // Auto-lock to offline library mode when connection is lost
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cassette:network-offline'));
      }
    };

    window.addEventListener('online', handleNetworkOnline);
    window.addEventListener('offline', handleNetworkOffline);

    return () => {
      window.removeEventListener('cassette:offline-changed', handleOfflineChange);
      window.removeEventListener('online', handleNetworkOnline);
      window.removeEventListener('offline', handleNetworkOffline);
    };
  }, []);

  // ── Song & queue state ────────────────────────────────────────────
  const [currentSong, setCurrentSong] = useState(null);
  const [queue,       setQueue]       = useState([]);
  const [queueIndex,  setQueueIndex]  = useState(0);
  const [history,     setHistory]     = useState([]);
  const [isShuffled,  setIsShuffled]  = useState(false);
  const [isRepeat,    setIsRepeat]    = useState(false);

  const originalQueueRef = useRef([]);
  const queueRef = useRef([]);
  const queueIndexRef = useRef(0);
  const isFetchingNextRef = useRef(false);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  // ── Lyrics state ──────────────────────────────────────────────────
  const [lrcString,     setLrcString]     = useState('');
  const [lyricsSource,  setLyricsSource]  = useState('none');
  const [lyricsLoading, setLyricsLoading] = useState(false);

  // Dedicated automatic & on-demand lyrics fetcher
  const fetchLyricsForSong = useCallback(async (song) => {
    if (!song || (!song.title && !song.id)) {
      setLrcString('');
      setLyricsSource('none');
      setLyricsLoading(false);
      return;
    }

    setLyricsLoading(true);
    try {
      const { lrc, source } = await fetchSongLyrics(song.id, song.title, song.artist);
      if (currentSongRef.current?.id === song.id || currentSongRef.current?.videoId === song.videoId) {
        setLrcString(lrc || '');
        setLyricsSource(source || 'none');
      }
    } catch (err) {
      console.warn('[Lyrics Engine] Fetch error:', err);
      if (currentSongRef.current?.id === song.id) {
        setLrcString('');
        setLyricsSource('none');
      }
    } finally {
      setLyricsLoading(false);
    }
  }, []);

  // Safe HTML5 History helpers that swallow SecurityErrors (e.g., during OAuth hash fragment handling)
  const safePushState = useCallback((state, title, url) => {
    try {
      if (typeof window !== 'undefined' && window.history?.pushState) {
        window.history.pushState(state, title, url);
      }
    } catch (err) {
      console.warn('[Router] safePushState caught:', err);
    }
  }, []);

  const safeReplaceState = useCallback((state, title, url) => {
    try {
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(state, title, url);
      }
    } catch (err) {
      console.warn('[Router] safeReplaceState caught:', err);
    }
  }, []);

  // ── View & Navigation state with HTML5 History integration ────────
  // State: { view: 'home' | 'search' | 'artist' | 'album' | 'single' | 'lyrics' | 'library' | 'liked', currentId: string | null, extra: any }
  const [navState, setNavState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        if (window.history?.state?.view) {
          return window.history.state;
        }
      } catch {
        // Ignore SecurityError or cross-origin access issues
      }
      const path = window.location.pathname;
      if (path.startsWith('/artist/')) {
        const id = path.replace('/artist/', '').split('/')[0];
        if (id) return { view: 'artist', currentId: decodeURIComponent(id), extra: null };
      }
      if (path.startsWith('/album/')) {
        const id = path.replace('/album/', '').split('/')[0];
        if (id) return { view: 'album', currentId: decodeURIComponent(id), extra: null };
      }
      if (path.startsWith('/single/')) {
        const id = path.replace('/single/', '').split('/')[0];
        if (id) return { view: 'single', currentId: decodeURIComponent(id), extra: null };
      }
      if (path === '/search') return { view: 'search', currentId: null, extra: null };
      if (path === '/library') return { view: 'library', currentId: null, extra: null };
      if (path === '/liked') return { view: 'liked', currentId: null, extra: null };
      if (path === '/lyrics') return { view: 'lyrics', currentId: null, extra: null };
    }
    return { view: 'home', currentId: null, extra: null };
  });
  const [navHistory, setNavHistory] = useState([]);
  // ── Hierarchical Modal & Overlay Stack (Synchronized with Browser History) ──
  const [isPlayerSheetOpen, setIsPlayerSheetOpen] = useState(false);
  const [playerSheetTab, setPlayerSheetTab] = useState('player'); // 'player' | 'queue' | 'lyrics'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSubPage, setSettingsSubPage] = useState(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeChip, setActiveChip] = useState('all');

  const isPlayerSheetOpenRef = useRef(false);
  const playerSheetTabRef = useRef('player');
  const isSettingsOpenRef = useRef(false);
  const settingsSubPageRef = useRef(null);
  const isMobileSearchOpenRef = useRef(false);

  // ── Dual Audio Elements & Prefetch / Gapless Pipeline ─────────────
  const audioElementRef = useRef(null);
  const nextAudioElementRef = useRef(null);
  const hasPrefetchedForCurrentTrackRef = useRef(false);
  const hasRecordedPlayRef = useRef(false);
  const prefetchTimeoutRef = useRef(null);
  const prefetchedTrackRef = useRef(null);
  const prefetchedStreamMetaRef = useRef(null);
  const prefetchBlobUrlRef = useRef(null);

  useEffect(() => { isPlayerSheetOpenRef.current = isPlayerSheetOpen; }, [isPlayerSheetOpen]);
  useEffect(() => { playerSheetTabRef.current = playerSheetTab; }, [playerSheetTab]);
  useEffect(() => { isSettingsOpenRef.current = isSettingsOpen; }, [isSettingsOpen]);
  useEffect(() => { settingsSubPageRef.current = settingsSubPage; }, [settingsSubPage]);
  useEffect(() => { isMobileSearchOpenRef.current = isMobileSearchOpen; }, [isMobileSearchOpen]);

  // ── Audio Quality & Stream Bitrate State (max | standard | datasaver) ──
  const [audioQuality, setAudioQualityState] = useState(() => {
    if (typeof window === 'undefined') return 'max';
    const saved = localStorage.getItem('pulse_audio_quality');
    if (saved === 'high' || saved === 'max') return 'max';
    if (saved === 'medium' || saved === 'standard') return 'standard';
    if (saved === 'data-saver' || saved === 'datasaver' || saved === 'low') return 'datasaver';
    return 'max';
  });
  const [activeStreamMeta, setActiveStreamMeta] = useState(null);
  const [streamToast, setStreamToast] = useState(null);

  // ── Sync Playback Speed and Pitch Preserving with Audio Elements ──
  const settings = useSettings();

  useEffect(() => {
    const a = audioElementRef.current;
    if (a) {
      try {
        a.playbackRate = settings.playbackSpeed || 1.0;
        a.preservesPitch = settings.preservesPitch !== false;
      } catch {}
    }
  }, [settings.playbackSpeed, settings.preservesPitch]);

  const view = navState.view;

  // ── Unified History Modal Stack Actions ───────────────────────────
  const openPlayerSheet = useCallback((tab = 'player') => {
    setIsPlayerSheetOpen(true);
    setPlayerSheetTab(tab);
    safePushState({ modal: 'nowPlaying', tab }, '', window.location.pathname);
  }, [safePushState]);

  const closePlayerSheet = useCallback(() => {
    if (typeof window !== 'undefined' && window.history?.state?.modal === 'nowPlaying') {
      window.history.back();
    } else {
      setIsPlayerSheetOpen(false);
      setPlayerSheetTab('player');
    }
  }, []);

  const setPlayerSheetTabWithHistory = useCallback((newTab) => {
    if (newTab === playerSheetTabRef.current) return;
    if (newTab === 'queue' || newTab === 'lyrics') {
      safePushState({ modal: 'nowPlaying', tab: newTab }, '', window.location.pathname);
      setPlayerSheetTab(newTab);
    } else {
      if (typeof window !== 'undefined' && (window.history?.state?.tab === 'queue' || window.history?.state?.tab === 'lyrics')) {
        window.history.back();
      } else {
        setPlayerSheetTab('player');
      }
    }
  }, [safePushState]);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
    setSettingsSubPage(null);
    safePushState({ modal: 'settings' }, '', window.location.pathname);
  }, [safePushState]);

  const closeSettings = useCallback(() => {
    if (typeof window !== 'undefined' && (window.history?.state?.modal === 'settings' || window.history?.state?.modal === 'settingsSubpage')) {
      window.history.back();
    } else {
      setIsSettingsOpen(false);
      setSettingsSubPage(null);
    }
  }, []);

  const openSettingsSubPage = useCallback((subpage) => {
    setSettingsSubPage(subpage);
    safePushState({ modal: 'settingsSubpage', subpage }, '', window.location.pathname);
  }, [safePushState]);

  const closeSettingsSubPage = useCallback(() => {
    if (typeof window !== 'undefined' && window.history?.state?.modal === 'settingsSubpage') {
      window.history.back();
    } else {
      setSettingsSubPage(null);
    }
  }, []);

  const openMobileSearch = useCallback(() => {
    setIsMobileSearchOpen(true);
    safePushState({ modal: 'search' }, '', window.location.pathname);
  }, [safePushState]);

  const closeMobileSearch = useCallback(() => {
    if (typeof window !== 'undefined' && window.history?.state?.modal === 'search') {
      window.history.back();
    } else {
      setIsMobileSearchOpen(false);
    }
  }, []);

  const interceptBackRef = useRef(true);
  const closeModalsOnNavRef = useRef(true);

  useEffect(() => {
    interceptBackRef.current = settings.interceptBackToCloseModals !== false;
  }, [settings.interceptBackToCloseModals]);

  useEffect(() => {
    closeModalsOnNavRef.current = settings.closeModalsOnNavigation !== false;
  }, [settings.closeModalsOnNavigation]);

  // ── Hierarchical popstate Listener (Intercepts Hardware Back Gesture) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e) => {
      const state = e.state;

      // When interceptBackToCloseModals is disabled, bypass modal interception
      if (!interceptBackRef.current) {
        if (state && state.view) {
          setNavState(state);
        } else {
          setNavState({ view: 'home', currentId: null, extra: null });
        }
        setNavHistory((prev) => (prev.length > 0 ? prev.slice(0, -1) : []));
        return;
      }

      // 1. If popped to Now Playing drawer or sheet
      if (state?.modal === 'nowPlaying') {
        setIsPlayerSheetOpen(true);
        setPlayerSheetTab(state.tab || 'player');
        return;
      }
      if (isPlayerSheetOpenRef.current && (!state || state.modal !== 'nowPlaying')) {
        setIsPlayerSheetOpen(false);
        setPlayerSheetTab('player');
        return;
      }

      // 2. If popped inside Settings (subpage vs main menu)
      if (state?.modal === 'settingsSubpage') {
        setIsSettingsOpen(true);
        setSettingsSubPage(state.subpage || null);
        return;
      }
      if (state?.modal === 'settings') {
        setIsSettingsOpen(true);
        setSettingsSubPage(null);
        return;
      }
      if (isSettingsOpenRef.current && (!state || (state.modal !== 'settings' && state.modal !== 'settingsSubpage'))) {
        setIsSettingsOpen(false);
        setSettingsSubPage(null);
        return;
      }

      // 3. If popped out of Mobile Search
      if (state?.modal === 'search') {
        setIsMobileSearchOpen(true);
        return;
      }
      if (isMobileSearchOpenRef.current && (!state || state.modal !== 'search')) {
        setIsMobileSearchOpen(false);
        return;
      }

      // 4. If no modal is active -> standard view router navigation
      if (state && state.view) {
        setNavState(state);
      } else {
        setNavState({ view: 'home', currentId: null, extra: null });
      }
      setNavHistory((prev) => (prev.length > 0 ? prev.slice(0, -1) : []));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((newView, currentId = null, extra = null) => {
    // Automatically close open drawers when switching views if setting is enabled
    if (closeModalsOnNavRef.current) {
      if (isPlayerSheetOpenRef.current) {
        setIsPlayerSheetOpen(false);
        setPlayerSheetTab('player');
      }
      if (isSettingsOpenRef.current) {
        setIsSettingsOpen(false);
        setSettingsSubPage(null);
      }
      if (isMobileSearchOpenRef.current) {
        setIsMobileSearchOpen(false);
      }
    }

    const nextState = { view: newView, currentId, extra };
    setNavState((prev) => {
      setNavHistory((h) => [...h, prev]);
      if (typeof window !== 'undefined') {
        const url = newView === 'home' ? '/'
          : newView === 'search' ? '/search'
          : newView === 'artist' ? `/artist/${currentId || ''}`
          : newView === 'album' ? `/album/${currentId || ''}`
          : newView === 'single' ? `/single/${currentId || ''}`
          : `/${newView}`;
        safePushState(nextState, '', url);
      }
      return nextState;
    });
  }, [safePushState]);

  const setView = useCallback((newView) => {
    navigateTo(newView, null, null);
  }, [navigateTo]);

  const goBack = useCallback(() => {
    // Intercept back to dismiss topmost drawers/modals first
    if (interceptBackRef.current) {
      if (isPlayerSheetOpenRef.current) {
        closePlayerSheet();
        return;
      }
      if (isSettingsOpenRef.current) {
        if (settingsSubPageRef.current) {
          closeSettingsSubPage();
        } else {
          closeSettings();
        }
        return;
      }
      if (isMobileSearchOpenRef.current) {
        closeMobileSearch();
        return;
      }
    }

    if (typeof window !== 'undefined' && (navHistory.length > 0 || window.history.length > 1)) {
      setNavHistory((h) => {
        if (h.length === 0) {
          setNavState({ view: 'home', currentId: null, extra: null });
          return [];
        }
        const nextH = [...h];
        const prev = nextH.pop();
        setNavState(prev || { view: 'home', currentId: null, extra: null });
        return nextH;
      });
      try {
        window.history.back();
      } catch (err) {
        console.warn('[Router] goBack history.back error:', err);
      }
    } else {
      setNavState({ view: 'home', currentId: null, extra: null });
      if (typeof window !== 'undefined') {
        safeReplaceState({ view: 'home', currentId: null, extra: null }, '', '/');
      }
    }
  }, [closePlayerSheet, closeSettings, closeSettingsSubPage, closeMobileSearch, navHistory.length, safeReplaceState]);

  const canGoBack = navHistory.length > 0 || (typeof window !== 'undefined' && window.history.length > 1);

  // Set audio quality and update active stream format
  const setAudioQuality = useCallback(async (newQuality) => {
    let norm = 'max';
    if (newQuality === 'medium' || newQuality === 'standard') norm = 'standard';
    else if (newQuality === 'data-saver' || newQuality === 'datasaver' || newQuality === 'low') norm = 'datasaver';

    setAudioQualityState(norm);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulse_audio_quality', norm);
    }

    const targetVideoId = currentSongRef.current?.videoId || currentSongRef.current?.id;
    if (targetVideoId) {
      try {
        const res = await fetch(apiUrl(`/api/stream/${targetVideoId}?format=json&quality=${norm}`));
        if (res.ok) {
          const meta = await res.json();
          setActiveStreamMeta(meta);
          setStreamToast({
            title: `Bitrate: ${meta.qualityLabel}`,
            detail: `${meta.mimeType} · itag ${meta.itag} · ${meta.kbps}`,
          });
          setTimeout(() => setStreamToast(null), 3500);
        }
      } catch {
        // non-blocking
      }
    }
  }, []);

  // ── Library (liked + playlists + custom albums) ───────────────────
  const library = useLibrary();

  // ── Forward-declare playNext so it can be called inside events ─────
  const playNextRef = useRef(null);
  // ── isRepeatRef — readable by the audio player ended closure without stale closure ──
  const isRepeatRef = useRef(false);
  useEffect(() => { isRepeatRef.current = isRepeat; }, [isRepeat]);

  // Fallback indicator if direct CDN stream needs proxy fallback
  const fallbackAttemptRef = useRef(false);

  // ── Prefetch Next Track Engine (>50% Playback / Auto-Cache) ──────
  const prefetchNextTrack = useCallback(async (track, queuePos) => {
    if (!track || !track.id) return;
    const targetVid = track.videoId || track.youtubeId || track.id;
    if (!targetVid) return;

    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }

    try {
      prefetchedTrackRef.current = track;

      // 1. Prefetch time-synced lyrics
      fetchSongLyrics(track.id, track.title, track.artist).catch(() => {});

      // 2. Prefetch high-res artwork into browser memory cache
      const rawCover = track.thumbnail || track.cover;
      if (rawCover) {
        const img = new Image();
        img.src = getHighResImage(rawCover);
      }

      // 3. Resolve stream URL
      const codec = settings.audioCodec || 'auto';
      const streamRes = await fetch(apiUrl(`/api/stream/${targetVid}?format=json&quality=${audioQuality}&codec=${codec}`));
      if (streamRes.ok) {
        const meta = await streamRes.json();
        prefetchedStreamMetaRef.current = meta;
        const streamUrl = meta.streamUrl || apiUrl(`/api/stream/${targetVid}?quality=${audioQuality}&codec=${codec}`);

        // 4. Pre-buffer secondary HTML5 Audio element with 2-second decoding watchdog
        const nextAudio = nextAudioElementRef.current;
        if (nextAudio) {
          nextAudio.src = streamUrl;
          nextAudio.preload = 'auto';
          nextAudio.load();

          // 2-Second Decoding Fault Tolerance Watchdog:
          // If stream fails to reach HAVE_ENOUGH_DATA / errors within 2000ms, evict and jump to N+2
          prefetchTimeoutRef.current = setTimeout(() => {
            if (nextAudio.readyState < 2) {
              console.warn('[Prefetch Engine] 2s watchdog timeout on track N+1:', track.title, '— evicting track');
              if (queueRef.current && queueRef.current[queuePos]?.id === track.id) {
                setQueue((prev) => prev.filter((_, idx) => idx !== queuePos));
                // Prefetch N+2
                const nextInLine = queueRef.current[queuePos];
                if (nextInLine) {
                  prefetchNextTrack(nextInLine, queuePos);
                }
              }
            }
          }, 2000);
        }
      }
    } catch (err) {
      console.warn('[Prefetch Engine] Background prefetch note:', err.message);
    }
  }, [audioQuality, settings.audioCodec]);

  // ── Helper to execute load on the Global HTML5 Audio Player ─────────
  const executeLoadSong = useCallback(async (song) => {
    const a = audioElementRef.current;
    if (!a) return;

    try {
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
      fallbackAttemptRef.current = false;
      hasPrefetchedForCurrentTrackRef.current = false;
      hasRecordedPlayRef.current = false;

      // Completely decoupled from preview URLs
      const cleanSong = { ...song };
      delete cleanSong.media_preview_url;

      let targetVideoId = cleanSong.videoId || cleanSong.youtubeId;
      if (!targetVideoId) {
        targetVideoId = await resolveYouTubeVideoId(cleanSong.title, cleanSong.artist);
      }
      if (!targetVideoId) {
        targetVideoId = cleanSong.id;
      }

      if (targetVideoId) {
        cleanSong.videoId = targetVideoId;
        cleanSong.youtubeId = targetVideoId;
      }

      // Check if this track was already prefetched in nextAudioElementRef
      let streamUrl = '';
      const nextAudio = nextAudioElementRef.current;
      if (nextAudio && prefetchedTrackRef.current && (prefetchedTrackRef.current.id === cleanSong.id || prefetchedTrackRef.current.videoId === cleanSong.videoId) && nextAudio.src) {
        streamUrl = nextAudio.src;
        if (prefetchedStreamMetaRef.current) {
          setActiveStreamMeta(prefetchedStreamMetaRef.current);
        }
      }

      if (!streamUrl && targetVideoId) {
        const codec = settings.audioCodec || 'auto';
        try {
          const res = await fetch(apiUrl(`/api/stream/${targetVideoId}?format=json&quality=${audioQuality}&codec=${codec}`));
          if (res.ok) {
            const meta = await res.json();
            if (meta?.streamUrl) {
              streamUrl = meta.streamUrl;
              setActiveStreamMeta(meta);
            }
          }
        } catch (err) {
          console.warn('[Audio Engine] format=json stream fetch error:', err);
        }

        if (!streamUrl) {
          streamUrl = apiUrl(`/api/stream/${targetVideoId}?quality=${audioQuality}&codec=${codec}`);
        }
      }

      if (streamUrl) {
        a.src = streamUrl;
        a.volume = isMuted ? 0 : volume;
        try {
          a.playbackRate = settings.playbackSpeed || 1.0;
          a.preservesPitch = settings.preservesPitch !== false;
        } catch {}
        a.load();

        const playPromise = a.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
              if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
                try {
                  navigator.mediaSession.playbackState = 'playing';
                } catch {}
              }
            })
            .catch((err) => {
              console.warn('[Audio Engine] Direct audio play caught:', err);
            });
        }
      }
    } catch (err) {
      console.warn('[Audio Engine] executeLoadSong caught:', err);
      setIsLoading(false);
    }
  }, [audioQuality, volume, isMuted, settings.playbackSpeed, settings.preservesPitch, settings.audioCodec]);

  // ── Unified HTML5 Audio Control Bindings ───────────────────────────
  const play = useCallback(() => {
    try {
      const a = audioElementRef.current;
      if (a) {
        const playPromise = a.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
              if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
                try {
                  navigator.mediaSession.playbackState = 'playing';
                } catch {}
              }
            })
            .catch((e) => console.warn('[Audio Engine] play error:', e));
        }
      }
    } catch (e) {
      console.warn('[Audio Engine] play error:', e);
    }
  }, []);

  const pause = useCallback(() => {
    try {
      const a = audioElementRef.current;
      if (a) {
        a.pause();
        setIsPlaying(false);
        if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
          try {
            navigator.mediaSession.playbackState = 'paused';
          } catch {}
        }
      }
    } catch (e) {
      console.warn('[Audio Engine] pause error:', e);
    }
  }, []);

  const togglePlay = useCallback(() => {
    try {
      const a = audioElementRef.current;
      if (!a) return;
      if (a.paused) {
        play();
      } else {
        pause();
      }
    } catch (e) {
      console.warn('[Audio Engine] togglePlay error:', e);
    }
  }, [play, pause]);

  const seek = useCallback((time) => {
    try {
      const a = audioElementRef.current;
      if (a) {
        const clamped = Math.max(0, Math.min(time, a.duration || time));
        a.currentTime = clamped;
        setCurrentTime(clamped);
      }
    } catch (e) {
      console.warn('[Audio Engine] seek error:', e);
    }
  }, []);

  const changeVolume = useCallback((v) => {
    try {
      const clamped = Math.max(0, Math.min(1, v));
      const a = audioElementRef.current;
      if (a) {
        a.volume = clamped;
        a.muted = false;
      }
      setVolume(clamped);
      setIsMuted(false);
    } catch (e) {
      console.warn('[Audio Engine] changeVolume error:', e);
    }
  }, []);

  const toggleMute = useCallback(() => {
    try {
      const a = audioElementRef.current;
      if (!a) return;
      const nextMuted = !a.muted;
      a.muted = nextMuted;
      setIsMuted(nextMuted);
    } catch (e) {
      console.warn('[Audio Engine] toggleMute error:', e);
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat((prev) => !prev);
  }, []);

  // ── Native Audio Error & Fallback Proxy Handler ────────────────────
  const handleAudioElementError = useCallback(async (e) => {
    const a = audioElementRef.current;
    if (!a) return;
    const activeTrack = currentSongRef.current;
    const targetVideoId = activeTrack?.videoId || activeTrack?.youtubeId || activeTrack?.id;

    console.warn('[Audio Engine] HTML5 playback error on source:', a.src, e?.nativeEvent);

    if (!fallbackAttemptRef.current && targetVideoId) {
      fallbackAttemptRef.current = true;
      console.log('[Audio Engine] Retrying playback via server-side proxy stream:', targetVideoId);
      const proxyUrl = apiUrl(`/api/stream/${targetVideoId}?quality=${audioQuality}`);
      a.src = proxyUrl;
      a.load();
      try {
        await a.play();
        setIsPlaying(true);
        setIsLoading(false);
        return;
      } catch (err) {
        console.warn('[Audio Engine] Proxy stream playback also caught:', err);
      }
    }

    setIsLoading(false);
  }, [audioQuality]);

  // ── Helper to fetch recommendations and populate/append to queue ──
  const populateWatchNextQueue = useCallback(async (track, isAppend = false) => {
    const targetVid = track?.videoId || track?.youtubeId || track?.id;
    if (!targetVid) return;
    try {
      const res = await fetch(apiUrl(`/api/next/${targetVid}`));
      if (res.ok) {
        const recommendations = await res.json();
        if (Array.isArray(recommendations) && recommendations.length > 0) {
          setQueue((prevQueue) => {
            const currentVid = track.videoId || track.id;
            const historyIds = new Set((history || []).map((h) => h.videoId || h.id));
            const existingIds = new Set(
              isAppend
                ? prevQueue.map((r) => r.videoId || r.id)
                : [currentVid]
            );

            // Filter out tracks already in user queue or recent history
            const fresh = recommendations
              .filter((r) => !existingIds.has(r.videoId || r.id) && !historyIds.has(r.videoId || r.id))
              .map((r) => ({
                ...r,
                isRadioTrack: true,
                source: 'radio',
              }));

            if (isAppend) {
              return [...prevQueue, ...fresh];
            }
            return [track, ...fresh];
          });
          if (!isAppend) {
            setQueueIndex(0);
          }
        }
      }
    } catch (err) {
      console.warn('[Watch Next] Failed to populate queue:', err);
    }
  }, [history]);

  // ── Explicit Start Radio Engine ────────────────────────────────────
  const startRadio = useCallback((track) => {
    if (!track) return;
    const cleanTrack = { ...track };
    delete cleanTrack.media_preview_url;
    setCurrentSong(cleanTrack);
    currentSongRef.current = cleanTrack;
    setQueue([cleanTrack]);
    setQueueIndex(0);

    executeLoadSong(cleanTrack);

    if (typeof library.recordPlayback === 'function') {
      library.recordPlayback(cleanTrack);
    }

    // Reset and immediately fetch lyrics
    setLrcString('');
    setLyricsSource('none');
    fetchLyricsForSong(cleanTrack);

    // Populate radio recommendations
    populateWatchNextQueue(cleanTrack, false);
  }, [executeLoadSong, fetchLyricsForSong, populateWatchNextQueue, library]);

  // ── Load a song into the embedded YouTube engine ───────────────────
  const loadSong = useCallback(async (song, newQueue = null, newIndex = 0) => {
    if (!song) return;

    // Completely decouple from preview URLs
    const cleanSong = { ...song };
    delete cleanSong.media_preview_url;

    setCurrentSong(cleanSong);
    currentSongRef.current = cleanSong;
    if (newQueue) {
      setQueue(newQueue);
      setQueueIndex(newIndex);
    } else if (queueRef.current.length === 0) {
      setQueue([cleanSong]);
      setQueueIndex(0);
    }

    executeLoadSong(cleanSong);

    // Record into local & Supabase playback history
    if (typeof library.recordPlayback === 'function') {
      library.recordPlayback(cleanSong);
    }

    // Auto-fetch Watch Next if queue is a single song and not part of an existing playlist
    if (!newQueue || (Array.isArray(newQueue) && newQueue.length <= 1)) {
      populateWatchNextQueue(cleanSong, false);
    }

    // Immediately trigger asynchronous lyrics fetching
    setLrcString('');
    setLyricsSource('none');
    fetchLyricsForSong(cleanSong);

    // Fetch stream metadata async for quality bitrate verification
    const targetVid = cleanSong.videoId || cleanSong.youtubeId || cleanSong.id;
    if (targetVid) {
      fetch(apiUrl(`/api/stream/${targetVid}?format=json&quality=${audioQuality}`))
        .then((r) => (r.ok ? r.json() : null))
        .then((meta) => {
          if (meta) {
            setActiveStreamMeta(meta);
          }
        })
        .catch(() => {});
    }
  }, [executeLoadSong, audioQuality, populateWatchNextQueue, fetchLyricsForSong, library]);

  // ── Centralized Contextual Entity Click Router ─────────────────────
  const handleEntityClick = useCallback((item, options = {}) => {
    if (!item) return;

    // 1. Explicit or contextual Artist target
    const isArtist = item.type === 'artist' ||
      options.target === 'artist' ||
      (item.browseId && item.browseId.startsWith('UC')) ||
      (item.channelId && !item.videoId);

    if (isArtist) {
      const artistId = item.browseId || item.channelId || item.artistId || item.id;
      const artistName = item.name || item.title || item.artist || 'Artist';
      navigateTo('artist', artistId, { name: artistName, cover: item.thumbnail || item.cover });
      return;
    }

    // 2. Explicit or contextual Album target
    const isAlbum = item.type === 'album' ||
      options.target === 'album' ||
      (item.browseId && (item.browseId.startsWith('MPRE') || item.browseId.startsWith('FEmusic_library_privately_owned_release'))) ||
      (item.albumId && !item.videoId);

    if (isAlbum) {
      const albumId = item.browseId || item.albumId || item.id;
      const albumTitle = item.title || item.album || 'Album';
      navigateTo('album', albumId, {
        title: albumTitle,
        artist: item.artist || item.author,
        cover: item.thumbnail || item.cover,
        year: item.year,
      });
      return;
    }

    // 3. Music Video, Standalone Single, or Remix
    const isVideo = item.type === 'video' || item.isMusicVideo || item.isVideo || item.views ||
      (item.duration && !item.album && (item.title?.toLowerCase().includes('video') || item.title?.toLowerCase().includes('live')));
    const isStandaloneSingle = item.isSingle || (!item.album && (item.videoId || item.id));

    if (options.target === 'single' || options.target === 'video' || (options.openView && (isVideo || isStandaloneSingle))) {
      const targetId = item.videoId || item.id;
      loadSong(item);
      navigateTo('single', targetId, item);
      return;
    }

    // 4. Clicking Track row/cover when track has album and options.navigateAlbum is requested
    if (options.navigateAlbum && item.albumId) {
      navigateTo('album', item.albumId, { title: item.album, artist: item.artist, cover: item.cover });
      return;
    }

    // 5. Default track play behavior
    loadSong(item, options.queue, options.queueIndex);
  }, [navigateTo, loadSong]);

  // ── Dedicated Entity Click Handlers (Song title & Artist clicks) ──
  const routeToSongEntity = useCallback((song) => {
    if (!song) return;
    const albumId = song.albumId || (typeof song.album === 'object' ? song.album?.id || song.album?.browseId : null);
    if (albumId) {
      navigateTo('album', albumId, {
        title: typeof song.album === 'string' ? song.album : song.album?.name || song.title,
        artist: song.artist,
        cover: song.cover || song.thumbnail,
      });
      return;
    }

    // Fallback: If entity lacks an official album, route to /single/[videoId] or trigger seamless single-track playback
    const targetVideoId = song.videoId || song.id;
    if (targetVideoId) {
      navigateTo('single', targetVideoId, song);
    } else {
      loadSong(song);
    }
  }, [navigateTo, loadSong]);

  const routeToArtistEntity = useCallback((artistNameOrObj, explicitArtistId = null) => {
    let resolvedName = '';
    let resolvedId = null;

    if (artistNameOrObj && typeof artistNameOrObj === 'object') {
      resolvedName =
        artistNameOrObj.artists?.[0]?.name ||
        artistNameOrObj.name ||
        artistNameOrObj.title ||
        artistNameOrObj.artist ||
        artistNameOrObj.author?.name ||
        '';

      resolvedId =
        explicitArtistId ||
        artistNameOrObj.artists?.[0]?.id ||
        artistNameOrObj.artists?.[0]?.browseId ||
        artistNameOrObj.artistId ||
        artistNameOrObj.channelId ||
        artistNameOrObj.author?.id ||
        artistNameOrObj.browseId ||
        artistNameOrObj.id ||
        null;
    } else if (typeof artistNameOrObj === 'string') {
      resolvedName = artistNameOrObj.trim();
      resolvedId = explicitArtistId || null;
    }

    if (resolvedId && typeof resolvedId === 'string') {
      resolvedId = resolvedId.trim();
    } else if (typeof resolvedId !== 'string') {
      resolvedId = null;
    }

    if (!resolvedId && !resolvedName) {
      console.warn('[routeToArtistEntity] Guard clause triggered: Missing artist identifier and name', {
        artistNameOrObj,
        explicitArtistId,
      });
      return;
    }

    const targetId = resolvedId || encodeURIComponent(resolvedName);
    navigateTo('artist', targetId, { name: resolvedName || targetId });
  }, [navigateTo]);

  // ── Queue Management & Auto-Advance Engine ────────────────────────
  const playTrackNow = useCallback((track, customQueue = null, startIndex = 0) => {
    if (!track) return;
    if (customQueue && Array.isArray(customQueue) && customQueue.length > 1) {
      loadSong(track, customQueue, startIndex);
    } else {
      loadSong(track, [track], 0);
      populateWatchNextQueue(track);
    }
  }, [loadSong, populateWatchNextQueue]);

  const playNextTrack = useCallback((track) => {
    if (!track) return;
    setQueue((prevQueue) => {
      const next = [...prevQueue];
      const insertAt = queueIndexRef.current + 1;
      next.splice(insertAt, 0, track);
      return next;
    });
  }, []);

  const addToQueue = useCallback((track) => {
    if (!track) return;
    setQueue((prevQueue) => [...prevQueue, track]);
  }, []);

  const clearQueue = useCallback(() => {
    if (currentSongRef.current) {
      setQueue([currentSongRef.current]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  }, []);

  const removeFromQueue = useCallback((indexToRemove) => {
    setQueue((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (indexToRemove < queueIndexRef.current) {
        setQueueIndex((i) => Math.max(0, i - 1));
      }
      return next;
    });
  }, []);

  const skipToNext = useCallback(async () => {
    const currentQ = queueRef.current;
    const currentIdx = queueIndexRef.current;
    if (!currentQ.length) return;

    if (currentSongRef.current) {
      setHistory((h) => [...h, currentSongRef.current]);
    }

    const nextIndex = currentIdx + 1;
    if (nextIndex < currentQ.length) {
      setQueueIndex(nextIndex);
      loadSong(currentQ[nextIndex], null, nextIndex);

      // Pre-fetch next batch if nearing the end of current recommendations
      if (nextIndex >= currentQ.length - 2 && !isFetchingNextRef.current) {
        const lastSong = currentQ[currentQ.length - 1];
        const targetVid = lastSong?.videoId || lastSong?.id;
        if (targetVid) {
          isFetchingNextRef.current = true;
          try {
            const res = await fetch(apiUrl(`/api/next/${targetVid}`));
            if (res.ok) {
              const recs = await res.json();
              if (Array.isArray(recs) && recs.length > 0) {
                setQueue((prev) => {
                  const existingIds = new Set(prev.map((s) => s.videoId || s.id));
                  const fresh = recs.filter((s) => !existingIds.has(s.videoId || s.id));
                  return [...prev, ...fresh];
                });
              }
            }
          } catch (e) {
            console.warn('[Queue Auto-Advance] Prefetch error:', e);
          } finally {
            isFetchingNextRef.current = false;
          }
        }
      }
    } else {
      // Reached the end of queue — fetch next recommendation batch immediately
      const lastSong = currentQ[currentIdx];
      const targetVid = lastSong?.videoId || lastSong?.id;
      if (targetVid && !isFetchingNextRef.current) {
        isFetchingNextRef.current = true;
        try {
          const res = await fetch(apiUrl(`/api/next/${targetVid}`));
          if (res.ok) {
            const recs = await res.json();
            if (Array.isArray(recs) && recs.length > 0) {
              const existingIds = new Set(currentQ.map((s) => s.videoId || s.id));
              const fresh = recs.filter((s) => !existingIds.has(s.videoId || s.id));
              if (fresh.length > 0) {
                setQueue((prev) => [...prev, ...fresh]);
                setQueueIndex(nextIndex);
                loadSong(fresh[0], null, nextIndex);
                return;
              }
            }
          }
        } catch (e) {
          console.warn('[Queue Auto-Advance] Fetch error:', e);
        } finally {
          isFetchingNextRef.current = false;
        }
      }
      // Fallback: loop back to beginning
      setQueueIndex(0);
      loadSong(currentQ[0], null, 0);
    }
  }, [loadSong]);

  playNextRef.current = skipToNext;

  const skipToPrev = useCallback(() => {
    const p = ytPlayerRef.current;
    if (p && typeof p.getCurrentTime === 'function' && p.getCurrentTime() > 3) {
      p.seekTo(0, true);
      setCurrentTime(0);
      return;
    }
    const currentQ = queueRef.current;
    const currentIdx = queueIndexRef.current;
    if (!currentQ.length) return;

    if (currentIdx > 0) {
      const prevIndex = currentIdx - 1;
      setQueueIndex(prevIndex);
      loadSong(currentQ[prevIndex], null, prevIndex);
    } else {
      p?.seekTo?.(0, true);
      setCurrentTime(0);
    }
  }, [loadSong]);

  const playCollection = useCallback((songs, startIndex = 0) => {
    if (!songs || !songs.length) return;
    loadSong(songs[startIndex], songs, startIndex);
  }, [loadSong]);

  const playAlbum = useCallback((tracks, startIndex = 0) => {
    if (!tracks || !tracks.length) return;
    loadSong(tracks[startIndex], tracks, startIndex);
  }, [loadSong]);

  const toggleView = useCallback(() => {
    setNavState((prev) => {
      if (prev.view === 'lyrics') {
        return { view: 'home', currentId: null, extra: null };
      }
      return { view: 'lyrics', currentId: null, extra: null };
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const next = !prev;
      if (next && queueRef.current.length > 1) {
        const currentQ = [...queueRef.current];
        const currentIdx = queueIndexRef.current;
        const currentTrack = currentQ[currentIdx];
        const remaining = currentQ.filter((_, i) => i !== currentIdx);
        // Fisher-Yates shuffle
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        const newQueue = [currentTrack, ...remaining];
        setQueue(newQueue);
        setQueueIndex(0);
      }
      return next;
    });
  }, []);

  const [autoplay, setAutoplay] = useState(true);
  const toggleAutoplay = useCallback(() => setAutoplay((prev) => !prev), []);

  // ── Infinite Radio / Smart Queue Auto-Refill ──
  // Whenever the remaining queue drops below 3 tracks, auto-fetch more recommendations (if autoplay enabled)
  useEffect(() => {
    if (!currentSong || isFetchingNextRef.current || !autoplay) return;
    const remaining = queue.length - queueIndex;
    if (remaining <= 3 && queue.length > 0) {
      const lastTrack = queue[queue.length - 1] || currentSong;
      populateWatchNextQueue(lastTrack, true);
    }
  }, [queue.length, queueIndex, currentSong, populateWatchNextQueue, autoplay]);

  const isDownloaded = useCallback((trackId) => {
    if (!trackId) return false;
    const idStr = String(trackId);
    return offlineTracks.some((t) => String(t.id) === idStr || String(t.videoId) === idStr);
  }, [offlineTracks]);

  const toggleDownload = useCallback(async (track) => {
    if (!track) return;
    const trackId = track.id || track.videoId;
    const isAlready = isDownloaded(trackId);
    if (isAlready) {
      await removeOfflineTrack(trackId);
      setStreamToast('Removed from offline storage');
    } else {
      const success = await saveTrackOffline(track);
      if (success) {
        setStreamToast('Saved for offline playback');
      }
    }
    setTimeout(() => setStreamToast(null), 3000);
  }, [isDownloaded]);

  // ── Media Session API: Sync Metadata and Lock Screen Artwork ──────
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentSong) return;

    try {
      let rawCover = currentSong.cover || currentSong.thumbnail || '';
      let coverUrl = getHighResImage(rawCover);
      if (coverUrl.startsWith('//')) {
        coverUrl = 'https:' + coverUrl;
      } else if (coverUrl.startsWith('/')) {
        coverUrl = window.location.origin + coverUrl;
      }

      const sizes = [96, 128, 256, 512];
      const artwork = sizes.map((size) => {
        let src = coverUrl;
        if (src.includes('googleusercontent.com') || src.includes('yt3.ggpht.com') || src.includes('ggpht.com')) {
          if (/=w\d+-h\d+[^?#]*/.test(src)) {
            src = src.replace(/=w\d+-h\d+[^?#]*/, `=w${size}-h${size}-l90-rj`);
          } else if (/=s\d+[^?#]*/.test(src)) {
            src = src.replace(/=s\d+[^?#]*/, `=w${size}-h${size}-l90-rj`);
          } else {
            src += src.includes('?') ? `&w=${size}&h=${size}` : `=w${size}-h${size}-l90-rj`;
          }
        }
        return {
          src,
          sizes: `${size}x${size}`,
          type: 'image/jpeg',
        };
      });

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title || 'cassette.fm',
        artist: currentSong.artist || 'Unknown Artist',
        album: currentSong.album || 'cassette.fm',
        artwork: artwork.length > 0 ? artwork : undefined,
      });
    } catch (e) {
      console.warn('[MediaSession] Metadata update error:', e);
    }
  }, [currentSong]);

  // ── Media Session API: Playback State Synchronization ─────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (e) {
      console.warn('[MediaSession] playbackState error:', e);
    }
  }, [isPlaying]);

  // ── Media Session API: Position State Synchronization ─────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, 0.1),
          playbackRate: 1.0,
          position: Math.min(currentTime, duration),
        });
      } catch (e) {
        // non-blocking
      }
    }
  }, [currentTime, duration]);

  // ── Media Session API: Global Action Handlers ──────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const actionHandlers = [
      ['play', () => play()],
      ['pause', () => pause()],
      ['previoustrack', () => skipToPrev()],
      ['nexttrack', () => skipToNext()],
      ['seekto', (details) => {
        if (details?.seekTime != null) seek(details.seekTime);
      }],
      ['seekbackward', (details) => {
        const offset = details?.seekOffset || 10;
        const cur = audioElementRef.current?.currentTime ?? currentTime;
        seek(Math.max(cur - offset, 0));
      }],
      ['seekforward', (details) => {
        const offset = details?.seekOffset || 10;
        const cur = audioElementRef.current?.currentTime ?? currentTime;
        const dur = audioElementRef.current?.duration ?? duration ?? 100;
        seek(Math.min(cur + offset, dur));
      }],
      ['stop', () => pause()],
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Unsupported action on current browser
      }
    });
  }, [play, pause, skipToPrev, skipToNext, seek, currentTime, duration]);

  const value = {
    ytPlayerRef,
    audioElementRef,
    nextAudioElementRef,
    isPlaying, currentTime, duration, volume, isMuted, isLoading,
    isOnline,
    currentSong, queue, queueIndex, history,
    isShuffled, toggleShuffle, isRepeat, toggleRepeat,
    autoplay, setAutoplay, toggleAutoplay,
    lrcString, lyricsSource, lyricsLoading, fetchLyricsForSong,
    view, setView,
    navState, setNavState, navigateTo, goBack, canGoBack, navHistory, playAlbum,
    handleEntityClick,
    routeToSongEntity,
    routeToArtistEntity,
    // Modal & History Stack
    isPlayerSheetOpen, setIsPlayerSheetOpen, openPlayerSheet, closePlayerSheet,
    playerSheetTab, setPlayerSheetTab, setPlayerSheetTabWithHistory,
    isSettingsOpen, setIsSettingsOpen, openSettings, closeSettings,
    settingsSubPage, setSettingsSubPage, openSettingsSubPage, closeSettingsSubPage,
    isMobileSearchOpen, setIsMobileSearchOpen, openMobileSearch, closeMobileSearch,
    activeChip, setActiveChip,
    // Offline Storage, Downloads & Last 70 Cache
    offlineTracks, last70Tracks, isDownloaded, toggleDownload,
    // Audio Quality & Bitrate
    audioQuality, setAudioQuality, activeStreamMeta, streamToast, setStreamToast,
    // Actions
    play, pause, togglePlay, seek, changeVolume, toggleMute,
    loadSong, playTrackNow, startRadio, populateWatchNextQueue, playNextTrack, addToQueue, clearQueue, removeFromQueue, setQueue, setQueueIndex, skipToNext, skipToPrev,
    playNext: skipToNext, playPrev: skipToPrev, playCollection, toggleView,
    // Library
    ...library,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* ── Primary Persistent HTML5 Audio Element ── */}
      <audio
        ref={audioElementRef}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
          if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
            try {
              navigator.mediaSession.playbackState = 'playing';
            } catch {}
          }
        }}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
          if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
            try {
              navigator.mediaSession.playbackState = 'playing';
            } catch {}
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
            try {
              navigator.mediaSession.playbackState = 'paused';
            } catch {}
          }
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setCurrentTime(a.currentTime);
          if (a.duration && !isNaN(a.duration)) {
            setDuration(a.duration);

            // 1. Aggressive Prefetching (>50% track progress)
            if (a.duration > 0 && a.currentTime / a.duration >= 0.5 && !hasPrefetchedForCurrentTrackRef.current) {
              hasPrefetchedForCurrentTrackRef.current = true;
              const nextIndex = queueIndexRef.current + 1;
              if (queueRef.current && nextIndex < queueRef.current.length) {
                prefetchNextTrack(queueRef.current[nextIndex], nextIndex);
              }
            }

            // 2. Offline Rolling "Last 70" Cache (Recorded after 10s playback)
            if (a.currentTime >= 10 && !hasRecordedPlayRef.current && currentSongRef.current) {
              hasRecordedPlayRef.current = true;
              recordPlayedSongOffline(currentSongRef.current, lrcString);
            }

            if (
              typeof window !== 'undefined' &&
              'mediaSession' in navigator &&
              typeof navigator.mediaSession.setPositionState === 'function' &&
              a.duration > 0
            ) {
              try {
                navigator.mediaSession.setPositionState({
                  duration: Math.max(a.duration, 0.1),
                  playbackRate: a.playbackRate || 1.0,
                  position: Math.min(a.currentTime, a.duration),
                });
              } catch (err) {}
            }
          }
        }}
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          if (a.duration && !isNaN(a.duration)) {
            setDuration(a.duration);
          }
          try {
            a.playbackRate = settings.playbackSpeed || 1.0;
            a.preservesPitch = settings.preservesPitch !== false;
          } catch {}
          setIsLoading(false);
        }}
        onDurationChange={(e) => {
          const a = e.currentTarget;
          if (a.duration && !isNaN(a.duration)) {
            setDuration(a.duration);
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={() => {
          setIsPlaying(false);
          setIsLoading(false);
          if (isRepeatRef.current && audioElementRef.current) {
            audioElementRef.current.currentTime = 0;
            audioElementRef.current.play().catch(() => {});
          } else if (playNextRef.current) {
            playNextRef.current();
          }
        }}
        onError={handleAudioElementError}
        style={{
          position: 'fixed',
          left: '-9999px',
          bottom: '-9999px',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
          zIndex: -100,
        }}
        aria-hidden="true"
      />

      {/* ── Secondary Pre-Cache Hidden Audio Element for Gapless Transitions ── */}
      <audio
        ref={nextAudioElementRef}
        playsInline
        preload="auto"
        muted
        crossOrigin="anonymous"
        onCanPlay={() => {
          if (prefetchTimeoutRef.current) {
            clearTimeout(prefetchTimeoutRef.current);
            prefetchTimeoutRef.current = null;
          }
        }}
        onError={() => {
          console.warn('[Prefetch Engine] Pre-buffering error on secondary audio element');
          if (prefetchTimeoutRef.current) {
            clearTimeout(prefetchTimeoutRef.current);
            prefetchTimeoutRef.current = null;
          }
        }}
        style={{
          position: 'fixed',
          left: '-9999px',
          bottom: '-9999px',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
          zIndex: -101,
        }}
        aria-hidden="true"
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

