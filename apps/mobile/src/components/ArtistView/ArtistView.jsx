import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeft, Play, Check } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import SongRow from '../HomeView/SongRow.jsx';
import AlbumCard from '../HomeView/AlbumCard.jsx';

export default function ArtistView({
  artist,
  onBack,
  onPlaySong,
  onSelectAlbum,
  onToggleLike,
  activeSongId,
  isPlaying,
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const playScale = useSharedValue(1);

  if (!artist) return null;

  const artistName = artist.name || artist.title || 'Artist';
  const avatarUrl = artist.thumbnail || artist.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';

  const topTracks = artist.topTracks || [
    { id: `${artist.id || 'art'}-1`, title: 'Popular Track 1', artist: artistName, duration: 215, thumbnail: avatarUrl },
    { id: `${artist.id || 'art'}-2`, title: 'Popular Track 2', artist: artistName, duration: 230, thumbnail: avatarUrl },
    { id: `${artist.id || 'art'}-3`, title: 'Popular Track 3', artist: artistName, duration: 190, thumbnail: avatarUrl },
    { id: `${artist.id || 'art'}-4`, title: 'Popular Track 4', artist: artistName, duration: 250, thumbnail: avatarUrl },
  ];

  const discography = artist.albums || [
    { id: `${artist.id || 'art'}-alb-1`, title: `${artistName} (Deluxe)`, artist: artistName, year: '2023', thumbnail: avatarUrl },
    { id: `${artist.id || 'art'}-alb-2`, title: 'The Classics', artist: artistName, year: '2021', thumbnail: avatarUrl },
  ];

  const animatedPlay = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
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
          {artistName}
        </Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Artist Hero Header */}
        <View style={styles.headerInfo}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
            />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.artistTitle}>{artistName}</Text>
            <View style={styles.verifiedBadge}>
              <Check size={10} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>

          <Text style={styles.artistMeta}>
            Verified Artist • 18.4M Monthly Listeners
          </Text>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Animated.View style={animatedPlay}>
              <Pressable
                onPress={() => onPlaySong?.(topTracks[0])}
                onPressIn={() => (playScale.value = withSpring(0.92, { damping: 14, stiffness: 300 }))}
                onPressOut={() => (playScale.value = withSpring(1, { damping: 15, stiffness: 250 }))}
                style={styles.playButton}
              >
                <Play size={16} color="#000000" fill="#000000" />
                <Text style={styles.playText}>Play Top Track</Text>
              </Pressable>
            </Animated.View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsFollowing(!isFollowing)}
              style={[
                styles.followButton,
                isFollowing ? styles.followButtonActive : styles.followButtonInactive,
              ]}
            >
              <Text
                style={[
                  styles.followText,
                  isFollowing ? styles.followTextActive : styles.followTextInactive,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Tracks Shelf */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Popular Releases</Text>
          {topTracks.map((song, idx) => (
            <SongRow
              key={song.id || idx}
              song={song}
              index={idx}
              isActive={activeSongId === (song.id || song.videoId)}
              isPlaying={isPlaying}
              onPlay={() => onPlaySong?.(song)}
              onToggleLike={() => onToggleLike?.(song)}
            />
          ))}
        </View>

        {/* Discography Shelf */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Discography</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {discography.map((album, idx) => (
              <AlbumCard
                key={album.id || idx}
                item={album}
                onPress={() => onSelectAlbum?.(album)}
              />
            ))}
          </ScrollView>
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
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    backgroundColor: '#1f1f22',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  artistTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistMeta: {
    fontSize: 11,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#71717a',
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    height: 44,
    paddingHorizontal: 22,
    backgroundColor: '#ffffff',
    borderRadius: 22,
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
  playText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13.5,
  },
  followButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  followButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  followText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  followTextInactive: {
    color: '#d4d4d8',
  },
  followTextActive: {
    color: '#ffffff',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
});
