import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Play, Pause, SkipForward, SkipBack, Disc } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { usePlayerStore } from '@cassette/core';
import { useTheme } from '../../context/NativeContextProviders.jsx';

export default function PlayerDock({
  currentSong,
  isPlaying = false,
  isLoading = false,
  onPress,
  onTogglePlay,
  onSkipNext,
  onSkipPrev,
}) {
  const { theme, themeStyle } = useTheme();
  const isOled = themeStyle === 'oled';

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(210);

  // Subscribe to playback progress
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state) => {
      setCurrentTime(state.currentTime || 0);
      setDuration(state.duration || 210);
    });
    return () => unsub();
  }, []);

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const playButtonScale = useSharedValue(1);

  const handlePlayPressIn = () => {
    playButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePlayPressOut = () => {
    playButtonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedPlayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  const thumbnailUri = currentSong?.thumbnail || currentSong?.cover;
  const title = currentSong?.title || 'Nothing playing';
  const subtitle =
    currentSong?.artist ||
    currentSong?.artists?.[0]?.name ||
    'Search for a song';

  return (
    <View
      style={[
        styles.dockWrapper,
        {
          backgroundColor: isOled ? '#121214' : '#1c1c20',
          borderColor: isOled ? '#242428' : 'rgba(255, 255, 255, 0.08)',
        },
      ]}
    >
      {/* Hairline subtle progress line at top */}
      {currentSong && (
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%`, backgroundColor: '#FFFFFF' },
            ]}
          />
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        style={styles.dockContent}
      >
        {/* Left: Circular Artwork or Disc Icon */}
        <View style={styles.trackInfo}>
          <View style={styles.thumbnailWrapper}>
            {thumbnailUri ? (
              <Image
                source={{ uri: thumbnailUri }}
                style={styles.thumbnail}
                contentFit="cover"
                cachePolicy="disk"
                transition={150}
              />
            ) : (
              <View style={styles.discPlaceholder}>
                <Disc size={20} color="#71717A" />
              </View>
            )}

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Center: Title & Subtitle */}
          <View style={styles.textContainer}>
            <Text numberOfLines={1} style={styles.trackTitle}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.trackArtist}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Media Controls matching PWA */}
        <View style={styles.controlsRow}>
          {/* Skip Previous */}
          {onSkipPrev && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSkipPrev}
              style={styles.navButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SkipBack size={16} color="#A1A1AA" fill="#A1A1AA" />
            </TouchableOpacity>
          )}

          {/* Play/Pause Button - Sleek circle */}
          <Pressable
            onPress={onTogglePlay}
            onPressIn={handlePlayPressIn}
            onPressOut={handlePlayPressOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={[styles.playButton, animatedPlayStyle]}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#18181B" />
              ) : isPlaying ? (
                <Pause size={18} color="#18181B" fill="#18181B" />
              ) : (
                <Play size={18} color="#18181B" fill="#18181B" style={{ marginLeft: 2 }} />
              )}
            </Animated.View>
          </Pressable>

          {/* Skip Next */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSkipNext}
            style={styles.navButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipForward size={16} color="#A1A1AA" fill="#A1A1AA" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 28, // Pill shape matching PWA Screenshot 1
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  progressBarBackground: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  progressBarFill: {
    height: '100%',
  },
  dockContent: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    gap: 10,
  },
  thumbnailWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21, // Circular artwork matching Screenshot 1
    overflow: 'hidden',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  discPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 13.5,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#F4F4F5',
    letterSpacing: -0.2,
  },
  trackArtist: {
    fontSize: 11.5,
    fontFamily: 'Inter',
    color: '#A1A1AA',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4D4D8', // Chill soft light grey matching PWA
    alignItems: 'center',
    justifyContent: 'center',
  },
});
