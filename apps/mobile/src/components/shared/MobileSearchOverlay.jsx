import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Globe,
  Music,
  Video,
  Disc,
  User,
  Mic,
  ListMusic,
  FolderHeart,
} from 'lucide-react-native';
import SongRow from '../HomeView/SongRow.jsx';
import AlbumCard from '../HomeView/AlbumCard.jsx';
import { youtubeMusicApiService } from '../../services/youtubeMusicApiService.js';

const EXPLORE_CHIPS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'songs', label: 'Songs', icon: Music },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'albums', label: 'Albums', icon: Disc },
  { id: 'artists', label: 'Artists', icon: User },
  { id: 'podcasts', label: 'Podcasts', icon: Mic },
  { id: 'community', label: 'Community Playlists', icon: ListMusic },
  { id: 'featured', label: 'Featured Playlists', icon: FolderHeart },
];

export default function MobileSearchOverlay({
  isOpen,
  onClose,
  activeSongId,
  isPlaying,
  likedSongs = [],
  onPlaySong,
  onSelectAlbum,
  onToggleLike,
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const [suggs, searchRes] = await Promise.all([
          youtubeMusicApiService.getSuggestions(query),
          youtubeMusicApiService.search(query, activeTab),
        ]);
        setSuggestions(suggs);
        setResults(searchRes);
      } catch (e) {
        console.warn('[Search] Query error:', e);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, activeTab]);

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setResults([]);
    onClose?.();
  };

  const isSongLiked = (song) => {
    if (!song) return false;
    const targetId = song.id || song.videoId;
    return likedSongs.some((s) => (s.id || s.videoId) === targetId);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ── Search Bar Header matching Pages 2, 3, 4 ── */}
        <View style={styles.headerBar}>
          <View style={styles.inputContainer}>
            <Search size={18} color="#71717a" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search songs, artists, albums..."
              placeholderTextColor="#71717a"
              style={styles.textInput}
              autoFocus
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClear}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* ── Horizontal Filter Chips matching Pages 2, 3, 4 ── */}
        <View style={styles.chipsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {EXPLORE_CHIPS.map((chip) => {
              const isSelected = activeTab === chip.id;
              const Icon = chip.icon;
              return (
                <TouchableOpacity
                  key={chip.id}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(chip.id)}
                  style={[
                    styles.chipPill,
                    isSelected ? styles.chipPillActive : styles.chipPillInactive,
                  ]}
                >
                  {Icon && (
                    <Icon
                      size={13}
                      color={isSelected ? '#000000' : '#D4D4D8'}
                      strokeWidth={2.4}
                      style={{ marginRight: 5 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Content Area: Empty State vs Live Results ── */}
        <ScrollView
          style={styles.resultsScroll}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingText}>Searching YouTube Music…</Text>
            </View>
          )}

          {!query.trim() && !loading && (
            <View style={styles.emptyStateContainer}>
              <View style={styles.globeBadge}>
                <Globe size={32} color="#71717a" strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>Discover YouTube Music</Text>
              <Text style={styles.emptySubtitle}>
                Type a title, artist, or album name above
              </Text>
            </View>
          )}

          {query.trim() && results.length > 0 && (
            <View style={styles.resultsList}>
              {results.map((item, idx) => (
                <SongRow
                  key={item.id || item.videoId || `res-${idx}`}
                  song={item}
                  index={idx}
                  isActive={(item.id || item.videoId) === activeSongId}
                  isPlaying={isPlaying}
                  isLiked={isSongLiked(item)}
                  onPlay={() => {
                    onPlaySong?.(item, results);
                    onClose?.();
                  }}
                  onToggleLike={() => onToggleLike?.(item)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181a',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  chipsRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipPillActive: {
    backgroundColor: '#FFFFFF',
  },
  chipPillInactive: {
    backgroundColor: '#18181a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    fontSize: 12.5,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  chipTextInactive: {
    color: '#D4D4D8',
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: 12,
  },
  globeBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#71717a',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  resultsList: {
    gap: 4,
  },
});
