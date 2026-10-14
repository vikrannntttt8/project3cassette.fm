import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MoreHorizontal, Sparkles, SlidersHorizontal, Mic, Users, Shuffle } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/NativeContextProviders.jsx';

export default function ArchiveTuneActionBar({
  onOpenActionMenu,
  onRecognizeMusic,
  onMusicTogether,
  onShuffleQueue,
  queueLength = 0,
}) {
  const { theme, themeStyle } = useTheme();
  const isOled = themeStyle === 'oled';

  const menuScale = useSharedValue(1);

  const handlePressIn = () => {
    menuScale.value = withSpring(0.9, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    menuScale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const animatedMenuStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* ArchiveTune Status / Context Pill */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onOpenActionMenu}
        style={[
          styles.statusPill,
          {
            backgroundColor: isOled ? '#121214' : '#18181b',
            borderColor: isOled ? '#242428' : 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      >
        <Sparkles size={13} color="#FFFFFF" strokeWidth={2.2} />
        <Text style={styles.statusText}>ArchiveTune Actions</Text>
        <View style={styles.dotSeparator} />
        <Text style={styles.statusSubtext}>Recognize • Together • Shuffle</Text>
      </TouchableOpacity>

      {/* 3-Dot Button positioned directly above the mini player (ArchiveTune Layout) */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onOpenActionMenu}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.moreBtnWrapper}
        accessibilityLabel="Open ArchiveTune action menu"
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            styles.moreButton,
            {
              backgroundColor: isOled ? '#121214' : '#18181b',
              borderColor: isOled ? '#242428' : 'rgba(255, 255, 255, 0.1)',
            },
            animatedMenuStyle,
          ]}
        >
          <MoreHorizontal size={17} color="#FFFFFF" strokeWidth={2.2} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 3,
    marginBottom: 4,
    gap: 8,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 11.5,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#71717A',
  },
  statusSubtext: {
    fontSize: 10.5,
    fontFamily: 'Inter',
    color: '#A1A1AA',
    includeFontPadding: false,
  },
  moreBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 34,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
