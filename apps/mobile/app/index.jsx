import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MobileHeader from '../src/components/shared/MobileHeader.jsx';
import MobileBottomNav from '../src/components/shared/MobileBottomNav.jsx';
import MobileSearchOverlay from '../src/components/shared/MobileSearchOverlay.jsx';
import HomeView from '../src/components/HomeView/HomeView.jsx';
import LibraryView from '../src/components/LibraryView/LibraryView.jsx';
import PlayerDock from '../src/components/PlayerDock/PlayerDock.jsx';
import { usePlayerStore, playerActions } from '@cassette/core';

// Mock initial data for mobile feed demonstration
const SAMPLE_TOP_RESULT = {
  id: 'top-1',
  type: 'song',
  title: 'Starboy',
  artist: 'The Weeknd ft. Daft Punk',
  thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
  subtitle: 'Featured Global Hit',
};

const SAMPLE_SONGS = [
  { id: '1', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', duration: 230, thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
  { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
  { id: '3', title: 'Save Your Tears', artist: 'The Weeknd', duration: 215, thumbnail: 'https://i.ytimg.com/vi/XXYlFuWEuKI/hqdefault.jpg' },
  { id: '4', title: 'Die For You', artist: 'The Weeknd', duration: 260, thumbnail: 'https://i.ytimg.com/vi/QLCpqdqeoII/hqdefault.jpg' },
];

const SAMPLE_ALBUMS = [
  { id: 'alb-1', title: 'After Hours', artist: 'The Weeknd', songCount: 14, thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
  { id: 'alb-2', title: 'Dawn FM', artist: 'The Weeknd', songCount: 16, thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
];

const SAMPLE_ARTISTS = [
  { id: 'art-1', name: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
  { id: 'art-2', name: 'Daft Punk', thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
];

export default function MobileApp() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [playerState, setPlayerState] = useState(usePlayerStore.getState());
  const [likedSongs, setLikedSongs] = useState(SAMPLE_SONGS.slice(0, 2));

  // Subscribe to shared reactive playerStore
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe(setPlayerState);
    return () => unsubscribe();
  }, []);

  const handlePlaySong = (song) => {
    playerActions.setCurrentSong(song);
    playerActions.setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    playerActions.setIsPlaying(!playerState.isPlaying);
  };

  const handleToggleLike = (song) => {
    setLikedSongs((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      if (exists) return prev.filter((s) => s.id !== song.id);
      return [song, ...prev];
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0e0e0e]" edges={['top', 'left', 'right']}>
      {/* ── Branded Header ── */}
      <MobileHeader
        onSearchPress={() => setIsSearchOpen(true)}
        onProfilePress={() => console.log('Profile')}
      />

      {/* ── Main Tab Views ── */}
      <View className="flex-1">
        {currentTab === 'home' && (
          <HomeView
            topResult={SAMPLE_TOP_RESULT}
            songs={SAMPLE_SONGS}
            albums={SAMPLE_ALBUMS}
            artists={SAMPLE_ARTISTS}
            activeSongId={playerState.currentSong?.id}
            isPlaying={playerState.isPlaying}
            onPlaySong={handlePlaySong}
            onToggleLike={handleToggleLike}
          />
        )}

        {currentTab === 'library' && (
          <LibraryView
            likedSongs={likedSongs}
            playlists={[{ id: 'pl-1', title: 'Favorites', songs: likedSongs }]}
            offlineTracks={[]}
            activeSongId={playerState.currentSong?.id}
            isPlaying={playerState.isPlaying}
            onPlaySong={handlePlaySong}
            onToggleLike={handleToggleLike}
          />
        )}
      </View>

      {/* ── Floating Fixed Bottom Mini Player Dock ── */}
      {playerState.currentSong ? (
        <PlayerDock
          currentSong={playerState.currentSong}
          isPlaying={playerState.isPlaying}
          isLoading={playerState.isLoading}
          isLiked={likedSongs.some((s) => s.id === playerState.currentSong.id)}
          onPress={() => router.push('/now-playing')}
          onTogglePlay={handleTogglePlay}
          onSkipNext={() => console.log('Next')}
          onToggleLike={handleToggleLike}
        />
      ) : null}

      {/* ── Bottom Navigation Bar ── */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabPress={(tabId) => {
          if (tabId === 'search') setIsSearchOpen(true);
          else setCurrentTab(tabId);
        }}
      />

      {/* ── Fullscreen Search Modal ── */}
      <MobileSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={(q) => console.log('Search query:', q)}
        suggestions={['The Weeknd', 'Starboy', 'Blinding Lights', 'After Hours']}
        onSelectSuggestion={(q) => {
          console.log('Selected:', q);
          setIsSearchOpen(false);
        }}
      />
    </SafeAreaView>
  );
}
