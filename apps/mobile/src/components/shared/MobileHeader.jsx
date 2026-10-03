import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Search, Settings } from 'lucide-react-native';
import { usePlayerStore } from '@cassette/core';
import { googleAuthSyncService } from '../../services/googleAuthSyncService.js';

export default function MobileHeader({ onSearchPress, onProfilePress, onSettingsPress }) {
  const [user, setUser] = useState(googleAuthSyncService.getUser());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(usePlayerStore.getState().isPlaying);

  // Subscribe to live audio playback state
  useEffect(() => {
    const unsubPlayer = usePlayerStore.subscribe((state) => {
      setIsPlaying(state.isPlaying);
    });
    return () => unsubPlayer();
  }, []);

  // Subscribe to live Google / YouTube sync state
  useEffect(() => {
    const unsubAuth = googleAuthSyncService.subscribe((u, syncing) => {
      setUser({ ...u });
      setIsSyncing(syncing);
    });
    return () => unsubAuth();
  }, []);

  // Dynamic status pulse animation
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (isPlaying || isSyncing) {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 700 }), withTiming(1, { duration: 700 })),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying, isSyncing]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Dynamic indicator color based on live runtime status
  const getDotColor = () => {
    if (isSyncing) return '#f59e0b'; // Amber: live cloud/YouTube sync
    if (isPlaying) return '#10b981'; // Emerald: active audio stream
    return '#a1a1aa'; // Neutral zinc: idle
  };

  return (
    <View style={styles.headerContainer}>
      {/* Dynamic Brand Logo & Live Status Indicator */}
      <View style={styles.brandRow}>
        <Text style={styles.brandText}>cassette.fm</Text>
        <Animated.View
          style={[
            styles.brandDot,
            { backgroundColor: getDotColor() },
            animatedDotStyle,
          ]}
        />
      </View>

      {/* Right Action Icons: Search + Live Account Avatar + Settings */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSearchPress}
          style={styles.actionButton}
          accessibilityLabel="Search music"
        >
          <Search size={18} color="#D4D4D8" strokeWidth={2.2} />
        </TouchableOpacity>

        {/* Live User Avatar reflecting connected Gmail/Google account */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onProfilePress}
          style={[
            styles.avatarButton,
            { backgroundColor: user.isConnected ? user.avatarBg || '#ea580c' : '#3f3f46' },
          ]}
          accessibilityLabel={`Account ${user.name || 'Profile'}`}
        >
          <Text style={styles.avatarText}>{user.avatarLetter || 'V'}</Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSettingsPress || onProfilePress}
          style={styles.actionButton}
          accessibilityLabel="Settings"
        >
          <Settings size={18} color="#D4D4D8" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0c',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.6,
  },
  brandDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    marginTop: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
