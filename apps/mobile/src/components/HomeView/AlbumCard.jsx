import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Disc, Play } from 'lucide-react-native';

export default function AlbumCard({ item, onPress }) {
  if (!item) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(item)}
      className="p-3 rounded-2xl bg-[#161616] border border-white/5 w-[150px] mr-3"
    >
      {/* Artwork */}
      <View className="w-full aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-white/5 relative items-center justify-center mb-2.5">
        {item.thumbnail || item.cover ? (
          <Image
            source={{ uri: item.thumbnail || item.cover }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Disc size={32} color="#525252" />
        )}

        {/* Track count badge */}
        {item.songCount > 0 ? (
          <View className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded-full border border-white/10">
            <Text className="text-[9px] font-mono text-neutral-300">
              {item.songCount} tracks
            </Text>
          </View>
        ) : null}
      </View>

      {/* Info */}
      <View className="w-full">
        <Text
          numberOfLines={1}
          className="text-xs font-bold text-white tracking-tight"
        >
          {item.title || 'Untitled'}
        </Text>
        <Text
          numberOfLines={1}
          className="text-[11px] text-neutral-400 mt-0.5"
        >
          {item.artist || item.year || item.subtitle || 'Album'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
