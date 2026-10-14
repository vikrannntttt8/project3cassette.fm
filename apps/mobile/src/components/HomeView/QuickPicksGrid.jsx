import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Play, Pause, MoreVertical, Heart } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/NativeContextProviders.jsx';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH - 32;
const GAP = 12;

function QuickPickCell({
  track,
  isActive,
  isPlaying,
  onPress,
  onMorePress,
  onArtistPress,
  onToggleLike,
  isLiked,
}) {
  const { theme, themeStyle } = useTheme();
  const isOled = themeStyle === 'oled';

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const thumbnailUri = track.thumbnail || track.cover;
  const artistName = track.artist || track.artists?.[0]?.name || 'Unknown Artist';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.cellWrapper}
    >
      <Animated.View
        style={[
          styles.cellInner,
          {
            backgroundColor: isActive
              ? isOled ? '#141416' : '#1c1c20'
              : isOled ? '#080808' : '#151517',
            borderColor: isActive
              ? isOled ? '#262628' : 'rgba(255, 255, 255, 0.12)'
              : isOled ? '#161616' : 'rgba(255, 255, 255, 0.04)',
          },
          animatedStyle,
        ]}
      >
        {/* Album Art */}
        <View style={styles.artContainer}>
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.artImage}
              contentFit="cover"
              cachePolicy="disk"
              transition={150}
            />
          ) : (
            <View style={styles.artPlaceholder}>
              <Play size={16} color="#71717A" />
            </View>
          )}

          {/* Active playback indicator overlay */}
          {isActive && (
            <View style={styles.playingOverlay}>
              {isPlaying ? (
                <Pause size={14} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
              )}
            </View>
          )}
        </View>

        {/* Track Title & Artist */}
        <View style={styles.metaContainer}>
          <Text
            numberOfLines={1}
            style={[styles.trackTitle, isActive && styles.trackTitleActive]}
          >
            {track.title}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              onArtistPress?.(artistName);
            }}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text numberOfLines={1} style={styles.trackArtist}>
              {artistName}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Optional trailing like or action trigger */}
        {onToggleLike && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              onToggleLike(track);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.trailingAction}
          >
            <Heart
              size={16}
              color={isLiked ? '#FFFFFF' : '#71717A'}
              fill={isLiked ? '#FFFFFF' : 'none'}
            />
          </TouchableOpacity>
        )}

        {onMorePress && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              onMorePress(track);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.trailingAction}
          >
            <MoreVertical size={16} color="#71717A" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function QuickPicksGrid({
  tracks = [],
  activeSongId,
  isPlaying,
  likedSongs = [],
  onPlayTrack,
  onMorePress,
  onArtistPress,
  onToggleLike,
}) {
  const columns = useMemo(() => {
    const cols = [];
    const rowsPerCol = 4;
    for (let i = 0; i < tracks.length; i += rowsPerCol) {
      cols.push(tracks.slice(i, i + rowsPerCol));
    }
    return cols;
  }, [tracks]);

  if (!tracks || tracks.length === 0) return null;

  const isTrackLiked = (track) => {
    const targetId = track.id || track.videoId;
    return likedSongs.some((s) => (s.id || s.videoId) === targetId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={PAGE_WIDTH + GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {columns.map((column, colIdx) => (
          <View key={`col-${colIdx}`} style={styles.columnPage}>
            {column.map((track, rowIdx) => {
              const trackId = track.id || track.videoId;
              const isActive = trackId === activeSongId;
              return (
                <QuickPickCell
                  key={trackId || `qp-${colIdx}-${rowIdx}`}
                  track={track}
                  isActive={isActive}
                  isPlaying={isPlaying}
                  isLiked={isTrackLiked(track)}
                  onPress={() => onPlayTrack(track, tracks)}
                  onMorePress={onMorePress}
                  onArtistPress={onArtistPress}
                  onToggleLike={onToggleLike}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: GAP,
  },
  columnPage: {
    width: PAGE_WIDTH,
    gap: 8,
  },
  cellWrapper: {
    height: 56,
    width: '100%',
  },
  cellInner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  artContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1c1c1f',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  artPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1f',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  trackTitle: {
    fontFamily: 'Inter',
    fontSize: 13.5,
    fontWeight: '600',
    color: '#EEEEEE',
    lineHeight: 18,
  },
  trackTitleActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trackArtist: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#9E9EA4',
    lineHeight: 16,
    marginTop: 2,
  },
  trailingAction: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
