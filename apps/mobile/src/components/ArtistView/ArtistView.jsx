import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ArrowLeft, Play, Radio, Heart, Check, Disc } from 'lucide-react-native';
import SongRow from '../HomeView/SongRow.jsx';
import AlbumCard from '../HomeView/AlbumCard.jsx';

export default function ArtistView({
  artist,
  onBack,
  onPlaySong,
  onSelectAlbum,
  onToggleLike,
  activeSongId,
  isPlaying,
}) {
  const [isFollowing, setIsFollowing] = useState(false);

  if (!artist) return null;

  const artistName = artist.name || artist.title || 'Artist';
  const avatarUrl = artist.thumbnail || artist.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';

  const topTracks = artist.topTracks || [
    { id: `${artist.id || 'art'}-1`, title: 'Popular Track 1', artist: artistName, duration: 215, thumbnail: avatarUrl },
    { id: `${artist.id || 'art'}-2`, title: 'Popular Track 2', artist: artistName, duration: 230, thumbnail: avatarUrl },
    { id: `${artist.id || 'art'}-3`, title: 'Popular Track 3', artist: artistName, duration: 190, thumbnail: avatarUrl },
    { id: `${artist.id || 'art'}-4`, title: 'Popular Track 4', artist: artistName, duration: 250, thumbnail: avatarUrl },
  ];

  const discography = artist.albums || [
    { id: `${artist.id || 'art'}-alb-1`, title: `${artistName} (Deluxe)`, artist: artistName, year: '2023', thumbnail: avatarUrl },
    { id: `${artist.id || 'art'}-alb-2`, title: 'The Classics', artist: artistName, year: '2021', thumbnail: avatarUrl },
  ];

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
          {artistName}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Artist Hero Header */}
        <View className="items-center px-6 pt-6 pb-4">
          <View className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-2 border-white/10 mb-4 bg-[#161616]">
            <Image
              source={{ uri: avatarUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-2xl font-black text-white text-center tracking-tight">
              {artistName}
            </Text>
            <View className="w-4 h-4 rounded-full bg-blue-500 items-center justify-center">
              <Check size={10} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>

          <Text className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-5">
            Verified Artist • 18.4M Monthly Listeners
          </Text>

          {/* Action Row */}
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPlaySong?.(topTracks[0])}
              className="h-11 px-6 bg-white rounded-full flex-row items-center justify-center gap-2 shadow-lg"
            >
              <Play size={16} color="#000000" fill="#000000" />
              <Text className="text-black font-bold text-sm">Play Top Track</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsFollowing(!isFollowing)}
              className={`h-11 px-5 rounded-full border items-center justify-center ${
                isFollowing ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/20'
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${isFollowing ? 'text-white' : 'text-neutral-300'}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Tracks Shelf */}
        <View className="px-4 pt-4 mb-6">
          <Text className="text-base font-bold text-white tracking-tight mb-3">
            Popular Releases
          </Text>
          {topTracks.map((song, idx) => (
            <SongRow
              key={song.id || idx}
              song={song}
              index={idx}
              isActive={activeSongId === (song.id || song.videoId)}
              isPlaying={isPlaying}
              onPlay={() => onPlaySong?.(song)}
              onToggleLike={() => onToggleLike?.(song)}
            />
          ))}
        </View>

        {/* Discography Shelf */}
        <View className="px-4 mb-6">
          <Text className="text-base font-bold text-white tracking-tight mb-3">
            Discography
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {discography.map((album, idx) => (
              <AlbumCard
                key={album.id || idx}
                item={album}
                onPress={() => onSelectAlbum?.(album)}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
