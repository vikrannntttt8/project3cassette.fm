import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreVertical, Music, Play } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { formatTime } from '@cassette/core';
import AnimatedEqualizer from '../shared/AnimatedEqualizer.jsx';
import { useTheme } from '../../context/NativeContextProviders.jsx';

export default function SongRow({
  song,
  index,
  isActive = false,
  isPlaying = false,
  isLiked = false,
  onPlay,
  onToggleLike,
  onMorePress,
  onArtistPress,
}) {
  if (!song) return null;

  const { theme, themeStyle } = useTheme();
  const isOled = themeStyle === 'oled';

  const rowScale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const handlePressIn = () => {
    rowScale.value = withSpring(0.98, { damping: 15, stiffness: 250 });
  };

  const handlePressOut = () => {
    rowScale.value = withSpring(1, { damping: 15, stiffness: 250 });
  };

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rowScale.value }],
  }));

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLikePress = () => {
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onToggleLike?.(song);
  };

  const durationStr = song.duration
    ? typeof song.duration === 'number'
      ? formatTime(song.duration)
      : song.duration
    : null;

  return (
    <Animated.View style={[animatedRowStyle, styles.outerWrapper]}>
      <Pressable
        onPress={() => onPlay?.(song)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          isActive
            ? [
                styles.containerActive,
                {
                  backgroundColor: isOled ? '#121214' : '#1c1c20',
                  borderColor: isOled ? '#242428' : 'rgba(255, 255, 255, 0.08)',
                },
              ]
            : styles.containerInactive,
        ]}
      >
        {/* Index or Live Equalizer or Play Icon */}
        <View style={styles.indexColumn}>
          {isActive ? (
            isPlaying ? (
              <AnimatedEqualizer isPlaying={isPlaying} color="#FFFFFF" maxHeight={14} barWidth={2.5} />
            ) : (
              <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
            )
          ) : (
            <Text style={styles.indexText}>
              {index != null ? index + 1 : '•'}
            </Text>
          )}
        </View>

        {/* Circular Artwork matching PWA Screenshot */}
        <View style={styles.thumbnailWrapper}>
          {song.thumbnail || song.cover ? (
            <Image
              source={{ uri: song.thumbnail || song.cover }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Music size={18} color="#71717A" />
          )}
        </View>

        {/* Track Details */}
        <View style={styles.detailsColumn}>
          <Text
            numberOfLines={1}
            style={[styles.trackTitle, isActive && styles.trackTitleActive]}
          >
            {song.title || 'Untitled Track'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onArtistPress?.(song.artist || song.artists?.[0]?.name)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text numberOfLines={1} style={styles.trackArtist}>
              {song.artist || song.artists?.[0]?.name || 'Unknown Artist'}
              {song.album ? ` • ${song.album}` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsRow}>
          {durationStr && <Text style={styles.durationText}>{durationStr}</Text>}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLikePress}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View style={animatedHeartStyle}>
              <Heart
                size={18}
                color={isLiked ? '#FFFFFF' : '#71717A'}
                fill={isLiked ? '#FFFFFF' : 'none'}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onMorePress?.(song)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={18} color="#71717A" />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginBottom: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    minHeight: 56,
  },
  containerInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerActive: {
    borderWidth: 1,
  },
  indexColumn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  indexText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#71717A',
  },
  thumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22, // Circular album art matching PWA
    overflow: 'hidden',
    backgroundColor: '#1f1f22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  detailsColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#EEEEEE',
    letterSpacing: -0.2,
  },
  trackTitleActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trackArtist: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#9E9EA4',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  durationText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#71717a',
    marginRight: 2,
  },
  actionButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
