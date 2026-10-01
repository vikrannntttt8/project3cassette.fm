import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Search, User } from 'lucide-react-native';

export default function MobileHeader({ onSearchPress, onProfilePress }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-[#0e0e0e] border-b border-white/5">
      {/* Brand Logo */}
      <View className="flex-row items-center gap-1.5">
        <Text className="text-[22px] font-bold tracking-tight text-white">
          cassette.fm
        </Text>
        <View className="w-2 h-2 rounded-full bg-white shadow-sm" />
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSearchPress}
          className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/5"
          accessibilityLabel="Search"
        >
          <Search size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onProfilePress}
          className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/5"
          accessibilityLabel="Profile"
        >
          <User size={18} color="#A3A3A3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
