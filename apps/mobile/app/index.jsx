import React, { useState, useEffect, useCallback } from 'react';
import { View, Platform, UIManager, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MobileHeader from '../src/components/shared/MobileHeader.jsx';
import MobileBottomNav from '../src/components/shared/MobileBottomNav.jsx';
import MobileSearchOverlay from '../src/components/shared/MobileSearchOverlay.jsx';
import SettingsModal from '../src/components/shared/SettingsModal.jsx';
import HomeView from '../src/components/HomeView/HomeView.jsx';
import LibraryView from '../src/components/LibraryView/LibraryView.jsx';
import AlbumView from '../src/components/AlbumView/AlbumView.jsx';
import ArtistView from '../src/components/ArtistView/ArtistView.jsx';
import PlayerDock from '../src/components/PlayerDock/PlayerDock.jsx';
import { FALLBACK_HOME_FEED } from '../src/data/fallbackFeed.js';
import { usePlayerStore, playerActions, resolveDirectAudioStream } from '@cassette/core';
import { playTrack, pauseTrack, resumeTrack } from '../src/services/trackPlayerService.js';

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

const FEATURED_ARTISTS = [
  {
    id: 'art-weeknd',
    name: 'The Weeknd',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    topTracks: FALLBACK_HOME_FEED.quickPicks.filter((s) => s.artist === 'The Weeknd'),
    albums: FALLBACK_HOME_FEED.trendingAlbums.filter((a) => a.artist === 'The Weeknd'),
  },
  {
    id: 'art-queen',
    name: 'Queen',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    topTracks: FALLBACK_HOME_FEED.quickPicks.filter((s) => s.artist === 'Queen'),
    albums: FALLBACK_HOME_FEED.trendingAlbums.filter((a) => a.artist === 'Queen'),
  },
  {
    id: 'art-sheeran',
    name: 'Ed Sheeran',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    topTracks: FALLBACK_HOME_FEED.quickPicks.filter((s) => s.artist === 'Ed Sheeran'),
    albums: FALLBACK_HOME_FEED.trendingAlbums.filter((a) => a.artist === 'Ed Sheeran'),
  },
  {
    id: 'art-gorillaz',
    name: 'Gorillaz',
    thumbnail: 'https://i.ytimg.com/vi/L3wKzyIN1yk/hqdefault.jpg',
    topTracks: FALLBACK_HOME_FEED.quickPicks.filter((s) => s.artist === 'Gorillaz'),
    albums: FALLBACK_HOME_FEED.trendingAlbums.filter((a) => a.artist === 'Gorillaz'),
  },
  {
    id: 'art-linkinpark',
    name: 'Linkin Park',
    thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
    topTracks: FALLBACK_HOME_FEED.quickPicks.filter((s) => s.artist === 'Linkin Park'),
    albums: [],
  },
];

export default function MobileApp() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  
  const [playerState, setPlayerState] = useState(usePlayerStore.getState());
  const [likedSongs, setLikedSongs] = useState(() => FALLBACK_HOME_FEED.quickPicks.slice(0, 3));

  // Subscribe to reactive Zustand player store
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state) => {
      setPlayerState((prev) => {
        if (!prev.currentSong && state.currentSong) {
          animateLayout();
        }
        return state;
      });
    });
    return () => unsubscribe();
  }, []);

  const handlePlaySong = useCallback(async (song) => {
    if (!song) return;
    animateLayout();
    playerActions.setCurrentSong(song);
    playerActions.setIsPlaying(true);

    // Asynchronously resolve direct CDN audio streaming URL
    try {
      const res = await resolveDirectAudioStream(song.videoId || song.id);
      await playTrack(song, res?.streamUrl);
    } catch {
      await playTrack(song);
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    const nextPlayState = !playerState.isPlaying;
    playerActions.setIsPlaying(nextPlayState);
    if (nextPlayState) {
      resumeTrack();
    } else {
      pauseTrack();
    }
  }, [playerState.isPlaying]);

  const handleToggleLike = useCallback((song) => {
    if (!song) return;
    setLikedSongs((prev) => {
      const targetId = song.id || song.videoId;
      const exists = prev.some((s) => (s.id || s.videoId) === targetId);
      if (exists) {
        return prev.filter((s) => (s.id || s.videoId) !== targetId);
      }
      return [song, ...prev];
    });
  }, []);

  const handleSelectAlbum = (album) => {
    animateLayout();
    setSelectedArtist(null);
    setSelectedAlbum(album);
  };

  const handleSelectArtist = (artist) => {
    animateLayout();
    setSelectedAlbum(null);
    const matched = FEATURED_ARTISTS.find(
      (a) => a.name.toLowerCase() === (artist.name || artist.title || '').toLowerCase()
    ) || {
      id: artist.id || 'art-generic',
      name: artist.name || artist.title || 'Artist',
      thumbnail: artist.thumbnail || artist.cover,
      topTracks: FALLBACK_HOME_FEED.quickPicks.filter(
        (s) => s.artist && s.artist.toLowerCase().includes((artist.name || artist.title || '').toLowerCase())
      ),
      albums: FALLBACK_HOME_FEED.trendingAlbums.filter(
        (a) => a.artist && a.artist.toLowerCase().includes((artist.name || artist.title || '').toLowerCase())
      ),
    };
    setSelectedArtist(matched);
  };

  const handleSelectMix = (mix) => {
    handlePlaySong(FALLBACK_HOME_FEED.quickPicks[0]);
  };

  const isCurrentLiked = Boolean(
    playerState.currentSong &&
    likedSongs.some((s) => (s.id || s.videoId) === (playerState.currentSong.id || playerState.currentSong.videoId))
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0e0e' }} className="flex-1 bg-[#0e0e0e]" edges={['top', 'left', 'right']}>
      {/* ── Branded Header ── */}
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
      <View style={{ flex: 1, backgroundColor: '#0e0e0e' }} className="flex-1">
        {/* Detail View: Album */}
        {selectedAlbum ? (
          <AlbumView
            album={selectedAlbum}
            onBack={() => {
              animateLayout();
              setSelectedAlbum(null);
            }}
            onPlaySong={handlePlaySong}
            onPlayAll={(tracks) => tracks.length && handlePlaySong(tracks[0])}
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
                topResult={FALLBACK_HOME_FEED.quickPicks[0]}
                songs={FALLBACK_HOME_FEED.quickPicks}
                albums={FALLBACK_HOME_FEED.trendingAlbums}
                artists={FEATURED_ARTISTS}
                dailyMixes={FALLBACK_HOME_FEED.dailyMixes}
                dynamicSections={FALLBACK_HOME_FEED.dynamicSections}
                activeSongId={playerState.currentSong?.id || playerState.currentSong?.videoId}
                isPlaying={playerState.isPlaying}
                onPlaySong={handlePlaySong}
                onSelectAlbum={handleSelectAlbum}
                onSelectArtist={handleSelectArtist}
                onSelectMix={handleSelectMix}
                onToggleLike={handleToggleLike}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
              />
            )}

            {currentTab === 'library' && (
              <LibraryView
                likedSongs={likedSongs}
                playlists={[
                  { id: 'pl-favorites', title: 'Favorite Hits', songs: likedSongs },
                  { id: 'pl-chill', title: 'Late Night Chill', songs: FALLBACK_HOME_FEED.quickPicks.slice(4, 9) },
                ]}
                offlineTracks={likedSongs.slice(0, 2)}
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
          onSkipNext={() => {
            const nextIdx = (FALLBACK_HOME_FEED.quickPicks.findIndex(
              (s) => (s.id || s.videoId) === (playerState.currentSong.id || playerState.currentSong.videoId)
            ) + 1) % FALLBACK_HOME_FEED.quickPicks.length;
            handlePlaySong(FALLBACK_HOME_FEED.quickPicks[nextIdx]);
          }}
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
            if (playerState.currentSong) {
              handlePlaySong(playerState.currentSong);
            } else if (FALLBACK_HOME_FEED.quickPicks.length > 0) {
              handlePlaySong(FALLBACK_HOME_FEED.quickPicks[0]);
            }
            setCurrentTab('home');
            setActiveCategory('mixes');
          } else {
            setCurrentTab(tabId);
          }
        }}
      />

      {/* ── Real Search Overlay ── */}
      <MobileSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        catalogSongs={FALLBACK_HOME_FEED.quickPicks}
        catalogAlbums={FALLBACK_HOME_FEED.trendingAlbums}
        catalogArtists={FEATURED_ARTISTS}
        activeSongId={playerState.currentSong?.id || playerState.currentSong?.videoId}
        isPlaying={playerState.isPlaying}
        onPlaySong={(song) => {
          handlePlaySong(song);
          setIsSearchOpen(false);
        }}
        onSelectAlbum={(album) => {
          setIsSearchOpen(false);
          handleSelectAlbum(album);
        }}
        onSelectArtist={(artist) => {
          setIsSearchOpen(false);
          handleSelectArtist(artist);
        }}
        onToggleLike={handleToggleLike}
      />

      {/* ── Settings & Audio Engine Modal ── */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}
