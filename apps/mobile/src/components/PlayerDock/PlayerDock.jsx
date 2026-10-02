import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Play, Pause, SkipForward, SkipBack, Heart, Music } from 'lucide-react-native';

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

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={styles.dockContainer}
    >
      {/* Thumbnail + Track Metadata */}
      <View style={styles.trackInfo}>
        <View style={styles.thumbnailWrapper}>
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
          onPress={() => onToggleLike?.(currentSong)}
          style={styles.iconButton}
          accessibilityLabel="Like"
        >
          <Heart
            size={18}
            color={isLiked ? '#FFFFFF' : '#737373'}
            fill={isLiked ? '#FFFFFF' : 'none'}
          />
        </TouchableOpacity>

        {/* Skip Previous (Optional) */}
        {onSkipPrev && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSkipPrev}
            style={styles.iconButton}
            accessibilityLabel="Previous"
          >
            <SkipBack size={18} color="#A3A3A3" />
          </TouchableOpacity>
        )}

        {/* Circular Play/Pause */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onTogglePlay}
          style={styles.playButton}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : isPlaying ? (
            <Pause size={17} color="#000000" fill="#000000" />
          ) : (
            <Play size={17} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        {/* Skip Next */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSkipNext}
          style={styles.iconButton}
          accessibilityLabel="Next"
        >
          <SkipForward size={18} color="#A3A3A3" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    marginHorizontal: 10,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#18181a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
