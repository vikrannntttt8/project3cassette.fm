import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreVertical, Music } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { formatTime } from '@cassette/core';
import AnimatedEqualizer from '../shared/AnimatedEqualizer.jsx';

export default function SongRow({
  song,
  index,
  isActive = false,
  isPlaying = false,
  isLiked = false,
  onPlay,
  onToggleLike,
  onMorePress,
}) {
  if (!song) return null;

  const rowScale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const handlePressIn = () => {
    rowScale.value = withSpring(0.97, { damping: 15, stiffness: 250 });
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
      withSpring(1.4, { damping: 10, stiffness: 300 }),
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
          isActive ? styles.containerActive : styles.containerInactive,
        ]}
      >
        {/* Index or Live Equalizer */}
        <View style={styles.indexColumn}>
          {isActive && isPlaying ? (
            <AnimatedEqualizer isPlaying={isPlaying} color="#FFFFFF" maxHeight={14} barWidth={2.5} />
          ) : (
            <Text style={[styles.indexText, isActive && styles.indexTextActive]}>
              {index != null ? index + 1 : '•'}
            </Text>
          )}
        </View>

        {/* Thumbnail */}
        <View style={styles.thumbnailWrapper}>
          {song.thumbnail || song.cover ? (
            <Image
              source={{ uri: song.thumbnail || song.cover }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Music size={18} color="#737373" />
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
          <Text numberOfLines={1} style={styles.trackArtist}>
            {song.artist || song.artists?.[0]?.name || 'Unknown Artist'}
            {song.album ? ` • ${song.album}` : ''}
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsRow}>
          {durationStr && <Text style={styles.durationText}>{durationStr}</Text>}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLikePress}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={animatedHeartStyle}>
              <Heart
                size={18}
                color={isLiked ? '#FFFFFF' : '#737373'}
                fill={isLiked ? '#FFFFFF' : 'none'}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onMorePress?.(song)}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={18} color="#737373" />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    minHeight: 56,
  },
  containerInactive: {
    backgroundColor: 'rgba(22, 22, 24, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  containerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  indexColumn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  indexText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#737373',
  },
  indexTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  thumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#1f1f22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    fontSize: 13.5,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#f3f3f5',
    letterSpacing: -0.2,
  },
  trackTitleActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  trackArtist: {
    fontSize: 11.5,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
