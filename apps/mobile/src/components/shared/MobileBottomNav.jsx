import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Radio, Search, Library, Settings } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function NavTabItem({ tab, isActive, onPress }) {
  const scale = useSharedValue(1);
  const IconComponent = tab.Icon;

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 12, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      {/* Active Top Indicator */}
      {isActive && <View style={styles.activeIndicator} />}

      <Animated.View style={[styles.iconWrapper, animatedStyle]}>
        <IconComponent
          size={21}
          color={isActive ? '#FFFFFF' : '#737373'}
          strokeWidth={isActive ? 2.5 : 1.9}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          isActive ? styles.tabLabelActive : styles.tabLabelInactive,
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

export default function MobileBottomNav({ currentTab = 'home', onTabPress }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  const tabs = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'radio', label: 'Radio', Icon: Radio },
    { id: 'search', label: 'Search', Icon: Search },
    { id: 'library', label: 'Library', Icon: Library },
    { id: 'settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <View style={[styles.navContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <NavTabItem
            key={tab.id}
            tab={tab}
            isActive={currentTab === tab.id}
            onPress={() => onTabPress?.(tab.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#0c0c0e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  tabsRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 3,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#ffffff',
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: '#737373',
  },
});
