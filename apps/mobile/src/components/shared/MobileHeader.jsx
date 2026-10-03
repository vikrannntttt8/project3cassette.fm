import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Search, Settings, User } from 'lucide-react-native';
import { usePlayerStore } from '@cassette/core';
import { googleAuthSyncService } from '../../services/googleAuthSyncService.js';

export default function MobileHeader({ onSearchPress, onProfilePress, onSettingsPress, onBrandPress }) {
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

  // Subscribe to live Google / Auth sync state
  useEffect(() => {
    const unsubAuth = googleAuthSyncService.subscribe((u, syncing) => {
      setUser(u);
      setIsSyncing(syncing);
    });
    return () => unsubAuth();
  }, []);

  // Dynamic status pulse animation
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (isPlaying || isSyncing) {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.35, { duration: 700 }), withTiming(1, { duration: 700 })),
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
      {/* Dynamic Brand Logo with Shrikhand web-parity font & Live Status Indicator */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onBrandPress}
        style={styles.brandRow}
      >
        <Text style={styles.brandText}>cassette.fm</Text>
        <Animated.View
          style={[
            styles.brandDot,
            { backgroundColor: getDotColor() },
            animatedDotStyle,
          ]}
        />
      </TouchableOpacity>

      {/* Right Action Icons: Search + Live Account Avatar / Sign In + Settings */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSearchPress}
          style={styles.actionButton}
          accessibilityLabel="Search music"
        >
          <Search size={18} color="#D4D4D8" strokeWidth={2.2} />
        </TouchableOpacity>

        {/* Live User Avatar (reflects clean session state: User icon when logged out, initials when logged in) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onProfilePress}
          style={[
            styles.avatarButton,
            user?.isConnected && { backgroundColor: user.avatarBg || '#ea580c' },
          ]}
          accessibilityLabel={user?.isConnected ? `Account ${user.name || 'Profile'}` : 'Sign in'}
        >
          {user?.isConnected ? (
            <Text style={styles.avatarText}>{user.avatarLetter || 'U'}</Text>
          ) : (
            <User size={17} color="#a1a1aa" strokeWidth={2.2} />
          )}
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSettingsPress}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 22,
    fontFamily: 'Shrikhand',
    color: '#ffffff',
    letterSpacing: -0.4,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#18181a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
});
