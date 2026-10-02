import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Heart, ListMusic, DownloadCloud, Plus } from 'lucide-react-native';
import SongRow from '../HomeView/SongRow.jsx';

export default function LibraryView({
  likedSongs = [],
  playlists = [],
  offlineTracks = [],
  activeSongId,
  isPlaying,
  onPlaySong,
  onSelectPlaylist,
  onToggleLike,
}) {
  const [section, setSection] = useState('liked'); // 'liked' | 'playlists' | 'offline'

  const sections = [
    { id: 'liked', label: `Liked (${likedSongs.length})`, Icon: Heart },
    { id: 'playlists', label: `Playlists (${playlists.length})`, Icon: ListMusic },
    { id: 'offline', label: `Downloaded (${offlineTracks.length})`, Icon: DownloadCloud },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0e0e0e' }}
      className="flex-1 bg-[#0e0e0e]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 130 }}
    >
      {/* ── Sub-navigation ── */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sections.map((s) => {
            const isSelected = section === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.7}
                onPress={() => setSection(s.id)}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  isSelected
                    ? 'bg-white border-white'
                    : 'bg-[#161616] border-white/10'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-black' : 'text-neutral-400'
                  }`}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View className="px-4 pt-4">
        {/* Liked Songs List */}
        {section === 'liked' && (
          <View>
            {likedSongs.length === 0 ? (
              <View className="items-center justify-center py-16">
                <Heart size={48} color="#525252" className="mb-3" />
                <Text className="text-base font-semibold text-white mb-1">
                  No liked songs yet
                </Text>
                <Text className="text-xs text-neutral-500 text-center max-w-[240px]">
                  Tap the heart icon on any song to add it to your library
                </Text>
              </View>
            ) : (
              likedSongs.map((song, idx) => (
                <SongRow
                  key={song.id || idx}
                  song={song}
                  index={idx}
                  isActive={activeSongId === song.id}
                  isPlaying={isPlaying}
                  isLiked={true}
                  onPlay={() => onPlaySong?.(song)}
                  onToggleLike={() => onToggleLike?.(song)}
                />
              ))
            )}
          </View>
        )}

        {/* Playlists List */}
        {section === 'playlists' && (
          <View>
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-row items-center gap-3 p-4 rounded-2xl bg-[#161616] border border-white/10 mb-3"
            >
              <View className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center">
                <Plus size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text className="text-sm font-bold text-white">Create New Playlist</Text>
                <Text className="text-xs text-neutral-400">Organize your music</Text>
              </View>
            </TouchableOpacity>

            {playlists.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                activeOpacity={0.7}
                onPress={() => onSelectPlaylist?.(pl)}
                className="flex-row items-center gap-3.5 p-3 rounded-2xl bg-[#161616] border border-white/5 mb-2"
              >
                <View className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/10 items-center justify-center">
                  <ListMusic size={20} color="#737373" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text numberOfLines={1} className="text-sm font-semibold text-white">
                    {pl.title || 'Untitled Playlist'}
                  </Text>
                  <Text className="text-xs text-neutral-400 mt-0.5">
                    {pl.songs?.length || 0} tracks
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Offline Downloads */}
        {section === 'offline' && (
          <View>
            {offlineTracks.length === 0 ? (
              <View className="items-center justify-center py-16">
                <DownloadCloud size={48} color="#525252" className="mb-3" />
                <Text className="text-base font-semibold text-white mb-1">
                  No offline songs cached
                </Text>
                <Text className="text-xs text-neutral-500 text-center max-w-[240px]">
                  Downloaded songs will appear here for playback without internet
                </Text>
              </View>
            ) : (
              offlineTracks.map((song, idx) => (
                <SongRow
                  key={song.id || idx}
                  song={song}
                  index={idx}
                  isActive={activeSongId === song.id}
                  isPlaying={isPlaying}
                  onPlay={() => onPlaySong?.(song)}
                />
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
