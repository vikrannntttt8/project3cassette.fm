import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Heart,
  ListMusic,
  Plus,
  Play,
  RotateCw,
  Check,
  FolderPlus,
  Download,
  HardDrive,
  Disc3,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { googleAuthSyncService } from '../../services/googleAuthSyncService.js';
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
  onOpenAuth,
}) {
  const [activeTab, setActiveTab] = useState('playlists'); // 'offline' | 'playlists' | 'liked' | 'downloads' | 'custom_albums'
  const [userPlaylists, setUserPlaylists] = useState(playlists);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');

  // Load real playlists from AsyncStorage
  const loadPlaylists = async () => {
    try {
      const stored = await AsyncStorage.getItem('pulse_playlists');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUserPlaylists(parsed);
          return;
        }
      }
      setUserPlaylists([]);
    } catch {
      setUserPlaylists([]);
    }
  };

  useEffect(() => {
    loadPlaylists();

    const unsub = googleAuthSyncService.subscribe((user, syncing) => {
      setIsSyncing(syncing);
      loadPlaylists();
    });
    return () => unsub();
  }, []);

  const handleSyncYouTube = async () => {
    const user = googleAuthSyncService.getUser();
    if (!user?.isConnected) {
      Alert.alert(
        'Sign In Required',
        'Sign in with your Google account to sync your YouTube Music playlists and liked songs.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => onOpenAuth?.() },
        ]
      );
      return;
    }

    setIsSyncing(true);
    const res = await googleAuthSyncService.syncYouTubeMusicLibrary();
    setIsSyncing(false);

    if (res?.success) {
      await loadPlaylists();
      Alert.alert(
        'YouTube Music Synced',
        `Successfully synced ${res.data?.likedCount || 0} liked tracks and ${res.data?.playlistCount || 0} playlists.`
      );
    } else {
      Alert.alert('Sync Notice', res?.error || 'Could not reach YouTube Music sync endpoint.');
    }
  };

  const handleImportSpotify = () => {
    Alert.prompt
      ? Alert.prompt(
          'Import Spotify Playlist',
          'Paste a public Spotify playlist share link:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import',
              onPress: (url) => {
                if (url) {
                  Alert.alert('Import Started', 'Matching Spotify tracks against YouTube Music catalog...');
                }
              },
            },
          ]
        )
      : Alert.alert('Import Spotify Playlist', 'Use Settings > Backup & Import to paste your Spotify playlist link.');
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) return;
    const newPl = {
      id: `pl-${Date.now()}`,
      title: newPlaylistTitle.trim(),
      itemCount: 0,
      collageImages: [],
      songs: [],
    };
    const updated = [newPl, ...userPlaylists];
    setUserPlaylists(updated);
    await AsyncStorage.setItem('pulse_playlists', JSON.stringify(updated)).catch(() => {});
    setNewPlaylistTitle('');
    setIsCreateModalOpen(false);
  };

  const filterChips = [
    { id: 'offline', label: `Offline Cache (0)`, icon: HardDrive },
    { id: 'playlists', label: `Playlists (${userPlaylists.length})`, icon: ListMusic },
    { id: 'liked', label: `Liked (${likedSongs.length})`, icon: Heart },
    { id: 'downloads', label: `Downloads (0)`, icon: Download },
    { id: 'custom_albums', label: `Custom Albums (0)`, icon: Disc3 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title Section */}
        <View style={styles.headerSection}>
          <Text style={styles.collectionTag}>COLLECTION</Text>
          <Text style={styles.libraryHeading}>My Library</Text>
        </View>

        {/* Filter Chips Bar (Horizontal Scroll) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={styles.chipsContainer}
        >
          {filterChips.map((chip) => {
            const isActive = activeTab === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                activeOpacity={0.7}
                onPress={() => setActiveTab(chip.id)}
                style={[
                  styles.filterChip,
                  isActive ? styles.filterChipActive : styles.filterChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive ? styles.filterChipTextActive : styles.filterChipTextInactive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          {/* Create Playlist Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsCreateModalOpen(true)}
            style={styles.actionPillBtn}
          >
            <Plus size={14} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.actionPillText}>Create Playlist</Text>
          </TouchableOpacity>

          {/* Sync YouTube Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSyncYouTube}
            disabled={isSyncing}
            style={styles.actionPillBtn}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <View style={styles.ytIconBadge}>
                <Play size={10} color="#ffffff" fill="#ffffff" />
              </View>
            )}
            <Text style={styles.actionPillText}>
              {isSyncing ? 'Syncing...' : 'Sync YouTube'}
            </Text>
          </TouchableOpacity>

          {/* Import Spotify Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleImportSpotify}
            style={styles.actionPillBtn}
          >
            <View style={styles.spotifyIconBadge}>
              <View style={styles.spotifyLine1} />
              <View style={styles.spotifyLine2} />
              <View style={styles.spotifyLine3} />
            </View>
            <Text style={styles.actionPillText}>Import Spotify</Text>
          </TouchableOpacity>
        </View>

        {/* Playlists Tab Content */}
        {activeTab === 'playlists' && (
          <View style={styles.contentGrid}>
            {userPlaylists.length === 0 ? (
              <View style={styles.emptyCard}>
                <ListMusic size={38} color="#52525b" />
                <Text style={styles.emptyTitle}>No Playlists Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create a custom playlist or tap "Sync YouTube" to import your existing YouTube Music playlists.
                </Text>
              </View>
            ) : (
              <View style={styles.gridRow}>
                {userPlaylists.map((pl) => (
                  <TouchableOpacity
                    key={pl.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (onSelectPlaylist) {
                        onSelectPlaylist(pl);
                      } else if (pl.songs && pl.songs.length > 0 && onPlaySong) {
                        onPlaySong(pl.songs[0]);
                      }
                    }}
                    style={styles.playlistCard}
                  >
                    {/* Artwork / 4-Image Collage */}
                    <View style={styles.collageContainer}>
                      {pl.collageImages && pl.collageImages.length >= 4 ? (
                        <>
                          <View style={styles.collageRow}>
                            <Image
                              source={{ uri: pl.collageImages[0] }}
                              style={styles.collageTile}
                              contentFit="cover"
                            />
                            <Image
                              source={{ uri: pl.collageImages[1] }}
                              style={styles.collageTile}
                              contentFit="cover"
                            />
                          </View>
                          <View style={styles.collageRow}>
                            <Image
                              source={{ uri: pl.collageImages[2] }}
                              style={styles.collageTile}
                              contentFit="cover"
                            />
                            <Image
                              source={{ uri: pl.collageImages[3] }}
                              style={styles.collageTile}
                              contentFit="cover"
                            />
                          </View>
                        </>
                      ) : pl.thumbnail || pl.cover ? (
                        <Image
                          source={{ uri: pl.thumbnail || pl.cover }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.collagePlaceholder}>
                          <ListMusic size={32} color="#71717a" />
                        </View>
                      )}
                    </View>

                    {/* Title & Metadata */}
                    <View style={styles.playlistMeta}>
                      <Text numberOfLines={1} style={styles.playlistCardTitle}>
                        {pl.title || 'Untitled Playlist'}
                      </Text>
                      <Text style={styles.playlistCardSubtitle}>
                        {pl.itemCount || pl.songs?.length || 0} tracks
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Liked Songs Tab */}
        {activeTab === 'liked' && (
          <View style={styles.tracksSection}>
            {likedSongs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Heart size={38} color="#52525b" />
                <Text style={styles.emptyTitle}>No liked tracks yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the heart icon on any song to save it to your library
                </Text>
              </View>
            ) : (
              likedSongs.map((song, idx) => (
                <SongRow
                  key={song.id || song.videoId || idx}
                  song={song}
                  index={idx}
                  isActive={activeSongId === (song.id || song.videoId)}
                  isPlaying={isPlaying}
                  isLiked={true}
                  onPlay={() => onPlaySong?.(song)}
                  onToggleLike={() => onToggleLike?.(song)}
                />
              ))
            )}
          </View>
        )}

        {/* Offline Cache Tab */}
        {(activeTab === 'offline' || activeTab === 'downloads') && (
          <View style={styles.emptyCard}>
            <HardDrive size={38} color="#52525b" />
            <Text style={styles.emptyTitle}>Offline Cache Empty</Text>
            <Text style={styles.emptySubtitle}>
              Audio chunks downloaded for offline listening will automatically be saved here
            </Text>
          </View>
        )}

        {/* Custom Albums Tab */}
        {activeTab === 'custom_albums' && (
          <View style={styles.emptyCard}>
            <Disc3 size={38} color="#52525b" />
            <Text style={styles.emptyTitle}>No Custom Albums</Text>
            <Text style={styles.emptySubtitle}>
              Imported local or custom tagged albums will appear here
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Playlist Modal */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <FolderPlus size={22} color="#FFFFFF" />
              <Text style={styles.modalTitle}>New Playlist</Text>
            </View>

            <TextInput
              value={newPlaylistTitle}
              onChangeText={setNewPlaylistTitle}
              placeholder="Playlist name..."
              placeholderTextColor="#737373"
              autoFocus
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setNewPlaylistTitle('');
                  setIsCreateModalOpen(false);
                }}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCreatePlaylist}
                style={[
                  styles.modalConfirmBtn,
                  !newPlaylistTitle.trim() && { opacity: 0.5 },
                ]}
                disabled={!newPlaylistTitle.trim()}
              >
                <Check size={16} color="#000000" strokeWidth={3} />
                <Text style={styles.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: 16,
  },
  collectionTag: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#71717a',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  libraryHeading: {
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.6,
  },
  chipsContainer: {
    marginBottom: 14,
  },
  chipsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  filterChipInactive: {
    backgroundColor: '#161618',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipText: {
    fontSize: 12.5,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#000000',
  },
  filterChipTextInactive: {
    color: '#a1a1aa',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  actionPillText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#ffffff',
  },
  ytIconBadge: {
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyIconBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
  },
  spotifyLine1: {
    width: 8,
    height: 1.5,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  spotifyLine2: {
    width: 6.5,
    height: 1.5,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  spotifyLine3: {
    width: 5,
    height: 1.5,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  contentGrid: {
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  playlistCard: {
    width: '47.5%',
    backgroundColor: '#161618',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    overflow: 'hidden',
  },
  collageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#27272a',
    marginBottom: 10,
  },
  collageRow: {
    flex: 1,
    flexDirection: 'row',
  },
  collageTile: {
    flex: 1,
    height: '100%',
  },
  collagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202023',
  },
  playlistMeta: {
    paddingHorizontal: 2,
  },
  playlistCardTitle: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  playlistCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#71717a',
    marginTop: 2,
  },
  tracksSection: {
    paddingBottom: 20,
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: '#141416',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 14,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    fontFamily: 'Inter',
    color: '#71717a',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#18181a',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
  },
  modalInput: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#202023',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#ffffff',
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#a1a1aa',
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#000000',
  },
});
