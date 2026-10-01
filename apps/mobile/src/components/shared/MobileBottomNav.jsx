import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, Search, Library, Settings } from 'lucide-react-native';

export default function MobileBottomNav({ currentTab = 'home', onTabPress }) {
  const tabs = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'search', label: 'Search', Icon: Search },
    { id: 'library', label: 'Library', Icon: Library },
    { id: 'settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <View className="flex-row items-center justify-around py-2.5 px-4 bg-[#0e0e0e] border-t border-white/5">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const IconComponent = tab.Icon;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onPress={() => onTabPress?.(tab.id)}
            className="items-center justify-center py-1 px-3 gap-1 min-w-[60px]"
          >
            <IconComponent
              size={20}
              color={isActive ? '#FFFFFF' : '#737373'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <Text
              className={`text-[10px] font-medium tracking-tight ${
                isActive ? 'text-white font-bold' : 'text-neutral-500'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
