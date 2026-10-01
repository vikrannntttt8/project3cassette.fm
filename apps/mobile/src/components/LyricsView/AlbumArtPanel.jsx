import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Disc } from 'lucide-react-native';

export default function AlbumArtPanel({ song, onTitlePress, onArtistPress }) {
  return (
    <View className="items-center w-full py-2">
      {/* Artwork container */}
      <View className="w-64 h-64 sm:w-72 sm:h-72 aspect-square rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 items-center justify-center shadow-2xl mb-5">
        {song?.thumbnail || song?.cover ? (
          <Image
            source={{ uri: song.cover || song.thumbnail }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <Disc size={64} color="#525252" />
        )}
      </View>

      {/* Metadata */}
      <View className="items-center w-full px-4">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onTitlePress}
          className="mb-1"
        >
          <Text
            numberOfLines={1}
            className="text-xl sm:text-2xl font-bold tracking-tight text-white text-center"
          >
            {song?.title || 'No Track Loaded'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onArtistPress}
        >
          <Text
            numberOfLines={1}
            className="text-sm text-neutral-400 text-center"
          >
            {song?.artist || song?.artists?.[0]?.name || 'Unknown Artist'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
