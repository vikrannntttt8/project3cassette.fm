import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import TopResultHero from './TopResultHero.jsx';
import SongRow from './SongRow.jsx';
import AlbumCard from './AlbumCard.jsx';
import ArtistCard from './ArtistCard.jsx';
import { Sparkles, Radio, Disc, Mic2, Flame } from 'lucide-react-native';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'picks', label: 'Quick Picks' },
  { id: 'mixes', label: 'Daily Mixes' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
];

function CategoryChip({ cat, isSelected, onPress }) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 14, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => onPress(cat.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chipButton,
          isSelected ? styles.chipButtonActive : styles.chipButtonInactive,
        ]}
      >
        <Text
          style={[
            styles.chipText,
            isSelected ? styles.chipTextActive : styles.chipTextInactive,
          ]}
        >
          {cat.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

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
  activeCategory,
  onSelectCategory,
}) {
  const [selectedCategory, setSelectedCategory] = useState(activeCategory || 'all');
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (activeCategory) {
      setSelectedCategory(activeCategory);
    }
  }, [activeCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const handleCategoryPress = (catId) => {
    setSelectedCategory(catId);
    onSelectCategory?.(catId);
  };

  const filteredSongs = useMemo(() => {
    return songs;
  }, [songs]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
          colors={['#FFFFFF']}
          progressBackgroundColor="#18181a"
        />
      }
    >
      {/* ── Greeting ── */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{getGreeting()}</Text>
      </View>

      {/* ── Category Filter Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.id}
            cat={cat}
            isSelected={selectedCategory === cat.id}
            onPress={handleCategoryPress}
          />
        ))}
      </ScrollView>

      <View style={styles.mainFeed}>
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
          <View style={styles.shelf}>
            <View style={styles.shelfHeader}>
              <View style={styles.shelfTitleRow}>
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.shelfTitle}>Quick Picks & Top Songs</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onPlaySong?.(filteredSongs[0])}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.shelfAction}>Play All</Text>
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
          <View style={styles.shelf}>
            <View style={styles.shelfHeader}>
              <View style={styles.shelfTitleRow}>
                <Radio size={16} color="#FFFFFF" />
                <Text style={styles.shelfTitle}>Daily Mixes & Radio</Text>
              </View>
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
          <View style={styles.shelf}>
            <View style={styles.shelfHeader}>
              <View style={styles.shelfTitleRow}>
                <Disc size={16} color="#FFFFFF" />
                <Text style={styles.shelfTitle}>Albums & Singles</Text>
              </View>
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

        {/* ── Dynamic Curated Sections ── */}
        {selectedCategory === 'all' &&
          dynamicSections.map((sec) => (
            <View key={sec.id} style={styles.shelf}>
              <View style={styles.shelfHeader}>
                <View style={styles.shelfTitleRow}>
                  <Flame size={16} color="#FFFFFF" />
                  <Text style={styles.shelfTitle}>{sec.title}</Text>
                </View>
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

        {/* ── Featured Artists Shelf ── */}
        {(selectedCategory === 'all' || selectedCategory === 'artists') && artists.length > 0 && (
          <View style={styles.shelf}>
            <View style={styles.shelfHeader}>
              <View style={styles.shelfTitleRow}>
                <Mic2 size={16} color="#FFFFFF" />
                <Text style={styles.shelfTitle}>Featured Artists</Text>
              </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  contentContainer: {
    paddingBottom: 130,
  },
  greetingContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  chipButtonInactive: {
    backgroundColor: '#18181a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000000',
  },
  chipTextInactive: {
    color: '#a1a1aa',
  },
  mainFeed: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  shelf: {
    marginBottom: 26,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  shelfTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  shelfAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
  },
});
