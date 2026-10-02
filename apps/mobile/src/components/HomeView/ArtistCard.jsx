import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export default function ArtistCard({ item, onPress }) {
  if (!item) return null;

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 14, stiffness: 280 });
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
        style={styles.container}
      >
        {/* Circular Avatar */}
        <View style={styles.avatarWrapper}>
          {item.thumbnail || item.avatar ? (
            <Image
              source={{ uri: item.thumbnail || item.avatar }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <User size={32} color="#525252" />
          )}
        </View>

        <Text numberOfLines={1} style={styles.name}>
          {item.name || item.title || 'Artist'}
        </Text>
        <Text numberOfLines={1} style={styles.role}>
          Artist
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 12,
  },
  container: {
    alignItems: 'center',
    width: 104,
  },
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: '#1f1f22',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
    textAlign: 'center',
    width: '100%',
  },
  role: {
    fontSize: 10,
    color: '#a1a1aa',
    marginTop: 2,
    textAlign: 'center',
  },
});
