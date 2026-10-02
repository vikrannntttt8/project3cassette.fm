import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, User, Settings } from 'lucide-react-native';

export default function MobileHeader({ onSearchPress, onProfilePress, onSettingsPress }) {
  return (
    <View style={styles.headerContainer}>
      {/* Brand Logo */}
      <View style={styles.brandRow}>
        <Text style={styles.brandText}>cassette.fm</Text>
        <View style={styles.brandDot} />
      </View>

      {/* Right Action Icons: Search + Profile + Settings */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSearchPress}
          style={styles.actionButton}
          accessibilityLabel="Search"
        >
          <Search size={18} color="#A3A3A3" strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onProfilePress}
          style={styles.actionButton}
          accessibilityLabel="Profile"
        >
          <User size={18} color="#A3A3A3" strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSettingsPress || onProfilePress}
          style={styles.actionButton}
          accessibilityLabel="Settings"
        >
          <Settings size={18} color="#A3A3A3" strokeWidth={2.2} />
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
    backgroundColor: '#0e0e0e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginTop: 2,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
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
    backgroundColor: '#18181a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
