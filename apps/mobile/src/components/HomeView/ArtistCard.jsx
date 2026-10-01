import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';

export default function ArtistCard({ item, onPress }) {
  if (!item) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(item)}
      className="items-center w-[110px] mr-3"
    >
      {/* Circular Avatar */}
      <View className="w-24 h-24 rounded-full overflow-hidden bg-neutral-900 border border-white/10 items-center justify-center mb-2 shadow-lg">
        {item.thumbnail || item.avatar ? (
          <Image
            source={{ uri: item.thumbnail || item.avatar }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <User size={32} color="#525252" />
        )}
      </View>

      <Text
        numberOfLines={1}
        className="text-xs font-semibold text-white tracking-tight text-center w-full"
      >
        {item.name || item.title || 'Artist'}
      </Text>
      <Text
        numberOfLines={1}
        className="text-[10px] text-neutral-400 mt-0.5 text-center"
      >
        Artist
      </Text>
    </TouchableOpacity>
  );
}
