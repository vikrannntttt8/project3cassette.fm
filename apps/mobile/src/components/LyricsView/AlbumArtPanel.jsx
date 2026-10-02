import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Disc } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

export default function AlbumArtPanel({ song, isPlaying = false, onTitlePress, onArtistPress }) {
  const artworkScale = useSharedValue(1);

  React.useEffect(() => {
    artworkScale.value = withTiming(isPlaying ? 1.02 : 0.98, { duration: 400 });
  }, [isPlaying]);

  const animatedArtworkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: artworkScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Artwork container */}
      <Animated.View style={[styles.artworkWrapper, animatedArtworkStyle]}>
        {song?.thumbnail || song?.cover ? (
          <Image
            source={{ uri: song.cover || song.thumbnail }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <Disc size={64} color="#525252" />
        )}
      </Animated.View>

      {/* Track Metadata */}
      <View style={styles.metaContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onTitlePress}
          style={styles.titleTouch}
        >
          <Text numberOfLines={1} style={styles.title}>
            {song?.title || 'No Track Loaded'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onArtistPress}
        >
          <Text numberOfLines={1} style={styles.artist}>
            {song?.artist || song?.artists?.[0]?.name || 'Unknown Artist'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  artworkWrapper: {
    width: 270,
    height: 270,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1c1c1f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 20,
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  metaContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  titleTouch: {
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  artist: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    fontWeight: '500',
  },
});
