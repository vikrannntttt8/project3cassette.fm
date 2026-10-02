import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Clock, Play, ArrowUpLeft, Music, Disc, User } from 'lucide-react-native';
import SongRow from '../HomeView/SongRow.jsx';
import AlbumCard from '../HomeView/AlbumCard.jsx';
import ArtistCard from '../HomeView/ArtistCard.jsx';

const SEARCH_TABS = [
  { id: 'all', label: 'All' },
  { id: 'songs', label: 'Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
];

export default function MobileSearchOverlay({
  isOpen,
  onClose,
  catalogSongs = [],
  catalogAlbums = [],
  catalogArtists = [],
  activeSongId,
  isPlaying,
  onPlaySong,
  onSelectAlbum,
  onSelectArtist,
  onToggleLike,
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [recentSearches, setRecentSearches] = useState(['The Weeknd', 'Queen', 'Ed Sheeran', 'Gorillaz']);

  const trimmed = query.trim().toLowerCase();

  // Filter items matching query
  const searchResults = useMemo(() => {
    if (!trimmed) {
      return { songs: [], albums: [], artists: [] };
    }

    const filteredSongs = catalogSongs.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(trimmed)) ||
        (s.artist && s.artist.toLowerCase().includes(trimmed))
    );

    const filteredAlbums = catalogAlbums.filter(
      (a) =>
        (a.title && a.title.toLowerCase().includes(trimmed)) ||
        (a.artist && a.artist.toLowerCase().includes(trimmed))
    );

    const filteredArtists = catalogArtists.filter(
      (ar) =>
        (ar.name && ar.name.toLowerCase().includes(trimmed)) ||
        (ar.title && ar.title.toLowerCase().includes(trimmed))
    );

    return {
      songs: filteredSongs,
      albums: filteredAlbums,
      artists: filteredArtists,
    };
  }, [trimmed, catalogSongs, catalogAlbums, catalogArtists]);

  // Suggestions for autocomplete
  const suggestions = useMemo(() => {
    if (!trimmed || trimmed.length < 2) return [];
    const pool = [
      ...catalogSongs.map((s) => s.title),
      ...catalogSongs.map((s) => s.artist),
      ...catalogAlbums.map((a) => a.title),
      ...catalogArtists.map((ar) => ar.name || ar.title),
    ].filter(Boolean);

    const unique = [...new Set(pool)];
    return unique.filter((item) => item.toLowerCase().includes(trimmed)).slice(0, 5);
  }, [trimmed, catalogSongs, catalogAlbums, catalogArtists]);

  if (!isOpen) return null;

  const handleSelectQuery = (text) => {
    setQuery(text);
    if (!recentSearches.includes(text)) {
      setRecentSearches([text, ...recentSearches.slice(0, 4)]);
    }
  };

  const hasResults =
    searchResults.songs.length > 0 ||
    searchResults.albums.length > 0 ||
    searchResults.artists.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#0e0e0e]" edges={['top', 'bottom']}>
      {/* Search Bar Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-white/5">
        <View className="flex-1 flex-row items-center bg-[#161616] rounded-2xl px-3.5 py-2 border border-white/10">
          <Search size={18} color="#737373" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search songs, artists, albums..."
            placeholderTextColor="#737373"
            returnKeyType="search"
            autoFocus
            className="flex-1 text-sm text-white font-medium ml-2 p-0"
          />
          {query.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setQuery('')}
              className="p-1"
            >
              <X size={16} color="#737373" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          className="py-2 px-1"
        >
          <Text className="text-sm font-semibold text-neutral-400">Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs when query exists */}
      {trimmed.length > 0 && (
        <View className="flex-row px-4 py-2 border-b border-white/5 gap-2">
          {SEARCH_TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.7}
                onPress={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full border ${
                  isTabActive
                    ? 'bg-white border-white'
                    : 'bg-[#161616] border-white/10'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isTabActive ? 'text-black' : 'text-neutral-400'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView className="flex-1 px-4 py-2" keyboardShouldPersistTaps="handled">
        {/* State 1: Active query with results */}
        {trimmed.length > 0 && hasResults && (
          <View className="pt-2 pb-24">
            {/* Top Match Hero */}
            {searchResults.songs.length > 0 && (activeTab === 'all' || activeTab === 'songs') && (
              <View className="mb-6">
                <Text className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                  Top Result
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onPlaySong?.(searchResults.songs[0])}
                  className="bg-[#18181a] p-4 rounded-2xl border border-white/10 flex-row items-center gap-4 shadow-xl"
                >
                  <Image
                    source={{ uri: searchResults.songs[0].thumbnail || searchResults.songs[0].cover }}
                    className="w-16 h-16 rounded-xl bg-[#262626]"
                  />
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="text-base font-bold text-white mb-0.5">
                      {searchResults.songs[0].title}
                    </Text>
                    <Text numberOfLines={1} className="text-xs text-neutral-400 mb-2">
                      Song • {searchResults.songs[0].artist}
                    </Text>
                    <View className="self-start px-2 py-0.5 rounded-md bg-white/10">
                      <Text className="text-[10px] font-mono text-neutral-300 uppercase">Hit Track</Text>
                    </View>
                  </View>
                  <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                    <Play size={18} color="#000000" fill="#000000" />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Songs Result Shelf */}
            {(activeTab === 'all' || activeTab === 'songs') && searchResults.songs.length > 0 && (
              <View className="mb-6">
                <Text className="text-base font-bold text-white tracking-tight mb-3">Songs</Text>
                {searchResults.songs.map((song, idx) => (
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
            )}

            {/* Albums Result Shelf */}
            {(activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
              <View className="mb-6">
                <Text className="text-base font-bold text-white tracking-tight mb-3">Albums</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {searchResults.albums.map((album, idx) => (
                    <AlbumCard
                      key={album.id || idx}
                      item={album}
                      onPress={() => onSelectAlbum?.(album)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Artists Result Shelf */}
            {(activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
              <View className="mb-6">
                <Text className="text-base font-bold text-white tracking-tight mb-3">Artists</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {searchResults.artists.map((artist, idx) => (
                    <ArtistCard
                      key={artist.id || idx}
                      item={artist}
                      onPress={() => onSelectArtist?.(artist)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* State 2: Active query but no results found */}
        {trimmed.length > 0 && !hasResults && (
          <View className="items-center justify-center py-16">
            <Music size={40} color="#525252" className="mb-3" />
            <Text className="text-base font-bold text-white mb-1">No results for "{query}"</Text>
            <Text className="text-xs text-neutral-400 text-center px-8">
              Check spelling or search for popular artists like The Weeknd, Queen, or Ed Sheeran.
            </Text>
          </View>
        )}

        {/* State 3: Empty query - Suggestions & Recent Searches */}
        {trimmed.length === 0 && (
          <View className="py-2">
            {recentSearches.length > 0 && (
              <View className="mb-6">
                <Text className="text-xs font-mono uppercase tracking-widest text-neutral-500 py-2">
                  Recent Searches
                </Text>
                {recentSearches.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => handleSelectQuery(item)}
                    className="flex-row items-center justify-between py-3 border-b border-white/5"
                  >
                    <View className="flex-row items-center gap-3 flex-1 min-w-0">
                      <Clock size={16} color="#737373" />
                      <Text numberOfLines={1} className="text-sm font-medium text-neutral-300 flex-1">
                        {item}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View className="mb-6">
              <Text className="text-xs font-mono uppercase tracking-widest text-neutral-500 py-2">
                Trending Searches
              </Text>
              {['Blinding Lights', 'Bohemian Rhapsody', 'Demon Days', 'Feel Good Inc', 'Shape of You'].map(
                (item, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => handleSelectQuery(item)}
                    className="flex-row items-center justify-between py-3 border-b border-white/5"
                  >
                    <View className="flex-row items-center gap-3 flex-1 min-w-0">
                      <Search size={16} color="#737373" />
                      <Text numberOfLines={1} className="text-sm font-medium text-white flex-1">
                        {item}
                      </Text>
                    </View>
                    <ArrowUpLeft size={16} color="#525252" />
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
