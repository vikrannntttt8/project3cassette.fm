import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { fetchSongLyrics } from '../utils/saavn.js';
import { resolveYouTubeVideoId } from '../utils/youtubeEngine.js';
import { DEMO_LRC } from '../utils/lrcParser.js';
import { useLibrary } from '../hooks/useLibrary.js';

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

  // ── Song & queue state ────────────────────────────────────────────
  const [currentSong, setCurrentSong] = useState(null);
  const [queue,       setQueue]       = useState([]);
  const [queueIndex,  setQueueIndex]  = useState(0);
  const [history,     setHistory]     = useState([]);

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
  // ── Lyrics state ──────────────────────────────────────────────────
  const [lrcString,    setLrcString]    = useState(DEMO_LRC);
  const [lyricsSource, setLyricsSource] = useState('demo');
  const [lyricsLoading, setLyricsLoading] = useState(false);

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const view = navState.view;

  // Sync with browser popstate (back / forward buttons)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e) => {
      const state = e.state;
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
  }, [navHistory.length, safeReplaceState]);

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
        const res = await fetch(`/api/stream/${targetVideoId}?format=json&quality=${norm}`);
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

  // ── Initialize YouTube IFrame Player API (Direct Embedded Audio) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load YouTube IFrame API script dynamically on app mount if not present
    if (!window.YT && !document.getElementById('youtube-iframe-api-script')) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }

    const setupPlayer = () => {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        try {
          ytPlayerRef.current = new window.YT.Player('youtube-player-container', {
            height: '200',
            width: '200',
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              origin: window.location.origin,
              enablejsapi: 1,
              playsinline: 1,
            },
            events: {
              onReady: () => {
                ytReadyRef.current = true;
                if (ytPlayerRef.current?.setVolume) {
                  ytPlayerRef.current.setVolume(volume * 100);
                }
                if (pendingSongRef.current) {
                  const song = pendingSongRef.current;
                  pendingSongRef.current = null;
                  executeLoadSong(song);
                }
              },
              onStateChange: (event) => {
                // YT.PlayerState.PLAYING = 1
                if (event.data === 1) {
                  setIsPlaying(true);
                  setIsLoading(false);
                  if (ytPlayerRef.current?.getDuration) {
                    const d = ytPlayerRef.current.getDuration();
                    if (d && d > 0) setDuration(d);
                  }
                }
                // YT.PlayerState.PAUSED = 2
                else if (event.data === 2) {
                  setIsPlaying(false);
                  setIsLoading(false);
                }
                // YT.PlayerState.BUFFERING = 3
                else if (event.data === 3) {
                  setIsLoading(true);
                }
                // YT.PlayerState.ENDED = 0
                else if (event.data === 0) {
                  setIsPlaying(false);
                  setIsLoading(false);
                  if (playNextRef.current) {
                    playNextRef.current();
                  }
                }
              },
              onError: (err) => {
                console.warn('[YouTube Player] Playback error code:', err?.data);
                setIsLoading(false);
              },
            },
          });
        } catch (err) {
          console.warn('[YouTube Player] Init error:', err);
        }
      }
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      window.onYouTubeIframeAPIReady = setupPlayer;
      const interval = setInterval(() => {
        if (window.YT?.Player && !ytPlayerRef.current) {
          setupPlayer();
        } else if (ytPlayerRef.current) {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Track progress polling (1000ms interval loop) ───────────────────
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        const p = ytPlayerRef.current;
        if (p && typeof p.getCurrentTime === 'function') {
          const t = p.getCurrentTime();
          const d = p.getDuration();
          if (typeof t === 'number' && !isNaN(t)) {
            setCurrentTime(t);
          }
          if (typeof d === 'number' && !isNaN(d) && d > 0) {
            setDuration(d);
          }
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  // ── Unified YouTube Control Bindings ──────────────────────────────

  const play = useCallback(() => {
    if (ytPlayerRef.current?.playVideo) {
      ytPlayerRef.current.playVideo();
    }
  }, []);

  const pause = useCallback(() => {
    if (ytPlayerRef.current?.pauseVideo) {
      ytPlayerRef.current.pauseVideo();
    }
  }, []);

  const togglePlay = useCallback(() => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (isPlaying) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }, [isPlaying]);

  const seek = useCallback((time) => {
    const p = ytPlayerRef.current;
    if (p && typeof p.seekTo === 'function') {
      p.seekTo(time, true);
      setCurrentTime(time);
    }
  }, []);

  const changeVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    const p = ytPlayerRef.current;
    if (p && typeof p.setVolume === 'function') {
      p.setVolume(clamped * 100);
      p.unMute();
    }
    setVolume(clamped);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (typeof p.isMuted === 'function' && p.isMuted()) {
      p.unMute();
      setIsMuted(false);
    } else if (typeof p.mute === 'function') {
      p.mute();
      setIsMuted(true);
    }
  }, []);

  // ── Helper to execute load on the YouTube Player ──────────────────
  const executeLoadSong = useCallback(async (song) => {
    const p = ytPlayerRef.current;
    if (!p) return;

    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);

    // Completely decoupled from Saavn preview URLs (preventing 30s limits)
    const cleanSong = { ...song };
    delete cleanSong.media_preview_url;

    // Dynamically retrieve pre-mapped videoId or resolve dynamically
    let targetVideoId = cleanSong.videoId || cleanSong.youtubeId;
    if (!targetVideoId) {
      targetVideoId = await resolveYouTubeVideoId(cleanSong.title, cleanSong.artist);
    }

    if (targetVideoId) {
      cleanSong.videoId = targetVideoId;
      cleanSong.youtubeId = targetVideoId;
      if (typeof p.loadVideoById === 'function') {
        p.loadVideoById(targetVideoId);
      }
    } else {
      // Direct YouTube search playlist loading fallback
      const searchQuery = `${cleanSong.title} ${cleanSong.artist || ''}`.trim();
      if (typeof p.loadPlaylist === 'function') {
        p.loadPlaylist({ listType: 'search', list: searchQuery, index: 0, startSeconds: 0 });
      }
    }

    if (typeof p.setVolume === 'function') {
      p.setVolume(volume * 100);
      if (isMuted && typeof p.mute === 'function') p.mute();
      else if (typeof p.unMute === 'function') p.unMute();
    }

    if (typeof p.playVideo === 'function') {
      p.playVideo();
    }
  }, [volume, isMuted]);

  // ── Helper to fetch recommendations and populate/append to queue ──
  const populateWatchNextQueue = useCallback(async (track) => {
    const targetVid = track?.videoId || track?.youtubeId || track?.id;
    if (!targetVid) return;
    try {
      const res = await fetch(`/api/next/${targetVid}`);
      if (res.ok) {
        const recommendations = await res.json();
        if (Array.isArray(recommendations) && recommendations.length > 0) {
          setQueue((prevQueue) => {
            const currentVid = track.videoId || track.id;
            // Filter out current song from recommendations to avoid duplicate playing
            const fresh = recommendations.filter((r) => (r.videoId || r.id) !== currentVid);
            return [track, ...fresh];
          });
          setQueueIndex(0);
        }
      }
    } catch (err) {
      console.warn('[Watch Next] Failed to populate queue:', err);
    }
  }, []);

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

    if (!ytReadyRef.current || !ytPlayerRef.current) {
      pendingSongRef.current = cleanSong;
      setIsLoading(true);
    } else {
      executeLoadSong(cleanSong);
    }

    // Record into local & Supabase playback history
    if (typeof library.recordPlayback === 'function') {
      library.recordPlayback(cleanSong);
    }

    // Auto-fetch Watch Next if queue is a single song and not part of an existing playlist
    if (!newQueue || (Array.isArray(newQueue) && newQueue.length <= 1)) {
      populateWatchNextQueue(cleanSong);
    }

    // Fetch lyrics async (non-blocking)
    setLrcString(DEMO_LRC);
    setLyricsSource('demo');
    setLyricsLoading(true);
    fetchSongLyrics(cleanSong.id, cleanSong.title, cleanSong.artist)
      .then(({ lrc, source }) => {
        setLrcString(lrc);
        setLyricsSource(source);
      })
      .catch(() => {})
      .finally(() => setLyricsLoading(false));

    // Fetch stream metadata async for quality bitrate verification
    const targetVid = cleanSong.videoId || cleanSong.youtubeId || cleanSong.id;
    if (targetVid) {
      fetch(`/api/stream/${targetVid}?format=json&quality=${audioQuality}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((meta) => {
          if (meta) {
            setActiveStreamMeta(meta);
          }
        })
        .catch(() => {});
    }
  }, [executeLoadSong, audioQuality, populateWatchNextQueue]);

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

  const routeToArtistEntity = useCallback((artistName, artistId = null) => {
    if (artistId) {
      navigateTo('artist', artistId, { name: artistName });
      return;
    }
    if (artistName) {
      navigateTo('artist', encodeURIComponent(artistName), { name: artistName });
    }
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
            const res = await fetch(`/api/next/${targetVid}`);
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
          const res = await fetch(`/api/next/${targetVid}`);
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

  const value = {
    ytPlayerRef,
    isPlaying, currentTime, duration, volume, isMuted, isLoading,
    currentSong, queue, queueIndex, history,
    lrcString, lyricsSource, lyricsLoading,
    view, setView,
    navState, setNavState, navigateTo, goBack, canGoBack, navHistory, playAlbum,
    handleEntityClick,
    routeToSongEntity,
    routeToArtistEntity,
    isSettingsOpen, setIsSettingsOpen,
    // Audio Quality & Bitrate
    audioQuality, setAudioQuality, activeStreamMeta, streamToast, setStreamToast,
    // Actions
    play, pause, togglePlay, seek, changeVolume, toggleMute,
    loadSong, playTrackNow, playNextTrack, addToQueue, skipToNext, skipToPrev,
    playNext: skipToNext, playPrev: skipToPrev, playCollection, toggleView,
    // Library
    ...library,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* ── Native YouTube IFrame Audio Engine (Zero CORS / Full Length) ── */}
      <div
        id="youtube-player-container"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '200px',
          height: '200px',
          left: '0px',
          top: '0px',
          zIndex: -50,
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
