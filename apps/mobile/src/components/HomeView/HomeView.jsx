import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import TopResultHero from './TopResultHero.jsx';
import SongRow from './SongRow.jsx';
import AlbumCard from './AlbumCard.jsx';
import ArtistCard from './ArtistCard.jsx';
import { Sparkles, Radio, Disc, Mic2, Flame } from 'lucide-react-native';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'picks', label: 'Quick Picks' },
  { id: 'mixes', label: 'Daily Mixes' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
];

export default function HomeView({
  topResult,
  songs = [],
  albums = [],
  artists = [],
  dailyMixes = [],
  dynamicSections = [],
  activeSongId,
  isPlaying,
  onPlaySong,
  onSelectAlbum,
  onSelectArtist,
  onSelectMix,
  onToggleLike,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredSongs = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory === 'picks') return songs;
    return songs;
  }, [songs, selectedCategory]);

  return (
    <ScrollView
      className="flex-1 bg-[#0e0e0e]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* ── Category Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3 border-b border-white/5"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(cat.id)}
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
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="px-4 pt-4">
        {/* ── Top Result Hero ── */}
        {(selectedCategory === 'all' || selectedCategory === 'picks') && topResult ? (
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

        {/* ── Quick Picks & Top Songs Shelf ── */}
        {(selectedCategory === 'all' || selectedCategory === 'picks') && filteredSongs.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Sparkles size={16} color="#FFFFFF" />
                <Text className="text-base font-bold text-white tracking-tight">
                  Quick Picks & Top Songs
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onPlaySong?.(filteredSongs[0])}
              >
                <Text className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Play All
                </Text>
              </TouchableOpacity>
            </View>

            {filteredSongs.slice(0, 10).map((song, idx) => (
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

        {/* ── Daily Mixes Shelf ── */}
        {(selectedCategory === 'all' || selectedCategory === 'mixes') && dailyMixes.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Radio size={16} color="#FFFFFF" />
              <Text className="text-base font-bold text-white tracking-tight">
                Daily Mixes & Radio
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dailyMixes.map((mix, idx) => (
                <AlbumCard
                  key={mix.id || idx}
                  item={mix}
                  onPress={() => onSelectMix?.(mix)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Albums Shelf ── */}
        {(selectedCategory === 'all' || selectedCategory === 'albums') && albums.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Disc size={16} color="#FFFFFF" />
              <Text className="text-base font-bold text-white tracking-tight">
                Albums & Singles
              </Text>
            </View>
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

        {/* ── Dynamic Curated Sections (Feel Good, Classics) ── */}
        {(selectedCategory === 'all') && dynamicSections.map((sec) => (
          <View key={sec.id} className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Flame size={16} color="#FFFFFF" />
              <Text className="text-base font-bold text-white tracking-tight">
                {sec.title}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sec.items.map((item, idx) => (
                <AlbumCard
                  key={item.id || idx}
                  item={item}
                  onPress={() => onPlaySong?.(item)}
                />
              ))}
            </ScrollView>
          </View>
        ))}

        {/* ── Artists Shelf ── */}
        {(selectedCategory === 'all' || selectedCategory === 'artists') && artists.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Mic2 size={16} color="#FFFFFF" />
              <Text className="text-base font-bold text-white tracking-tight">
                Featured Artists
              </Text>
            </View>
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
