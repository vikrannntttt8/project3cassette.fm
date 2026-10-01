import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Play, Heart, MoreVertical, Music } from 'lucide-react-native';
import { formatTime } from '@cassette/core';

export default function SongRow({
  song,
  index,
  isActive = false,
  isPlaying = false,
  isLiked = false,
  onPlay,
  onToggleLike,
  onMorePress,
}) {
  if (!song) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPlay?.(song)}
      className={`flex-row items-center gap-3 px-3 py-2.5 rounded-2xl mb-1.5 min-h-[56px] ${
        isActive
          ? 'bg-white/10 border border-white/20'
          : 'bg-[#161616]/70 border border-white/5'
      }`}
    >
      {/* Index or active indicator */}
      <View className="w-6 items-center justify-center">
        {isActive && isPlaying ? (
          <View className="flex-row items-end gap-0.5 h-3.5">
            <View className="w-1 h-3.5 bg-white rounded-full" />
            <View className="w-1 h-2 bg-white rounded-full" />
            <View className="w-1 h-3 bg-white rounded-full" />
          </View>
        ) : (
          <Text
            className={`text-xs font-mono ${
              isActive ? 'text-white font-bold' : 'text-neutral-500'
            }`}
          >
            {index != null ? index + 1 : '•'}
          </Text>
        )}
      </View>

      {/* Thumbnail */}
      <View className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 items-center justify-center">
        {song.thumbnail || song.cover ? (
          <Image
            source={{ uri: song.thumbnail || song.cover }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Music size={18} color="#737373" />
        )}
      </View>

      {/* Song details */}
      <View className="flex-1 min-w-0 justify-center">
        <Text
          numberOfLines={1}
          className={`text-sm font-semibold tracking-tight ${
            isActive ? 'text-white font-bold' : 'text-[#f3f3f5]'
          }`}
        >
          {song.title || 'Untitled Track'}
        </Text>
        <Text
          numberOfLines={1}
          className="text-xs text-neutral-400 mt-0.5"
        >
          {song.artist || song.artists?.[0]?.name || 'Unknown Artist'}
          {song.album ? ` • ${song.album}` : ''}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center gap-1">
        {song.duration ? (
          <Text className="text-xs font-mono text-neutral-500 mr-1">
            {typeof song.duration === 'number' ? formatTime(song.duration) : song.duration}
          </Text>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleLike?.(song)}
          className="p-2"
        >
          <Heart
            size={18}
            color={isLiked ? '#FFFFFF' : '#737373'}
            fill={isLiked ? '#FFFFFF' : 'none'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onMorePress?.(song)}
          className="p-2"
        >
          <MoreVertical size={18} color="#737373" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
