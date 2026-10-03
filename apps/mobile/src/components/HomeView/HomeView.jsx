import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Clock,
  Zap,
  Radio,
  Disc,
  Sliders,
  Sparkles,
  ChevronRight,
  Play,
} from 'lucide-react-native';
import SongRow from './SongRow.jsx';
import AlbumCard from './AlbumCard.jsx';
import { youtubeMusicApiService } from '../../services/youtubeMusicApiService.js';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: null },
  { id: 'picks', label: 'Quick Picks', icon: Zap },
  { id: 'mixes', label: 'Mixes', icon: Radio },
  { id: 'albums', label: 'Albums', icon: Disc },
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
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [feedData, setFeedData] = useState({
    listenAgain: [],
    quickPicks: [],
    dailyMixes: [],
    trendingAlbums: [],
    throwbacks: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load live feed from YouTube Music API pipeline and persistent user history
  const loadLiveFeed = useCallback(async () => {
    try {
      const data = await youtubeMusicApiService.fetchLiveHomeFeed();
      setFeedData(data);
    } catch (err) {
      console.warn('[HomeView] Load feed error:', err);
    } finally {
      setLoading(false);
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
          tintColor="#10b981"
          colors={['#10b981']}
          progressBackgroundColor="#18181a"
        />
      }
    >
      {/* ── Category Filter Chips (Pill Navbar) ── */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.chipPill,
                  isSelected ? styles.chipPillActive : styles.chipPillInactive,
                ]}
              >
                {Icon && (
                  <Icon
                    size={14}
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
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Fetching live YouTube Music feed…</Text>
        </View>
      ) : (
        <View style={styles.feedContent}>
          {/* ── 1. Listen Again Section ── */}
          {(activeCategory === 'all' || activeCategory === 'picks') &&
            feedData.listenAgain.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBadge}>
                    <Clock size={16} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Listen Again</Text>
                    <Text style={styles.sectionSubtitle}>
                      Jump back into your recent tracks
                    </Text>
                  </View>
                </View>

                <View style={styles.tracksList}>
                  {feedData.listenAgain.slice(0, 6).map((song, idx) => (
                    <SongRow
                      key={song.id || song.videoId || `la-${idx}`}
                      song={song}
                      index={idx}
                      isActive={
                        (song.id || song.videoId) === activeSongId
                      }
                      isPlaying={isPlaying}
                      isLiked={isSongLiked(song)}
                      onPlay={() => onPlaySong?.(song, feedData.listenAgain)}
                      onToggleLike={() => onToggleLike?.(song)}
                    />
                  ))}
                </View>
              </View>
            )}

          {/* ── 2. Quick Picks Section ── */}
          {(activeCategory === 'all' || activeCategory === 'picks') &&
            feedData.quickPicks.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderBetween}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={styles.sectionIconBadge}>
                      <Zap size={16} color="#FFFFFF" strokeWidth={2.4} />
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

                <View style={styles.tracksList}>
                  {feedData.quickPicks.slice(0, 5).map((song, idx) => (
                    <SongRow
                      key={song.id || song.videoId || `qp-${idx}`}
                      song={song}
                      index={idx}
                      isActive={
                        (song.id || song.videoId) === activeSongId
                      }
                      isPlaying={isPlaying}
                      isLiked={isSongLiked(song)}
                      onPlay={() => onPlaySong?.(song, feedData.quickPicks)}
                      onToggleLike={() => onToggleLike?.(song)}
                    />
                  ))}
                </View>
              </View>
            )}

          {/* ── 3. Daily Mixes & Radio ── */}
          {(activeCategory === 'all' || activeCategory === 'mixes') &&
            feedData.dailyMixes.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBadge}>
                    <Radio size={16} color="#FFFFFF" strokeWidth={2.4} />
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

          {/* ── 4. Trending Albums ── */}
          {(activeCategory === 'all' || activeCategory === 'albums') &&
            feedData.trendingAlbums.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBadge}>
                    <Disc size={16} color="#FFFFFF" strokeWidth={2.4} />
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

          {/* ── 5. Throwbacks ── */}
          {(activeCategory === 'all' || activeCategory === 'mixes') &&
            feedData.throwbacks.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBadge}>
                    <Sliders size={16} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Throwbacks</Text>
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

          {/* ── 6. Fidelity Engine Banner ── */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenSettings}
            style={styles.fidelityBanner}
          >
            <View style={styles.fidelityLeft}>
              <Sparkles size={16} color="#a1a1aa" />
              <Text style={styles.fidelityText}>
                Fidelity Engine: All tracks stream in high-bitrate OPUS
              </Text>
            </View>
            <ChevronRight size={16} color="#71717a" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  contentContainer: {
    paddingBottom: 110,
  },
  chipsWrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  chipTextInactive: {
    color: '#D4D4D8',
  },
  loaderContainer: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
  },
  feedContent: {
    paddingTop: 16,
    gap: 28,
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    backgroundColor: '#18181a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 1,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#18181a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tracksList: {
    gap: 2,
  },
  horizontalCardsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  fidelityBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#131316',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
