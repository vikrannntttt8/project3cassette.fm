import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  MoreHorizontal,
  Volume1,
  Volume2,
  MessageSquare,
  Smartphone,
  ListMusic,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { formatTime, fetchSongLyrics } from '@cassette/core';
import { useTheme } from '../../context/NativeContextProviders.jsx';
import LyricsPanel from './LyricsPanel.jsx';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ART_SIZE = Math.min(SCREEN_WIDTH - 56, 340);

function parseLrc(lrcString) {
  if (!lrcString || typeof lrcString !== 'string') return [];
  const lines = lrcString.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\](.*)/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const totalSeconds = minutes * 60 + seconds + millis / 1000;
      const text = match[4].trim();
      if (text) {
        result.push({ time: totalSeconds, text });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export default function LyricsView({
  currentSong,
  isPlaying = false,
  currentTime = 0,
  duration = 210,
  lyrics: initialLyrics = [],
  queue = [],
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
  onOpenQueue,
  onOpenTrackOptions,
  onOpenArtist,
}) {
  const { theme, themeStyle } = useTheme();
  const isOled = themeStyle === 'oled';

  const [showLyrics, setShowLyrics] = useState(false);
  const [parsedLyrics, setParsedLyrics] = useState([]);
  const [volume, setVolume] = useState(0.85);

  const scrubberWidthRef = useRef(SCREEN_WIDTH - 48);

  // Fetch synced lyrics from lrclib if not embedded
  useEffect(() => {
    let isMounted = true;
    if (Array.isArray(initialLyrics) && initialLyrics.length > 0) {
      setParsedLyrics(initialLyrics);
      return;
    }

    if (currentSong?.title) {
      fetchSongLyrics(
        currentSong.id || currentSong.videoId,
        currentSong.title,
        currentSong.artist || currentSong.artists?.[0]?.name
      )
        .then((res) => {
          if (!isMounted) return;
          if (res?.lrc) {
            setParsedLyrics(parseLrc(res.lrc));
          } else {
            setParsedLyrics([]);
          }
        })
        .catch(() => {
          if (isMounted) setParsedLyrics([]);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [currentSong?.id, currentSong?.videoId, currentSong?.title, initialLyrics]);

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const remainingSeconds = Math.max(0, duration - currentTime);

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
      withSpring(1.35, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onToggleLike?.(currentSong);
  };

  const handleScrubberPress = (e) => {
    const { locationX } = e.nativeEvent;
    const barWidth = scrubberWidthRef.current || SCREEN_WIDTH - 48;
    if (duration > 0 && barWidth > 0) {
      const seekRatio = Math.max(0, Math.min(1, locationX / barWidth));
      onSeek?.(seekRatio * duration);
    }
  };

  const handleVolumePress = (e) => {
    const { locationX } = e.nativeEvent;
    const volWidth = SCREEN_WIDTH - 120;
    if (volWidth > 0) {
      const newVol = Math.max(0, Math.min(1, locationX / volWidth));
      setVolume(newVol);
    }
  };

  const playingFromLabel = currentSong?.album
    ? `Album • ${currentSong.album}`
    : currentSong?.artist
    ? `Artist • ${currentSong.artist}`
    : 'Playing from Cassette Queue';

  const thumbnailUri = currentSong?.thumbnail || currentSong?.cover;
  const queueCount = queue?.length || 10;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isOled ? '#000000' : '#0c0c0e' },
      ]}
      edges={['top', 'bottom']}
    >
      {/* ── Top Bar matching Screenshot 2 ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.iconCircle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronDown size={22} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.playingFromHeader}>PLAYING FROM</Text>
          <Text numberOfLines={1} style={styles.playingFromSubtitle}>
            {playingFromLabel}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onOpenTrackOptions?.(currentSong)}
          style={styles.iconCircle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Track options"
        >
          <MoreHorizontal size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ── Center Canvas: Album Artwork or Synced Lyrics ── */}
      <View style={styles.centerCanvas}>
        {showLyrics ? (
          <LyricsPanel
            lyrics={parsedLyrics}
            currentTime={currentTime}
            onSeek={onSeek}
            hasLyrics={parsedLyrics.length > 0}
          />
        ) : (
          <Pressable
            onPress={() => setShowLyrics(true)}
            style={styles.artworkWrapper}
          >
            {thumbnailUri ? (
              <Image
                source={{ uri: thumbnailUri }}
                style={styles.artworkImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.artPlaceholder}>
                <Play size={48} color="#52525b" />
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* ── Track Meta & Actions Row (Screenshot 2) ── */}
      <View style={styles.metaRow}>
        <View style={styles.metaTextCol}>
          <Text numberOfLines={1} style={styles.trackTitle}>
            {currentSong?.title || 'Unknown Title'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onOpenArtist?.(currentSong?.artist || currentSong?.artists?.[0]?.name)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text numberOfLines={1} style={styles.trackArtist}>
              {currentSong?.artist || currentSong?.artists?.[0]?.name || 'Unknown Artist'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metaActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLikePress}
            style={styles.metaIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={animatedHeart}>
              <Heart
                size={22}
                color={isLiked ? '#FFFFFF' : '#A1A1AA'}
                fill={isLiked ? '#FFFFFF' : 'none'}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onOpenTrackOptions?.(currentSong)}
            style={styles.metaIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Track options"
          >
            <MoreHorizontal size={22} color="#A1A1AA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Smooth Scrubbable Progress Bar with Thumb Knob ── */}
      <View style={styles.scrubberSection}>
        <Pressable
          onPress={handleScrubberPress}
          style={styles.scrubberTouchable}
          onLayout={(e) => {
            scrubberWidthRef.current = e.nativeEvent.layout.width;
          }}
        >
          <View style={styles.scrubberTrack}>
            <View
              style={[
                styles.scrubberFill,
                { width: `${progressPercent}%`, backgroundColor: '#FFFFFF' },
              ]}
            />
            {/* White Circular Thumb Knob */}
            <View
              style={[
                styles.scrubberThumb,
                { left: `${progressPercent}%` },
              ]}
            />
          </View>
        </Pressable>

        <View style={styles.timeLabelsRow}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>-{formatTime(remainingSeconds)}</Text>
        </View>
      </View>

      {/* ── Transport Controls Row (Screenshot 2) ── */}
      <View style={styles.transportRow}>
        {/* Shuffle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleShuffle}
          style={styles.transportBtn}
        >
          <Shuffle
            size={20}
            color={isShuffled ? '#FFFFFF' : '#71717A'}
            strokeWidth={2.2}
          />
        </TouchableOpacity>

        {/* Previous */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSkipPrev}
          style={styles.transportBtn}
        >
          <SkipBack size={26} color="#FFFFFF" fill="#FFFFFF" />
        </TouchableOpacity>

        {/* Large Circular Play/Pause Button with Soft Glow */}
        <Pressable
          onPress={onTogglePlay}
          onPressIn={() => {
            playScale.value = withSpring(0.9, { damping: 15, stiffness: 350 });
          }}
          onPressOut={() => {
            playScale.value = withSpring(1, { damping: 15, stiffness: 350 });
          }}
        >
          <Animated.View style={[styles.mainPlayBtn, animatedPlay]}>
            {isPlaying ? (
              <Pause size={28} color="#000000" fill="#000000" />
            ) : (
              <Play size={28} color="#000000" fill="#000000" style={{ marginLeft: 3 }} />
            )}
          </Animated.View>
        </Pressable>

        {/* Next */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSkipNext}
          style={styles.transportBtn}
        >
          <SkipForward size={26} color="#FFFFFF" fill="#FFFFFF" />
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleRepeat}
          style={styles.transportBtn}
        >
          <Repeat
            size={20}
            color={isRepeat ? '#FFFFFF' : '#71717A'}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>

      {/* ── Volume Slider Row (Screenshot 2) ── */}
      <View style={styles.volumeRow}>
        <Volume1 size={16} color="#71717A" />
        <Pressable onPress={handleVolumePress} style={styles.volumeTrackContainer}>
          <View style={styles.volumeTrack}>
            <View
              style={[
                styles.volumeFill,
                { width: `${volume * 100}%`, backgroundColor: '#FFFFFF' },
              ]}
            />
            <View
              style={[
                styles.volumeThumb,
                { left: `${volume * 100}%` },
              ]}
            />
          </View>
        </Pressable>
        <Volume2 size={18} color="#71717A" />
      </View>

      {/* ── Bottom Bar: Lyrics Toggle / Speaker Pill / Queue (Screenshot 2) ── */}
      <View style={styles.bottomBar}>
        {/* Toggle Lyrics Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowLyrics((prev) => !prev)}
          style={[styles.bottomIconBtn, showLyrics && styles.bottomIconBtnActive]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MessageSquare
            size={19}
            color={showLyrics ? '#FFFFFF' : '#71717A'}
            fill={showLyrics ? '#FFFFFF' : 'none'}
          />
        </TouchableOpacity>

        {/* Output Device Pill */}
        <View style={styles.speakerPill}>
          <Smartphone size={14} color="#FFFFFF" />
          <Text style={styles.speakerText}>Speaker</Text>
          <View style={styles.greenActiveDot} />
        </View>

        {/* Queue Button with Counter Badge */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenQueue}
          style={styles.queueBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ListMusic size={20} color="#FFFFFF" />
          {queueCount > 0 && (
            <View style={styles.queueBadge}>
              <Text style={styles.queueBadgeText}>{queueCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  playingFromHeader: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  playingFromSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  centerCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  artworkWrapper: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 24, // Large rounded corners matching Screenshot 2
    overflow: 'hidden',
    backgroundColor: '#18181b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1f22',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  metaTextCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 22,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  trackArtist: {
    fontSize: 14.5,
    fontFamily: 'Inter',
    color: '#A1A1AA',
    marginTop: 4,
    letterSpacing: -0.1,
  },
  metaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaIconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrubberSection: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  scrubberTouchable: {
    height: 24,
    justifyContent: 'center',
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    position: 'relative',
  },
  scrubberFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrubberThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: -5,
    marginLeft: -7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  timeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontSize: 11.5,
    fontFamily: 'monospace',
    color: '#8E8E93',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 12,
  },
  transportBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
    marginVertical: 10,
  },
  volumeTrackContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  volumeTrack: {
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    position: 'relative',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 2,
  },
  volumeThumb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: -3.2,
    marginLeft: -5,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  bottomIconBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIconBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  speakerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  speakerText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  greenActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 2,
  },
  queueBtn: {
    padding: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#27272a',
    borderRadius: 7,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
