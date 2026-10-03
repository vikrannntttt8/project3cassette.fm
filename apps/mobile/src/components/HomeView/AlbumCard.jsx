import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Disc } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export default function AlbumCard({ item, onPress }) {
  if (!item) return null;

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 14, stiffness: 280 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable
        onPress={() => onPress?.(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* Artwork */}
        <View style={styles.imageWrapper}>
          {item.thumbnail || item.cover ? (
            <Image
              source={{ uri: item.thumbnail || item.cover }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Disc size={32} color="#525252" />
          )}

          {/* Track count badge */}
          {item.songCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.songCount} tracks</Text>
            </View>
          ) : null}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title || 'Untitled'}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {item.artist || item.year || item.subtitle || 'Album'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 12,
  },
  card: {
    width: 148,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#161618',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1f1f22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#d4d4d8',
  },
  infoContainer: {
    width: '100%',
  },
  title: {
    fontSize: 12.5,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    marginTop: 2,
  },
});
