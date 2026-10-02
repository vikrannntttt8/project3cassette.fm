import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  Heart,
  ListMusic,
  DownloadCloud,
  Plus,
  Search,
  X,
  FolderPlus,
  Check,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import SongRow from '../HomeView/SongRow.jsx';

function SubNavChip({ section, isSelected, onPress }) {
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
        onPress={() => onPress(section.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chip,
          isSelected ? styles.chipActive : styles.chipInactive,
        ]}
      >
        <Text
          style={[
            styles.chipText,
            isSelected ? styles.chipTextActive : styles.chipTextInactive,
          ]}
        >
          {section.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function LibraryView({
  likedSongs = [],
  playlists = [],
  offlineTracks = [],
  activeSongId,
  isPlaying,
  onPlaySong,
  onSelectPlaylist,
  onToggleLike,
}) {
  const [section, setSection] = useState('liked'); // 'liked' | 'playlists' | 'offline'
  const [searchQuery, setSearchQuery] = useState('');
  const [customPlaylists, setCustomPlaylists] = useState(playlists);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');

  const sections = [
    { id: 'liked', label: `Liked (${likedSongs.length})` },
    { id: 'playlists', label: `Playlists (${customPlaylists.length})` },
    { id: 'offline', label: `Downloaded (${offlineTracks.length})` },
  ];

  const handleCreatePlaylist = () => {
    if (!newPlaylistTitle.trim()) return;
    const newPl = {
      id: `pl-${Date.now()}`,
      title: newPlaylistTitle.trim(),
      songs: [],
    };
    setCustomPlaylists([newPl, ...customPlaylists]);
    setNewPlaylistTitle('');
    setIsCreateModalOpen(false);
  };

  const filteredLikedSongs = useMemo(() => {
    if (!searchQuery.trim()) return likedSongs;
    const q = searchQuery.toLowerCase();
    return likedSongs.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.artist && s.artist.toLowerCase().includes(q))
    );
  }, [likedSongs, searchQuery]);

  return (
    <View style={styles.container}>
      {/* ── Sub-navigation ── */}
      <View style={styles.subnavContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subnavScroll}
        >
          {sections.map((s) => (
            <SubNavChip
              key={s.id}
              section={s}
              isSelected={section === s.id}
              onPress={setSection}
            />
          ))}
        </ScrollView>
      </View>

      {/* Optional Search inside library */}
      {likedSongs.length > 3 && (
        <View style={styles.searchBarWrapper}>
          <Search size={15} color="#737373" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Filter ${section}...`}
            placeholderTextColor="#737373"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={15} color="#737373" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Liked Songs List */}
        {section === 'liked' && (
          <View>
            {filteredLikedSongs.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart size={44} color="#525252" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No matching songs' : 'No liked songs yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try searching for another track or artist'
                    : 'Tap the heart icon on any song to add it to your library'}
                </Text>
              </View>
            ) : (
              filteredLikedSongs.map((song, idx) => (
                <SongRow
                  key={song.id || idx}
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

        {/* Playlists List */}
        {section === 'playlists' && (
          <View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsCreateModalOpen(true)}
              style={styles.createPlaylistButton}
            >
              <View style={styles.createIconWrapper}>
                <Plus size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.createTitle}>Create New Playlist</Text>
                <Text style={styles.createSubtitle}>Organize your favorite audio</Text>
              </View>
            </TouchableOpacity>

            {customPlaylists.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                activeOpacity={0.7}
                onPress={() => onSelectPlaylist?.(pl)}
                style={styles.playlistItem}
              >
                <View style={styles.playlistIconWrapper}>
                  <ListMusic size={20} color="#737373" />
                </View>
                <View style={styles.playlistDetails}>
                  <Text numberOfLines={1} style={styles.playlistTitle}>
                    {pl.title || 'Untitled Playlist'}
                  </Text>
                  <Text style={styles.playlistSubtitle}>
                    {pl.songs?.length || 0} tracks
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Offline Downloads */}
        {section === 'offline' && (
          <View>
            {offlineTracks.length === 0 ? (
              <View style={styles.emptyState}>
                <DownloadCloud size={44} color="#525252" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No offline songs cached</Text>
                <Text style={styles.emptySubtitle}>
                  Downloaded songs will appear here for playback without internet
                </Text>
              </View>
            ) : (
              offlineTracks.map((song, idx) => (
                <SongRow
                  key={song.id || idx}
                  song={song}
                  index={idx}
                  isActive={activeSongId === (song.id || song.videoId)}
                  isPlaying={isPlaying}
                  onPlay={() => onPlaySong?.(song)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Create Playlist Modal ── */}
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
  subnavContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  subnavScroll: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  chipInactive: {
    backgroundColor: '#161618',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000000',
  },
  chipTextInactive: {
    color: '#a1a1aa',
  },
  searchBarWrapper: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#ffffff',
    paddingVertical: 0,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 130,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#71717a',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#161618',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  createIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  createSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#161618',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  playlistIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#1f1f22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistDetails: {
    flex: 1,
    minWidth: 0,
  },
  playlistTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  playlistSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
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
    fontWeight: '700',
    color: '#000000',
  },
});
