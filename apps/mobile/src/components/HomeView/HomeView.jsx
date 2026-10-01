import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import TopResultHero from './TopResultHero.jsx';
import SongRow from './SongRow.jsx';
import AlbumCard from './AlbumCard.jsx';
import ArtistCard from './ArtistCard.jsx';

const CATEGORIES = ['All', 'Relax', 'Workout', 'Focus', 'Trending', 'Party'];

export default function HomeView({
  topResult,
  songs = [],
  albums = [],
  artists = [],
  activeSongId,
  isPlaying,
  onPlaySong,
  onSelectAlbum,
  onSelectArtist,
  onToggleLike,
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <ScrollView
      className="flex-1 bg-[#0e0e0e]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* ── Category Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3 border-b border-white/5"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(cat)}
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
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="px-4 pt-4">
        {/* ── Top Result Hero ── */}
        {topResult ? (
          <TopResultHero
            entity={topResult}
            onPlay={() => onPlaySong?.(topResult)}
            onPress={() => {
              if (topResult.type === 'album') onSelectAlbum?.(topResult);
              else if (topResult.type === 'artist') onSelectArtist?.(topResult);
              else onPlaySong?.(topResult);
            }}
          />
        ) : null}

        {/* ── Featured / Trending Songs Shelf ── */}
        {songs.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-white tracking-tight">
                Quick Picks & Top Songs
              </Text>
              <Text className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                Play All
              </Text>
            </View>

            {songs.slice(0, 10).map((song, idx) => (
              <SongRow
                key={song.id || song.videoId || idx}
                song={song}
                index={idx}
                isActive={activeSongId === (song.id || song.videoId)}
                isPlaying={isPlaying}
                onPlay={() => onPlaySong?.(song)}
                onToggleLike={() => onToggleLike?.(song)}
              />
            ))}
          </View>
        )}

        {/* ── Albums Shelf ── */}
        {albums.length > 0 && (
          <View className="mb-6">
            <Text className="text-base font-bold text-white tracking-tight mb-3">
              Albums & Singles
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {albums.map((album, idx) => (
                <AlbumCard
                  key={album.id || album.browseId || idx}
                  item={album}
                  onPress={() => onSelectAlbum?.(album)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Artists Shelf ── */}
        {artists.length > 0 && (
          <View className="mb-6">
            <Text className="text-base font-bold text-white tracking-tight mb-3">
              Featured Artists
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {artists.map((artist, idx) => (
                <ArtistCard
                  key={artist.id || artist.browseId || idx}
                  item={artist}
                  onPress={() => onSelectArtist?.(artist)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
