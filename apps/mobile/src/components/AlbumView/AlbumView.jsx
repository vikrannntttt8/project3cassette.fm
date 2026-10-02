import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ArrowLeft, Play, Shuffle, Heart, Music, Clock } from 'lucide-react-native';

function formatDuration(sec) {
  if (!sec) return '3:30';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function AlbumView({
  album,
  onBack,
  onPlaySong,
  onPlayAll,
  onToggleLike,
  activeSongId,
  isPlaying,
}) {
  if (!album) return null;

  const tracks = album.tracks || [
    { id: `${album.id || 'alb'}-1`, title: 'Track 1', artist: album.artist, duration: 215 },
    { id: `${album.id || 'alb'}-2`, title: 'Track 2', artist: album.artist, duration: 198 },
    { id: `${album.id || 'alb'}-3`, title: 'Track 3', artist: album.artist, duration: 240 },
    { id: `${album.id || 'alb'}-4`, title: 'Track 4', artist: album.artist, duration: 185 },
    { id: `${album.id || 'alb'}-5`, title: 'Track 5', artist: album.artist, duration: 220 },
  ];

  const coverUrl = album.cover || album.thumbnail || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500';

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0e0e0e]/90">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text numberOfLines={1} className="text-sm font-bold text-neutral-300 max-w-[200px]">
          {album.title}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Album Header Info */}
        <View className="items-center px-6 pt-6 pb-4">
          <View className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-5 bg-[#161616]">
            <Image
              source={{ uri: coverUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          <Text className="text-2xl font-black text-white text-center tracking-tight mb-1">
            {album.title}
          </Text>
          <Text className="text-base font-semibold text-neutral-400 text-center mb-2">
            {album.artist}
          </Text>
          <Text className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-6">
            Album • {album.year || '2024'} • {tracks.length} Songs
          </Text>

          {/* Action Row */}
          <View className="flex-row items-center gap-4 w-full justify-center">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPlayAll?.(tracks)}
              className="flex-1 max-w-[160px] h-12 bg-white rounded-full flex-row items-center justify-center gap-2 shadow-lg"
            >
              <Play size={18} color="#000000" fill="#000000" />
              <Text className="text-black font-bold text-sm tracking-tight">Play All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPlayAll?.([...tracks].sort(() => Math.random() - 0.5))}
              className="w-12 h-12 rounded-full bg-[#1c1c1e] border border-white/10 items-center justify-center"
            >
              <Shuffle size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Track List */}
        <View className="px-4 pt-4">
          <Text className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3 px-2">
            Tracks
          </Text>

          {tracks.map((track, idx) => {
            const isCurrent = activeSongId === (track.id || track.videoId);
            return (
              <TouchableOpacity
                key={track.id || idx}
                activeOpacity={0.7}
                onPress={() => onPlaySong?.({ ...track, thumbnail: coverUrl, cover: coverUrl })}
                className={`flex-row items-center justify-between py-3 px-3 rounded-xl mb-1 ${
                  isCurrent ? 'bg-white/10 border border-white/10' : 'active:bg-white/5'
                }`}
              >
                <View className="flex-row items-center gap-3.5 flex-1 min-w-0">
                  <Text className={`w-5 text-center text-xs font-mono ${isCurrent ? 'text-white font-bold' : 'text-neutral-500'}`}>
                    {idx + 1}
                  </Text>
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className={`text-sm font-semibold ${isCurrent ? 'text-white font-bold' : 'text-neutral-200'}`}>
                      {track.title}
                    </Text>
                    <Text numberOfLines={1} className="text-xs text-neutral-400">
                      {track.artist || album.artist}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3">
                  <Text className="text-xs font-mono text-neutral-500">
                    {formatDuration(track.duration)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
