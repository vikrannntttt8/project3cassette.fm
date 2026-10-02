import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Play, Pause, SkipForward, SkipBack, Heart, Music } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { usePlayerStore } from '@cassette/core';

export default function PlayerDock({
  currentSong,
  isPlaying = false,
  isLoading = false,
  isLiked = false,
  onPress,
  onTogglePlay,
  onSkipNext,
  onSkipPrev,
  onToggleLike,
}) {
  if (!currentSong) return null;

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

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const playButtonScale = useSharedValue(1);
  const likeScale = useSharedValue(1);

  const handlePlayPressIn = () => {
    playButtonScale.value = withSpring(0.88, { damping: 15, stiffness: 300 });
  };

  const handlePlayPressOut = () => {
    playButtonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedPlayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  const animatedLikeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handleLikePress = () => {
    likeScale.value = withSequence(
      withSpring(1.35, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onToggleLike?.(currentSong);
  };

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18).stiffness(160)}
      exiting={SlideOutDown.duration(220)}
      style={styles.dockWrapper}
    >
      {/* Realtime audio progress line at top border */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <TouchableOpacity
        activeOpacity={0.94}
        onPress={onPress}
        style={styles.dockContent}
      >
        {/* Thumbnail + Metadata */}
        <View style={styles.trackInfo}>
          <View style={[styles.thumbnailWrapper, isPlaying && styles.thumbnailPlaying]}>
            {currentSong.thumbnail || currentSong.cover ? (
              <Image
                source={{ uri: currentSong.thumbnail || currentSong.cover }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Music size={18} color="#737373" />
            )}

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            )}
          </View>

          <View style={styles.textContainer}>
            <Text numberOfLines={1} style={styles.trackTitle}>
              {currentSong.title || 'Nothing playing'}
            </Text>
            <Text numberOfLines={1} style={styles.trackArtist}>
              {currentSong.artist || currentSong.artists?.[0]?.name || 'Unknown Artist'}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          {/* Like Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLikePress}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={animatedLikeStyle}>
              <Heart
                size={18}
                color={isLiked ? '#FFFFFF' : '#737373'}
                fill={isLiked ? '#FFFFFF' : 'none'}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Skip Previous */}
          {onSkipPrev && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSkipPrev}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SkipBack size={18} color="#A3A3A3" />
            </TouchableOpacity>
          )}

          {/* Interactive Bouncy Play/Pause */}
          <Pressable
            onPress={onTogglePlay}
            onPressIn={handlePlayPressIn}
            onPressOut={handlePlayPressOut}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Animated.View style={[styles.playButton, animatedPlayStyle]}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : isPlaying ? (
                <Pause size={17} color="#000000" fill="#000000" />
              ) : (
                <Play size={17} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
              )}
            </Animated.View>
          </Pressable>

          {/* Skip Next */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSkipNext}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipForward size={18} color="#A3A3A3" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: '#161618',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  progressBarBackground: {
    height: 2.5,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  dockContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: 44,
    height: 44,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbnailPlaying: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
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
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  trackArtist: {
    fontSize: 11.5,
    color: '#a1a1aa',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});
