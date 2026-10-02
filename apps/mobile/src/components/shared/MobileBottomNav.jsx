import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Radio, Search, Library, Settings } from 'lucide-react-native';

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
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const IconComponent = tab.Icon;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => onTabPress?.(tab.id)}
              style={styles.tabItem}
            >
              {/* Active Top Indicator Pill */}
              {isActive && <View style={styles.activeIndicator} />}

              <IconComponent
                size={21}
                color={isActive ? '#FFFFFF' : '#737373'}
                strokeWidth={isActive ? 2.5 : 1.9}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
