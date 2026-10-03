import React, { useState, useEffect, useCallback } from 'react';
import { View, Platform, UIManager, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MobileHeader from '../src/components/shared/MobileHeader.jsx';
import MobileBottomNav from '../src/components/shared/MobileBottomNav.jsx';
import MobileSearchOverlay from '../src/components/shared/MobileSearchOverlay.jsx';
import SettingsModal from '../src/components/shared/SettingsModal.jsx';
import HomeView from '../src/components/HomeView/HomeView.jsx';
import LibraryView from '../src/components/LibraryView/LibraryView.jsx';
import AlbumView from '../src/components/AlbumView/AlbumView.jsx';
import ArtistView from '../src/components/ArtistView/ArtistView.jsx';
import PlayerDock from '../src/components/PlayerDock/PlayerDock.jsx';
import { usePlayerStore, playerActions, resolveDirectAudioStream } from '@cassette/core';
import { playTrack, pauseTrack, resumeTrack } from '../src/services/trackPlayerService.js';
import { youtubeMusicApiService } from '../src/services/youtubeMusicApiService.js';
import { googleAuthSyncService } from '../src/services/googleAuthSyncService.js';

try {
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
} catch {
  // Ignored in New Architecture Fabric
}

const animateLayout = () => {
  try {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } catch {
    // Ignore any animation errors on non-supported platforms
  }
};

const LIKED_KEY = 'likedSongs';

export default function MobileApp() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'radio' | 'search' | 'library' | 'settings'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);

  const [playerState, setPlayerState] = useState(usePlayerStore.getState());
  const [activeQueue, setActiveQueue] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);

  // Load user's liked songs from persistent storage on mount
  useEffect(() => {
    const loadLiked = async () => {
      try {
        const raw = await AsyncStorage.getItem(LIKED_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setLikedSongs(parsed);
        }
      } catch {}
    };
    loadLiked();

    // Listen to Google Auth Sync updates
    const unsubAuth = googleAuthSyncService.subscribe(async () => {
      const raw = await AsyncStorage.getItem(LIKED_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setLikedSongs(parsed);
        } catch {}
      }
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to reactive Zustand player store
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state) => {
      setPlayerState((prev) => {
        if (!prev.currentSong && state.currentSong) {
          animateLayout();
        }
        return { ...state };
      });
    });
    return () => unsubscribe();
  }, []);

  // Play a song and dynamically set queue
  const handlePlaySong = useCallback(async (song, queue = []) => {
    if (!song) return;
    animateLayout();

    if (queue && queue.length > 0) {
      setActiveQueue(queue);
    } else if (activeQueue.length === 0) {
      setActiveQueue([song]);
    }

    playerActions.setCurrentSong(song);
    playerActions.setIsPlaying(true);

    // Save song to real-time playback history for "Listen Again"
    youtubeMusicApiService.recordSongHistory(song);

    // Asynchronously resolve direct CDN audio streaming URL
    try {
      const res = await resolveDirectAudioStream(song.videoId || song.id);
      await playTrack(song, res?.streamUrl);
    } catch {
      await playTrack(song);
    }
  }, [activeQueue]);

  // Play all tracks from a section (e.g. Quick Picks)
  const handlePlayAll = useCallback((tracks) => {
    if (!tracks || tracks.length === 0) return;
    setActiveQueue(tracks);
    handlePlaySong(tracks[0], tracks);
  }, [handlePlaySong]);

  const handleTogglePlay = useCallback(() => {
    const nextPlayState = !playerState.isPlaying;
    playerActions.setIsPlaying(nextPlayState);
    if (nextPlayState) {
      resumeTrack();
    } else {
      pauseTrack();
    }
  }, [playerState.isPlaying]);

  const handleToggleLike = useCallback(async (song) => {
    if (!song) return;
    const targetId = song.id || song.videoId;
    const exists = likedSongs.some((s) => (s.id || s.videoId) === targetId);
    let nextLiked;
    if (exists) {
      nextLiked = likedSongs.filter((s) => (s.id || s.videoId) !== targetId);
    } else {
      nextLiked = [song, ...likedSongs];
    }
    setLikedSongs(nextLiked);
    try {
      await AsyncStorage.setItem(LIKED_KEY, JSON.stringify(nextLiked));
    } catch {}
  }, [likedSongs]);

  // Skip to Next Track
  const handleSkipNext = useCallback(async () => {
    if (!playerState.currentSong) return;
    const currId = playerState.currentSong.id || playerState.currentSong.videoId;
    const currIdx = activeQueue.findIndex((s) => (s.id || s.videoId) === currId);

    if (currIdx !== -1 && currIdx < activeQueue.length - 1) {
      handlePlaySong(activeQueue[currIdx + 1], activeQueue);
    } else {
      // Dynamic Radio Autoplay when queue reaches end
      const radioTracks = await youtubeMusicApiService.getRadioQueue(playerState.currentSong);
      if (radioTracks && radioTracks.length > 1) {
        const nextSong = radioTracks[1];
        setActiveQueue((prev) => [...prev, ...radioTracks.slice(1)]);
        handlePlaySong(nextSong);
      } else if (activeQueue.length > 0) {
        handlePlaySong(activeQueue[0], activeQueue);
      }
    }
  }, [playerState.currentSong, activeQueue, handlePlaySong]);

  // Skip to Previous Track
  const handleSkipPrev = useCallback(() => {
    if (!playerState.currentSong || activeQueue.length === 0) return;
    const currId = playerState.currentSong.id || playerState.currentSong.videoId;
    const currIdx = activeQueue.findIndex((s) => (s.id || s.videoId) === currId);

    if (currIdx > 0) {
      handlePlaySong(activeQueue[currIdx - 1], activeQueue);
    } else {
      handlePlaySong(activeQueue[0], activeQueue);
    }
  }, [playerState.currentSong, activeQueue, handlePlaySong]);

  const handleSelectAlbum = (album) => {
    animateLayout();
    setSelectedArtist(null);
    setSelectedAlbum(album);
  };

  const handleSelectArtist = (artist) => {
    animateLayout();
    setSelectedAlbum(null);
    setSelectedArtist(artist);
  };

  const handleSelectMix = async (mix) => {
    if (!mix) return;
    // Query live tracks for this mix or generate radio queue
    const query = mix.title || mix.name || 'trending music';
    const tracks = await youtubeMusicApiService.search(query, 'songs');
    if (tracks && tracks.length > 0) {
      handlePlayAll(tracks);
    }
  };

  // Launch Instant Radio tab action
  const handleStartInstantRadio = async () => {
    const seed = playerState.currentSong || likedSongs[0];
    if (seed) {
      const radioTracks = await youtubeMusicApiService.getRadioQueue(seed);
      if (radioTracks.length > 0) {
        handlePlayAll(radioTracks);
      }
    }
    setCurrentTab('home');
  };

  const isCurrentLiked = Boolean(
    playerState.currentSong &&
    likedSongs.some((s) => (s.id || s.videoId) === (playerState.currentSong.id || playerState.currentSong.videoId))
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0c' }} edges={['top', 'left', 'right']}>
      {/* ── Dynamic Branded Header ── */}
      <MobileHeader
        onSearchPress={() => {
          animateLayout();
          setIsSearchOpen(true);
        }}
        onProfilePress={() => {
          animateLayout();
          setIsSettingsOpen(true);
        }}
        onSettingsPress={() => {
          animateLayout();
          setIsSettingsOpen(true);
        }}
      />

      {/* ── Main Tab & Detail Views ── */}
      <View style={{ flex: 1, backgroundColor: '#0a0a0c' }}>
        {selectedAlbum ? (
          /* Detail View: Album */
          <AlbumView
            album={selectedAlbum}
            onBack={() => {
              animateLayout();
              setSelectedAlbum(null);
            }}
            onPlaySong={handlePlaySong}
            onPlayAll={(tracks) => tracks.length && handlePlaySong(tracks[0], tracks)}
            onToggleLike={handleToggleLike}
            activeSongId={playerState.currentSong?.id || playerState.currentSong?.videoId}
            isPlaying={playerState.isPlaying}
          />
        ) : selectedArtist ? (
          /* Detail View: Artist */
          <ArtistView
            artist={selectedArtist}
            onBack={() => {
              animateLayout();
              setSelectedArtist(null);
            }}
            onPlaySong={handlePlaySong}
            onSelectAlbum={handleSelectAlbum}
            onToggleLike={handleToggleLike}
            activeSongId={playerState.currentSong?.id || playerState.currentSong?.videoId}
            isPlaying={playerState.isPlaying}
          />
        ) : (
          /* Primary Tabs */
          <>
            {currentTab === 'home' && (
              <HomeView
                activeSongId={playerState.currentSong?.id || playerState.currentSong?.videoId}
                isPlaying={playerState.isPlaying}
                likedSongs={likedSongs}
                onPlaySong={handlePlaySong}
                onPlayAll={handlePlayAll}
                onSelectAlbum={handleSelectAlbum}
                onSelectMix={handleSelectMix}
                onToggleLike={handleToggleLike}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}

            {currentTab === 'library' && (
              <LibraryView
                likedSongs={likedSongs}
                activeSongId={playerState.currentSong?.id || playerState.currentSong?.videoId}
                isPlaying={playerState.isPlaying}
                onPlaySong={handlePlaySong}
                onToggleLike={handleToggleLike}
              />
            )}
          </>
        )}
      </View>

      {/* ── Persistent Floating Bottom Mini Player Dock ── */}
      {playerState.currentSong ? (
        <PlayerDock
          currentSong={playerState.currentSong}
          isPlaying={playerState.isPlaying}
          isLoading={playerState.isLoading}
          isLiked={isCurrentLiked}
          onPress={() => router.push('/now-playing')}
          onTogglePlay={handleTogglePlay}
          onSkipNext={handleSkipNext}
          onSkipPrev={handleSkipPrev}
          onToggleLike={() => handleToggleLike(playerState.currentSong)}
        />
      ) : null}

      {/* ── Bottom Navigation Bar ── */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabPress={(tabId) => {
          animateLayout();
          setSelectedAlbum(null);
          setSelectedArtist(null);
          if (tabId === 'search') {
            setIsSearchOpen(true);
          } else if (tabId === 'settings') {
            setIsSettingsOpen(true);
          } else if (tabId === 'radio') {
            handleStartInstantRadio();
          } else {
            setCurrentTab(tabId);
          }
        }}
      />

      {/* ── Real YouTube Music Search Overlay ── */}
      <MobileSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        activeSongId={playerState.currentSong?.id || playerState.currentSong?.videoId}
        isPlaying={playerState.isPlaying}
        likedSongs={likedSongs}
        onPlaySong={(song, queue) => {
          handlePlaySong(song, queue);
          setIsSearchOpen(false);
        }}
        onSelectAlbum={(album) => {
          setIsSearchOpen(false);
          handleSelectAlbum(album);
        }}
        onToggleLike={handleToggleLike}
      />

      {/* ── Complete 6-Subpage Settings Modal ── */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}
