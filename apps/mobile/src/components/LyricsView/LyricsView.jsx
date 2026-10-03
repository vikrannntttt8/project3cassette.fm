import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { formatTime } from '@cassette/core';
import AlbumArtPanel from './AlbumArtPanel.jsx';
import LyricsPanel from './LyricsPanel.jsx';

export default function LyricsView({
  currentSong,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  lyrics = [],
  isLiked = false,
  isShuffled = false,
  isRepeat = false,
  onClose,
  onTogglePlay,
  onSkipNext,
  onSkipPrev,
  onSeek,
  onToggleLike,
  onToggleShuffle,
  onToggleRepeat,
}) {
  const [tab, setTab] = useState('art'); // 'art' | 'lyrics'
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const playScale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const animatedPlay = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const animatedHeart = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLikePress = () => {
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onToggleLike?.(currentSong);
  };

  const handleScrubberPress = (e) => {
    const { locationX } = e.nativeEvent;
    // Estimate width or use layout width
    const totalWidth = 320; // fallback standard width
    if (duration > 0 && totalWidth > 0) {
      const seekRatio = Math.max(0, Math.min(1, locationX / totalWidth));
      onSeek?.(seekRatio * duration);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.iconCircle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronDown size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Tab switcher: Cover vs Lyrics */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setTab('art')}
            style={[styles.switchChip, tab === 'art' && styles.switchChipActive]}
          >
            <Text style={[styles.switchText, tab === 'art' ? styles.switchTextActive : styles.switchTextInactive]}>
              Cover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setTab('lyrics')}
            style={[styles.switchChip, tab === 'lyrics' && styles.switchChipActive]}
          >
            <Text style={[styles.switchText, tab === 'lyrics' ? styles.switchTextActive : styles.switchTextInactive]}>
              Lyrics
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLikePress}
          style={styles.iconCircle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View style={animatedHeart}>
            <Heart size={18} color={isLiked ? '#FFFFFF' : '#737373'} fill={isLiked ? '#FFFFFF' : 'none'} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* ── Main Canvas (Cover or Lyrics) ── */}
      <View style={styles.mainCanvas}>
        {tab === 'art' ? (
          <AlbumArtPanel song={currentSong} isPlaying={isPlaying} />
        ) : (
          <LyricsPanel
            lyrics={lyrics}
            currentTime={currentTime}
            onSeek={onSeek}
            hasLyrics={lyrics.length > 0}
          />
        )}
      </View>

      {/* ── Scrubber & Bottom Controls ── */}
      <View style={styles.bottomControls}>
        {/* Interactive Scrubber Bar */}
        <Pressable
          onPress={handleScrubberPress}
          style={styles.scrubberContainer}
        >
          <View style={styles.scrubberTrack}>
            <View style={[styles.scrubberFill, { width: `${progressPercent}%` }]} />
            <View style={[styles.scrubberThumb, { left: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeLabelsRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </Pressable>

        {/* Transport controls */}
        <View style={styles.transportRow}>
          {/* Shuffle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleShuffle}
            style={styles.transportIconBtn}
          >
            <Shuffle size={20} color={isShuffled ? '#FFFFFF' : '#525252'} />
          </TouchableOpacity>

          {/* Previous */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSkipPrev}
            style={styles.transportIconBtn}
          >
            <SkipBack size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Play/Pause */}
          <Pressable
            onPress={onTogglePlay}
            onPressIn={() => (playScale.value = withSpring(0.9, { damping: 15, stiffness: 300 }))}
            onPressOut={() => (playScale.value = withSpring(1, { damping: 15, stiffness: 250 }))}
          >
            <Animated.View style={[styles.mainPlayBtn, animatedPlay]}>
              {isPlaying ? (
                <Pause size={26} color="#000000" fill="#000000" />
              ) : (
                <Play size={26} color="#000000" fill="#000000" style={{ marginLeft: 3 }} />
              )}
            </Animated.View>
          </Pressable>

          {/* Next */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSkipNext}
            style={styles.transportIconBtn}
          >
            <SkipForward size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleRepeat}
            style={styles.transportIconBtn}
          >
            <Repeat size={20} color={isRepeat ? '#FFFFFF' : '#525252'} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0e0e0e',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#161618',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  switchChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  switchChipActive: {
    backgroundColor: '#ffffff',
  },
  switchText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#000000',
  },
  switchTextInactive: {
    color: '#a1a1aa',
  },
  mainCanvas: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 8,
  },
  scrubberContainer: {
    width: '100%',
    marginBottom: 16,
    paddingVertical: 8,
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 8,
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginLeft: -6,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  timeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#71717a',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  transportIconBtn: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
