import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Clock, Play, ArrowUpLeft, Music } from 'lucide-react-native';
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Search Bar Header */}
      <View style={styles.searchHeader}>
        <View style={styles.inputWrapper}>
          <Search size={18} color="#737373" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search songs, artists, albums..."
            placeholderTextColor="#737373"
            returnKeyType="search"
            autoFocus
            style={styles.textInput}
          />
          {query.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setQuery('')}
              style={styles.clearButton}
            >
              <X size={16} color="#737373" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs when query is active */}
      {trimmed.length > 0 && (
        <View style={styles.tabsRow}>
          {SEARCH_TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.7}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabChip,
                  isTabActive ? styles.tabChipActive : styles.tabChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    isTabActive ? styles.tabChipTextActive : styles.tabChipTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
        {/* Results */}
        {trimmed.length > 0 && hasResults && (
          <View style={styles.resultsContainer}>
            {/* Top Match Hero */}
            {searchResults.songs.length > 0 && (activeTab === 'all' || activeTab === 'songs') && (
              <View style={styles.shelf}>
                <Text style={styles.sectionLabel}>Top Result</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onPlaySong?.(searchResults.songs[0])}
                  style={styles.topResultCard}
                >
                  <Image
                    source={{ uri: searchResults.songs[0].thumbnail || searchResults.songs[0].cover }}
                    style={styles.topResultThumb}
                  />
                  <View style={styles.topResultDetails}>
                    <Text numberOfLines={1} style={styles.topResultTitle}>
                      {searchResults.songs[0].title}
                    </Text>
                    <Text numberOfLines={1} style={styles.topResultSubtitle}>
                      Song • {searchResults.songs[0].artist}
                    </Text>
                    <View style={styles.hitBadge}>
                      <Text style={styles.hitBadgeText}>HIT TRACK</Text>
                    </View>
                  </View>
                  <View style={styles.playIconCircle}>
                    <Play size={18} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Songs Results */}
            {(activeTab === 'all' || activeTab === 'songs') && searchResults.songs.length > 0 && (
              <View style={styles.shelf}>
                <Text style={styles.shelfTitle}>Songs</Text>
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

            {/* Albums Results */}
            {(activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
              <View style={styles.shelf}>
                <Text style={styles.shelfTitle}>Albums</Text>
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

            {/* Artists Results */}
            {(activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
              <View style={styles.shelf}>
                <Text style={styles.shelfTitle}>Artists</Text>
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

        {/* No results */}
        {trimmed.length > 0 && !hasResults && (
          <View style={styles.emptyState}>
            <Music size={40} color="#525252" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No results for "{query}"</Text>
            <Text style={styles.emptySubtitle}>
              Check spelling or search for popular artists like The Weeknd, Queen, or Ed Sheeran.
            </Text>
          </View>
        )}

        {/* Suggestions & Recent Searches */}
        {trimmed.length === 0 && (
          <View style={styles.defaultSearchContainer}>
            {recentSearches.length > 0 && (
              <View style={styles.shelf}>
                <Text style={styles.sectionLabel}>Recent Searches</Text>
                {recentSearches.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => handleSelectQuery(item)}
                    style={styles.suggestionRow}
                  >
                    <View style={styles.suggestionLeft}>
                      <Clock size={16} color="#737373" />
                      <Text numberOfLines={1} style={styles.suggestionText}>
                        {item}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.shelf}>
              <Text style={styles.sectionLabel}>Trending Searches</Text>
              {['Blinding Lights', 'Bohemian Rhapsody', 'Demon Days', 'Feel Good Inc', 'Shape of You'].map(
                (item, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => handleSelectQuery(item)}
                    style={styles.suggestionRow}
                  >
                    <View style={styles.suggestionLeft}>
                      <Search size={16} color="#737373" />
                      <Text numberOfLines={1} style={styles.suggestionTextTrending}>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181a',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a3a3a3',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  tabChipInactive: {
    backgroundColor: '#18181a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: '#000000',
  },
  tabChipTextInactive: {
    color: '#a3a3a3',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsContainer: {
    paddingTop: 12,
    paddingBottom: 80,
  },
  shelf: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#737373',
    marginBottom: 8,
  },
  shelfTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  topResultCard: {
    backgroundColor: '#18181a',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  topResultThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#262626',
  },
  topResultDetails: {
    flex: 1,
    minWidth: 0,
  },
  topResultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  topResultSubtitle: {
    fontSize: 12,
    color: '#a3a3a3',
    marginBottom: 8,
  },
  hitBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  hitBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#d4d4d4',
  },
  playIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 18,
  },
  defaultSearchContainer: {
    paddingVertical: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d4d4d4',
    flex: 1,
  },
  suggestionTextTrending: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
});
