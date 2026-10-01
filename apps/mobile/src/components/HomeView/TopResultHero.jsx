import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Play, CheckCircle, Disc, Music, User } from 'lucide-react-native';

export default function TopResultHero({ entity, onPlay, onPress }) {
  if (!entity) return null;

  const isArtist = entity.type === 'artist';
  const isAlbum = entity.type === 'album';
  const badgeText = isArtist ? 'Verified Artist' : isAlbum ? 'Official Album' : 'Top Match';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(entity)}
      className="w-full rounded-3xl bg-[#161616] border border-white/10 p-5 mb-5 shadow-2xl"
    >
      <View className="flex-row items-center gap-4">
        {/* Artwork / Avatar */}
        <View
          className={`w-24 h-24 overflow-hidden bg-neutral-900 border border-white/10 items-center justify-center shadow-lg ${
            isArtist ? 'rounded-full' : 'rounded-2xl'
          }`}
        >
          {entity.thumbnail || entity.cover ? (
            <Image
              source={{ uri: entity.thumbnail || entity.cover }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : isArtist ? (
            <User size={36} color="#737373" />
          ) : isAlbum ? (
            <Disc size={36} color="#737373" />
          ) : (
            <Music size={36} color="#737373" />
          )}
        </View>

        {/* Details */}
        <View className="flex-1 min-w-0 justify-center">
          {/* Badge */}
          <View className="flex-row items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 mb-1.5">
            <CheckCircle size={11} color="#FFFFFF" />
            <Text className="text-[10px] font-bold text-white uppercase tracking-wider">
              {badgeText}
            </Text>
          </View>

          <Text
            numberOfLines={1}
            className="text-lg font-bold text-white tracking-tight"
          >
            {entity.name || entity.title}
          </Text>

          <Text
            numberOfLines={1}
            className="text-xs text-neutral-400 mt-0.5"
          >
            {entity.subtitle || entity.artist || (isArtist ? 'Artist Profile' : 'High Match')}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <View className="mt-4 pt-3 border-t border-white/5 flex-row justify-end">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPlay?.(entity)}
          className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-white self-start"
        >
          <Play size={14} color="#000000" fill="#000000" />
          <Text className="text-xs font-bold text-black uppercase tracking-wider">
            {isArtist ? 'Play Top Tracks' : 'Play Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
