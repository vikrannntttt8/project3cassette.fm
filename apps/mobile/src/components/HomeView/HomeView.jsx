import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Clock,
  Zap,
  Radio,
  Disc,
  Play,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QuickPicksGrid from './QuickPicksGrid.jsx';
import SongRow from './SongRow.jsx';
import AlbumCard from './AlbumCard.jsx';
import { youtubeMusicApiService } from '../../services/youtubeMusicApiService.js';
import { INITIAL_HOME_FEED } from '../../data/fallbackFeed.js';
import { colors, typography } from '../../theme/tokens.js';

const CATEGORY_STORAGE_KEY = 'pulse_home_category';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'picks', label: 'Quick Picks' },
  { id: 'mixes', label: 'Mixes' },
  { id: 'albums', label: 'Albums' },
];

export default function HomeView({
  activeSongId,
  isPlaying,
  likedSongs = [],
  onPlaySong,
  onPlayAll,
  onSelectAlbum,
  onSelectMix,
  onToggleLike,
  onOpenSettings,
  onMorePress,
  onArtistPress,
}) {
  // PRD HOME-02: Selection persists across launches. Default is All.
  const [activeCategory, setActiveCategory] = useState('all');
  // PRD HOME-01: Render the last cached response from MMKV/storage first (stale-while-revalidate)
  const [feedData, setFeedData] = useState(INITIAL_HOME_FEED);
  const [refreshing, setRefreshing] = useState(false);

  // Restore persisted category
  useEffect(() => {
    AsyncStorage.getItem(CATEGORY_STORAGE_KEY).then((saved) => {
      if (saved && CATEGORIES.some((c) => c.id === saved)) {
        setActiveCategory(saved);
      }
    }).catch(() => {});
  }, []);

  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    AsyncStorage.setItem(CATEGORY_STORAGE_KEY, catId).catch(() => {});
  };

  // Load cached feed instantly, then revalidate in background
  const loadLiveFeed = useCallback(async () => {
    try {
      // 1. Instant local read-through
      const cached = await youtubeMusicApiService.getCachedHomeFeed();
      if (cached?.quickPicks?.length) {
        setFeedData((prev) => ({ ...prev, ...cached }));
      }

      // 2. Fetch fresh feed from YouTube Music API pipeline
      const fresh = await youtubeMusicApiService.fetchLiveHomeFeed();
      if (fresh?.quickPicks?.length) {
        setFeedData(fresh);
      }
    } catch (err) {
      console.warn('[HomeView] Load feed notice:', err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLiveFeed();
  }, [loadLiveFeed]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLiveFeed();
  };

  const isSongLiked = (song) => {
    if (!song) return false;
    const targetId = song.id || song.videoId;
    return likedSongs.some((s) => (s.id || s.videoId) === targetId);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor="#000000"
        />
      }
    >
      {/* ── Category Filter Chips Pinned Under Top Bar (PRD HOME-02) ── */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => handleSelectCategory(cat.id)}
                style={[
                  styles.chipPill,
                  isSelected ? styles.chipPillActive : styles.chipPillInactive,
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
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.feedContent}>
        {/* ── 1. Quick Picks Section (PRD HOME-04: 4 rows tall, horizontally paged) ── */}
        {(activeCategory === 'all' || activeCategory === 'picks') &&
          feedData.quickPicks?.length > 0 && (
            <View style={styles.sectionContainerFull}>
              <View style={styles.sectionHeaderBetween}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.sectionIconBadge}>
                    <Zap size={15} color={colors.accent} strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Quick Picks</Text>
                    <Text style={styles.sectionSubtitle}>
                      Start instant radio with live YouTube Music
                    </Text>
                  </View>
                </View>

                {/* Play All Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onPlayAll?.(feedData.quickPicks)}
                  style={styles.playAllButton}
                >
                  <Play size={11} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.playAllText}>Play All</Text>
                </TouchableOpacity>
              </View>

              {/* 4 rows tall, horizontally paged matrix */}
              <QuickPicksGrid
                tracks={feedData.quickPicks}
                activeSongId={activeSongId}
                isPlaying={isPlaying}
                likedSongs={likedSongs}
                onPlayTrack={onPlaySong}
                onMorePress={onMorePress}
                onArtistPress={onArtistPress}
                onToggleLike={onToggleLike}
              />
            </View>
          )}

        {/* ── 2. Listen Again / Jump Back In ── */}
        {(activeCategory === 'all' || activeCategory === 'picks') &&
          feedData.listenAgain?.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBadge}>
                  <Clock size={15} color={colors.textPrimary} strokeWidth={2.4} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Listen Again</Text>
                  <Text style={styles.sectionSubtitle}>
                    Jump back into your recent tracks
                  </Text>
                </View>
              </View>

              <View style={styles.tracksList}>
                {feedData.listenAgain.slice(0, 5).map((song, idx) => (
                  <SongRow
                    key={`${song.id || song.videoId || 'la'}-${idx}`}
                    song={song}
                    index={idx}
                    isActive={(song.id || song.videoId) === activeSongId}
                    isPlaying={isPlaying}
                    isLiked={isSongLiked(song)}
                    onPlay={() => onPlaySong?.(song, feedData.listenAgain)}
                    onToggleLike={() => onToggleLike?.(song)}
                    onMorePress={onMorePress}
                    onArtistPress={onArtistPress}
                  />
                ))}
              </View>
            </View>
          )}

        {/* ── 3. Daily Mixes & Radio (PRD HOME-05: 148 dp wide cards) ── */}
        {(activeCategory === 'all' || activeCategory === 'mixes') &&
          feedData.dailyMixes?.length > 0 && (
            <View style={styles.sectionContainerFull}>
              <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
                <View style={styles.sectionIconBadge}>
                  <Radio size={15} color={colors.accent} strokeWidth={2.4} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Daily Mixes & Radio</Text>
                  <Text style={styles.sectionSubtitle}>
                    Non-stop curated radio stations
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCardsScroll}
              >
                {feedData.dailyMixes.map((mix, idx) => (
                  <AlbumCard
                    key={mix.id || `dm-${idx}`}
                    item={mix}
                    onPress={() => onSelectMix?.(mix)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

        {/* ── 4. Trending Albums (PRD HOME-05: 148 dp wide cards, two-line title) ── */}
        {(activeCategory === 'all' || activeCategory === 'albums') &&
          feedData.trendingAlbums?.length > 0 && (
            <View style={styles.sectionContainerFull}>
              <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
                <View style={styles.sectionIconBadge}>
                  <Disc size={15} color={colors.textPrimary} strokeWidth={2.4} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Trending Albums</Text>
                  <Text style={styles.sectionSubtitle}>
                    Top chart-topping albums on YouTube Music
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCardsScroll}
              >
                {feedData.trendingAlbums.map((album, idx) => (
                  <AlbumCard
                    key={album.id || `ta-${idx}`}
                    item={album}
                    onPress={() => onSelectAlbum?.(album)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

        {/* ── 5. Throwbacks / Deep Cuts ── */}
        {(activeCategory === 'all' || activeCategory === 'mixes') &&
          feedData.throwbacks?.length > 0 && (
            <View style={styles.sectionContainerFull}>
              <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
                <View style={styles.sectionIconBadge}>
                  <Sparkles size={15} color={colors.accent} strokeWidth={2.4} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Essential Throwbacks</Text>
                  <Text style={styles.sectionSubtitle}>
                    Timeless classics & essential albums
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCardsScroll}
              >
                {feedData.throwbacks.map((tb, idx) => (
                  <AlbumCard
                    key={tb.id || `tb-${idx}`}
                    item={tb}
                    onPress={() => onSelectMix?.(tb)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

        {/* ── 6. Audio Fidelity Engine Banner ── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenSettings}
          style={styles.fidelityBanner}
        >
          <View style={styles.fidelityLeft}>
            <Sparkles size={16} color={colors.accent} />
            <Text style={styles.fidelityText}>
              Fidelity Engine: Streaming high-bitrate Opus 251 audio
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  chipsWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  chipPillActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  chipPillInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter',
    includeFontPadding: false,
    paddingRight: 4,
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  chipTextInactive: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  feedContent: {
    paddingTop: 16,
    gap: 28,
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  sectionContainerFull: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: colors.textSecondary,
    marginTop: 1,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playAllText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  tracksList: {
    gap: 4,
  },
  horizontalCardsScroll: {
    gap: 12,
    paddingHorizontal: 16,
  },
  fidelityBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fidelityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fidelityText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    flex: 1,
  },
});
