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
import { useTheme } from '../../context/NativeContextProviders.jsx';

export default function MobileHeader({
  onBrandPress,
  onSearchPress,
  onSettingsPress,
  onProfilePress,
}) {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(usePlayerStore.getState().isPlaying);
  const [user, setUser] = useState(googleAuthSyncService.getUser());

  // Subscribe to live audio playback state
  useEffect(() => {
    const unsubPlayer = usePlayerStore.subscribe((state) => {
      setIsPlaying(state.isPlaying);
    });
    return () => unsubPlayer();
  }, []);

  // Subscribe to live Google auth state
  useEffect(() => {
    const unsubAuth = googleAuthSyncService.subscribe((u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  // Status pulse indicator for active streaming
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (isPlaying) {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 700 }), withTiming(1, { duration: 700 })),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
      {/* Brand Wordmark (no truncation) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onBrandPress}
        style={styles.brandRow}
      >
        <Text style={styles.brandText}>cassette.fm</Text>
        <Animated.View
          style={[
            styles.brandDot,
            { backgroundColor: isPlaying ? '#10b981' : '#71717a' },
            animatedDotStyle,
          ]}
        />
      </TouchableOpacity>

      {/* Right Actions: Search + User Avatar / Sign In + Settings Gear */}
      <View style={styles.actionsRow}>
        {/* Search Icon */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSearchPress}
          style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityLabel="Search music"
        >
          <Search size={18} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>

        {/* User Profile / Google Avatar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onProfilePress}
          style={[
            styles.avatarButton,
            { backgroundColor: user?.isConnected ? '#ea580c' : theme.surface, borderColor: theme.border },
          ]}
          accessibilityLabel={user?.isConnected ? `Account ${user.name || 'Profile'}` : 'Sign in'}
        >
          {user?.isConnected ? (
            <Text style={styles.avatarText}>{user.avatarLetter || user.name?.[0]?.toUpperCase() || 'V'}</Text>
          ) : (
            <Text style={styles.avatarText}>V</Text>
          )}
        </TouchableOpacity>

        {/* Settings Gear (links directly to Settings) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSettingsPress}
          style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityLabel="Settings"
        >
          <Settings size={18} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  brandText: {
    fontFamily: 'Shrikhand',
    fontSize: 20.5,
    color: '#FFFFFF',
    paddingRight: 12,
    includeFontPadding: true,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
});
