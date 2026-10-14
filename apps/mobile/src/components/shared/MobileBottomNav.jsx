import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, Library, Clock } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/NativeContextProviders.jsx';

function NavTabItem({ tab, isActive, onPress, theme }) {
  const scale = useSharedValue(1);
  const IconComponent = tab.Icon;

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 12, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[styles.iconWrapper, animatedStyle]}>
        <IconComponent
          size={20}
          color={isActive ? '#FFFFFF' : '#71717A'}
          strokeWidth={isActive ? 2.4 : 1.8}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isActive ? '#FFFFFF' : '#71717A', fontWeight: isActive ? '700' : '500' },
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MobileBottomNav({ currentTab = 'home', onTabPress }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 6);
  const { theme } = useTheme();

  // PWA Tabs: Home, Explore, Library, History (PRD NAV-01 & HIS-01)
  const tabs = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'explore', label: 'Explore', Icon: Compass },
    { id: 'library', label: 'Library', Icon: Library },
    { id: 'history', label: 'History', Icon: Clock },
  ];

  return (
    <View style={[styles.navContainer, { backgroundColor: theme.bg, borderTopColor: theme.border, paddingBottom: bottomPadding }]}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <NavTabItem
            key={tab.id}
            tab={tab}
            theme={theme}
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
    borderTopWidth: 1,
  },
  tabsRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11.5,
    fontFamily: 'Inter',
    textAlign: 'center',
    paddingHorizontal: 6,
    paddingRight: 8,
  },
});
