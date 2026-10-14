import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Clock,
  Shuffle,
  Search,
  Trash2,
  MoreVertical,
  Play,
  Cloud,
  HardDrive,
  UserCheck,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/NativeContextProviders.jsx';
import { youtubeMusicApiService } from '../../services/youtubeMusicApiService.js';
import { googleAuthSyncService } from '../../services/googleAuthSyncService.js';
import AnimatedEqualizer from '../shared/AnimatedEqualizer.jsx';
import { normalize } from '@cassette/core';

const HISTORY_STORAGE_KEY = 'pulse_playback_history';

/**
 * Format timestamp into calendar section headers (PRD HIS-02):
 * Today, Yesterday, Weekday, Month Year
 */
function getHistorySectionHeader(dateString) {
  if (!dateString) return 'Earlier';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Earlier';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDays = Math.round((today - itemDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function HistoryView({
  activeSongId,
  isPlaying,
  onPlaySong,
  onPlayAll,
  onToggleLike,
  onOpenTrackOptions,
  onOpenArtist,
  onOpenAuth,
}) {
  const { theme, themeStyle } = useTheme();
  const isOled = themeStyle === 'oled';

  const [activeSegment, setActiveSegment] = useState('local'); // 'local' | 'remote' (PRD HIS-04)
  const [historyList, setHistoryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(googleAuthSyncService.getUser());

  // Load history from AsyncStorage
  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistoryList(parsed);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadHistory();
    const unsub = googleAuthSyncService.subscribe((u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Filter history via search query (PRD HIS-10)
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return historyList;
    const q = normalize(searchQuery);
    return historyList.filter((item) => {
      const title = normalize(item.title || '');
      const artist = normalize(item.artist || item.artists?.[0]?.name || '');
      return title.includes(q) || artist.includes(q);
    });
  }, [historyList, searchQuery]);

  // Group by calendar day section headers (PRD HIS-02)
  const groupedSections = useMemo(() => {
    const groups = {};
    for (const item of filteredHistory) {
      const header = getHistorySectionHeader(item.playedAt);
      if (!groups[header]) groups[header] = [];
      groups[header].push(item);
    }
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filteredHistory]);

  // PRD HIS-07: Shuffle button samples up to 500 tracks, shuffles, and starts playback
  const handleShuffleHistory = () => {
    if (historyList.length === 0) return;
    const sample = [...historyList].slice(0, 500);
    // Fisher-Yates shuffle
    for (let i = sample.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sample[i], sample[j]] = [sample[j], sample[i]];
    }
    onPlayAll?.(sample);
  };

  // PRD HIS-08: Delete row from history
  const handleDeleteItem = async (targetId) => {
    const updated = await youtubeMusicApiService.deleteHistorySong(targetId);
    setHistoryList(updated);
  };

  // Clear all history with confirmation
  const handleClearHistory = () => {
    Alert.alert(
      'Clear Playback History',
      'Are you sure you want to clear your local playback history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await youtubeMusicApiService.clearAllHistory();
            setHistoryList([]);
          },
        },
      ]
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(150)} style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* ── Top Bar & Segmented Control ── */}
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>History</Text>

          <View style={styles.topActions}>
            {/* Shuffle History (PRD HIS-07) */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShuffleHistory}
              style={[
                styles.shuffleBtn,
                { backgroundColor: isOled ? '#121214' : '#1c1c20', borderColor: isOled ? '#242428' : 'rgba(255, 255, 255, 0.08)' },
              ]}
              accessibilityLabel="Shuffle history"
            >
              <Shuffle size={14} color="#FFFFFF" />
              <Text style={styles.shuffleText}>Shuffle</Text>
            </TouchableOpacity>

            {/* Clear All */}
            {historyList.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClearHistory}
                style={styles.iconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear history"
              >
                <Trash2 size={18} color="#71717A" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* PRD HIS-04: Segmented Control (Local vs Remote) */}
        <View style={[styles.segmentContainer, { backgroundColor: isOled ? '#121214' : '#18181b' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSegment('local')}
            style={[
              styles.segmentItem,
              activeSegment === 'local' && styles.segmentItemActive,
            ]}
          >
            <HardDrive size={13} color={activeSegment === 'local' ? '#FFFFFF' : '#71717A'} />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'local' && styles.segmentTextActive,
              ]}
            >
              Local ({historyList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSegment('remote')}
            style={[
              styles.segmentItem,
              activeSegment === 'remote' && styles.segmentItemActive,
            ]}
          >
            <Cloud size={13} color={activeSegment === 'remote' ? '#FFFFFF' : '#71717A'} />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'remote' && styles.segmentTextActive,
              ]}
            >
              Remote (YTM)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search within History (PRD HIS-10) */}
        {activeSegment === 'local' && historyList.length > 3 && (
          <View style={[styles.searchBox, { backgroundColor: isOled ? '#121214' : '#18181b' }]}>
            <Search size={15} color="#71717A" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search in history..."
              placeholderTextColor="#71717A"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearSearchText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── Content Body ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeSegment === 'remote' ? (
          /* Remote History Segment */
          <View style={styles.remoteContainer}>
            {user?.isConnected ? (
              <View style={styles.remoteConnectedBox}>
                <UserCheck size={32} color="#10b981" />
                <Text style={styles.remoteTitle}>YouTube Music Sync Active</Text>
                <Text style={styles.remoteSubtitle}>
                  Logged in as {user.name || user.email}. Recent tracks played here automatically sync with your Google account.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleShuffleHistory}
                  style={styles.primaryBtn}
                >
                  <Shuffle size={16} color="#000000" />
                  <Text style={styles.primaryBtnText}>Shuffle Cloud History</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.remoteEmptyBox}>
                <Cloud size={36} color="#71717A" />
                <Text style={styles.remoteTitle}>Connect YouTube Music</Text>
                <Text style={styles.remoteSubtitle}>
                  Link your account to stream directly from your personal history and mirror your playlist updates in real-time.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onOpenAuth}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Sign In / Link Account</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : filteredHistory.length === 0 ? (
          /* Empty Local History */
          <View style={styles.emptyContainer}>
            <Clock size={40} color="#3f3f46" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching tracks' : 'No history yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search term.'
                : 'Tracks you play for at least 30 seconds will show up here.'}
            </Text>
          </View>
        ) : (
          /* Grouped Chronological History List */
          groupedSections.map((section) => (
            <View key={section.title} style={styles.sectionBlock}>
              {/* Sticky Calendar Header (PRD HIS-02) */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>{section.data.length} tracks</Text>
              </View>

              {section.data.map((item, idx) => {
                const targetId = item.id || item.videoId;
                const isItemActive = activeSongId === targetId;
                const title = item.title || 'Untitled';
                const artist = item.artist || item.artists?.[0]?.name || 'Unknown Artist';
                const thumbnail = item.thumbnail || item.cover;

                return (
                  <View
                    key={`${targetId}-${idx}`}
                    style={[
                      styles.trackRow,
                      isItemActive && [
                        styles.trackRowActive,
                        {
                          backgroundColor: isOled ? '#121214' : '#1c1c20',
                          borderColor: isOled ? '#242428' : 'rgba(255, 255, 255, 0.08)',
                        },
                      ],
                    ]}
                  >
                    {/* Play Trigger */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onPlaySong?.(item, filteredHistory)}
                      style={styles.trackPressable}
                    >
                      <View style={styles.thumbnailWrapper}>
                        {thumbnail ? (
                          <Image
                            source={{ uri: thumbnail }}
                            style={styles.thumbnail}
                            contentFit="cover"
                            transition={150}
                          />
                        ) : (
                          <View style={styles.artPlaceholder}>
                            <Play size={14} color="#71717A" />
                          </View>
                        )}
                        {isItemActive && isPlaying && (
                          <View style={styles.playingBadge}>
                            <AnimatedEqualizer isPlaying={isPlaying} color="#FFFFFF" maxHeight={10} barWidth={2} />
                          </View>
                        )}
                      </View>

                      <View style={styles.trackDetails}>
                        <Text numberOfLines={1} style={[styles.trackTitle, isItemActive && styles.trackTitleActive]}>
                          {title}
                        </Text>
                        <TouchableOpacity
                          activeOpacity={0.6}
                          onPress={() => onOpenArtist?.(artist)}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <Text numberOfLines={1} style={styles.trackArtist}>
                            {artist}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Actions: Delete & Track Menu */}
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDeleteItem(targetId)}
                        style={styles.actionBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Delete from history"
                      >
                        <Trash2 size={16} color="#71717A" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => onOpenTrackOptions?.(item)}
                        style={styles.actionBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Track options"
                      >
                        <MoreVertical size={16} color="#71717A" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontFamily: 'Shrikhand',
    fontSize: 26,
    color: '#FFFFFF',
    includeFontPadding: false,
    paddingRight: 6,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  shuffleText: {
    fontSize: 12.5,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  iconBtn: {
    padding: 6,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentItemActive: {
    backgroundColor: '#27272a',
  },
  segmentText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#71717A',
    includeFontPadding: false,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#FFFFFF',
    padding: 0,
    includeFontPadding: false,
  },
  clearSearchText: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#A1A1AA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 16,
  },
  sectionBlock: {
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#52525b',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  trackRowActive: {
    borderWidth: 1,
  },
  trackPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  artPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1c1c20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingBadge: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackDetails: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    includeFontPadding: false,
  },
  trackTitleActive: {
    color: '#38bdf8',
  },
  trackArtist: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#71717A',
    includeFontPadding: false,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#D4D4D8',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#71717A',
    textAlign: 'center',
    maxWidth: 240,
  },
  remoteContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  remoteEmptyBox: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  remoteConnectedBox: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  remoteTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  remoteSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#000000',
  },
});
