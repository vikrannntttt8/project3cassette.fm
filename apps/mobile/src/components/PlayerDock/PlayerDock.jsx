import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Play, Pause, SkipForward, Heart, Music } from 'lucide-react-native';

export default function PlayerDock({
  currentSong,
  isPlaying = false,
  isLoading = false,
  isLiked = false,
  onPress,
  onTogglePlay,
  onSkipNext,
  onToggleLike,
}) {
  if (!currentSong) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="mx-3 mb-2 p-2.5 rounded-2xl bg-[#161616] border border-white/10 flex-row items-center justify-between shadow-2xl"
    >
      {/* Thumbnail + Metadata */}
      <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
        <View className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 items-center justify-center">
          {currentSong.thumbnail || currentSong.cover ? (
            <Image
              source={{ uri: currentSong.thumbnail || currentSong.cover }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Music size={18} color="#737373" />
          )}
        </View>

        <View className="flex-1 min-w-0 justify-center">
          <Text
            numberOfLines={1}
            className="text-[13px] font-semibold text-white tracking-tight"
          >
            {currentSong.title || 'Nothing playing'}
          </Text>
          <Text
            numberOfLines={1}
            className="text-[11px] text-neutral-400 mt-0.5"
          >
            {currentSong.artist || currentSong.artists?.[0]?.name || 'Unknown Artist'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center gap-2">
        {/* Like Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleLike?.(currentSong)}
          className="p-2"
        >
          <Heart
            size={18}
            color={isLiked ? '#FFFFFF' : '#737373'}
            fill={isLiked ? '#FFFFFF' : 'none'}
          />
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onTogglePlay}
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-md"
        >
          {isPlaying ? (
            <Pause size={18} color="#000000" fill="#000000" />
          ) : (
            <Play size={18} color="#000000" fill="#000000" />
          )}
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSkipNext}
          className="p-2"
        >
          <SkipForward size={18} color="#A3A3A3" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
