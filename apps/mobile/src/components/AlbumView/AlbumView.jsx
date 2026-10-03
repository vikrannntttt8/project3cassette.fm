import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeft, Play, Shuffle, Heart, Music, Clock } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import AnimatedEqualizer from '../shared/AnimatedEqualizer.jsx';

function formatDuration(sec) {
  if (!sec) return '3:30';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function AlbumView({
  album,
  onBack,
  onPlaySong,
  onPlayAll,
  onToggleLike,
  activeSongId,
  isPlaying,
}) {
  if (!album) return null;

  const playAllScale = useSharedValue(1);
  const shuffleScale = useSharedValue(1);

  const tracks = album.tracks || [
    { id: `${album.id || 'alb'}-1`, title: 'Track 1', artist: album.artist, duration: 215 },
    { id: `${album.id || 'alb'}-2`, title: 'Track 2', artist: album.artist, duration: 198 },
    { id: `${album.id || 'alb'}-3`, title: 'Track 3', artist: album.artist, duration: 240 },
    { id: `${album.id || 'alb'}-4`, title: 'Track 4', artist: album.artist, duration: 185 },
    { id: `${album.id || 'alb'}-5`, title: 'Track 5', artist: album.artist, duration: 220 },
  ];

  const coverUrl = album.cover || album.thumbnail || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500';

  const animatedPlayAll = useAnimatedStyle(() => ({
    transform: [{ scale: playAllScale.value }],
  }));

  const animatedShuffle = useAnimatedStyle(() => ({
    transform: [{ scale: shuffleScale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {album.title}
        </Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Album Header Info */}
        <View style={styles.headerInfo}>
          <View style={styles.coverWrapper}>
            <Image
              source={{ uri: coverUrl }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
            />
          </View>

          <Text style={styles.albumTitle}>{album.title}</Text>
          <Text style={styles.albumArtist}>{album.artist}</Text>
          <Text style={styles.albumMeta}>
            Album • {album.year || '2024'} • {tracks.length} Songs
          </Text>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Animated.View style={[styles.playAllWrapper, animatedPlayAll]}>
              <Pressable
                onPress={() => onPlayAll?.(tracks.map((t) => ({ ...t, thumbnail: coverUrl, cover: coverUrl })))}
                onPressIn={() => (playAllScale.value = withSpring(0.92, { damping: 14, stiffness: 300 }))}
                onPressOut={() => (playAllScale.value = withSpring(1, { damping: 15, stiffness: 250 }))}
                style={styles.playAllButton}
              >
                <Play size={18} color="#000000" fill="#000000" />
                <Text style={styles.playAllText}>Play All</Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={animatedShuffle}>
              <Pressable
                onPress={() =>
                  onPlayAll?.(
                    [...tracks]
                      .sort(() => Math.random() - 0.5)
                      .map((t) => ({ ...t, thumbnail: coverUrl, cover: coverUrl }))
                  )
                }
                onPressIn={() => (shuffleScale.value = withSpring(0.88, { damping: 14, stiffness: 300 }))}
                onPressOut={() => (shuffleScale.value = withSpring(1, { damping: 15, stiffness: 250 }))}
                style={styles.shuffleButton}
              >
                <Shuffle size={18} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* Track List */}
        <View style={styles.trackListContainer}>
          <Text style={styles.tracksSectionLabel}>Tracks</Text>

          {tracks.map((track, idx) => {
            const isCurrent = activeSongId === (track.id || track.videoId);
            return (
              <TouchableOpacity
                key={track.id || idx}
                activeOpacity={0.7}
                onPress={() => onPlaySong?.({ ...track, thumbnail: coverUrl, cover: coverUrl })}
                style={[
                  styles.trackRow,
                  isCurrent && styles.trackRowActive,
                ]}
              >
                <View style={styles.trackLeft}>
                  <View style={styles.trackIndexWrapper}>
                    {isCurrent && isPlaying ? (
                      <AnimatedEqualizer isPlaying={isPlaying} color="#FFFFFF" maxHeight={12} barWidth={2} />
                    ) : (
                      <Text style={[styles.trackIndex, isCurrent && styles.trackIndexActive]}>
                        {idx + 1}
                      </Text>
                    )}
                  </View>
                  <View style={styles.trackTextContainer}>
                    <Text numberOfLines={1} style={[styles.trackTitle, isCurrent && styles.trackTitleActive]}>
                      {track.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.trackArtist}>
                      {track.artist || album.artist}
                    </Text>
                  </View>
                </View>

                <View style={styles.trackRight}>
                  <Text style={styles.trackDuration}>
                    {formatDuration(track.duration)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d4d4d8',
    maxWidth: 200,
  },
  spacer: {
    width: 38,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  headerInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  coverWrapper: {
    width: 190,
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1f1f22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  albumTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 6,
  },
  albumMeta: {
    fontSize: 11,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#71717a',
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  playAllWrapper: {
    flex: 1,
    maxWidth: 160,
  },
  playAllButton: {
    height: 46,
    backgroundColor: '#ffffff',
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  playAllText: {
    fontFamily: 'Inter',
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  shuffleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1c1c1f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackListContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tracksSectionLabel: {
    fontSize: 11,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#71717a',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  trackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  trackIndexWrapper: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackIndex: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#71717a',
  },
  trackIndexActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  trackTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  trackTitleActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  trackArtist: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  trackRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackDuration: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#71717a',
  },
});
