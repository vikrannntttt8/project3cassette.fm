import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Radio,
  ListPlus,
  PlaySquare,
  FolderPlus,
  Disc,
  User,
  FileText,
  Share2,
  Heart,
  X,
} from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/NativeContextProviders.jsx';

export default function TrackOptionsMenuSheet({
  isOpen,
  onClose,
  song,
  isLiked = false,
  onToggleLike,
  onStartRadio,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  onAddToAlbums,
  onGoToArtist,
  onViewCredits,
}) {
  const { theme, themeStyle } = useTheme();
  const isOled = themeStyle === 'oled';

  if (!isOpen || !song) return null;

  const title = song.title || 'Unknown Track';
  const artist = song.artist || song.artists?.[0]?.name || 'Unknown Artist';
  const album = song.album || '';
  const thumbnail = song.thumbnail || song.cover;

  const handleShare = async () => {
    onClose();
    try {
      const shareUrl = `https://cassette.fm/track/${song.videoId || song.id}`;
      await Share.share({
        message: `Listen to "${title}" by ${artist} on cassette.fm: ${shareUrl}`,
        url: shareUrl,
        title: `${title} - ${artist}`,
      });
    } catch {}
  };

  const menuItems = [
    {
      id: 'radio',
      label: 'Start Radio',
      subtitle: 'Build instant endless queue from this track',
      Icon: Radio,
      onPress: () => {
        onClose();
        onStartRadio?.(song);
      },
    },
    {
      id: 'play_next',
      label: 'Play Next',
      subtitle: 'Insert right after the current song',
      Icon: PlaySquare,
      onPress: () => {
        onClose();
        onPlayNext?.(song);
      },
    },
    {
      id: 'add_queue',
      label: 'Add to Queue',
      subtitle: 'Append to the bottom of the queue',
      Icon: ListPlus,
      onPress: () => {
        onClose();
        onAddToQueue?.(song);
      },
    },
    {
      id: 'add_playlist',
      label: 'Add to Playlist',
      subtitle: 'Save track to your custom playlists',
      Icon: FolderPlus,
      onPress: () => {
        onClose();
        onAddToPlaylist?.(song);
      },
    },
    {
      id: 'add_albums',
      label: 'Add to Albums / Library',
      subtitle: 'Keep this album in your offline library',
      Icon: Disc,
      onPress: () => {
        onClose();
        onAddToAlbums?.(song);
      },
    },
    {
      id: 'artist',
      label: `Go to ${artist}`,
      subtitle: 'View discography, top tracks & artist bio',
      Icon: User,
      onPress: () => {
        onClose();
        onGoToArtist?.(artist, song);
      },
    },
    {
      id: 'credits',
      label: 'Song Credits',
      subtitle: 'Performers, songwriters, producers & source',
      Icon: FileText,
      onPress: () => {
        onClose();
        onViewCredits?.(song);
      },
    },
    {
      id: 'share',
      label: 'Share Track',
      subtitle: 'Copy deep link to share with friends',
      Icon: Share2,
      onPress: handleShare,
    },
  ];

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Scrim */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(150)}
          style={StyleSheet.absoluteFillObject}
        />
      </Pressable>

      {/* Sheet Content */}
      <Animated.View
        entering={SlideInDown.springify().damping(22).stiffness(240)}
        style={[
          styles.sheet,
          {
            backgroundColor: isOled ? '#000000' : '#121214',
            borderColor: isOled ? '#1F1F1F' : 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      >
        <View style={styles.handle} />

        {/* Track Preview Header */}
        <View style={styles.trackHeader}>
          <Image
            source={{ uri: thumbnail }}
            style={styles.headerCover}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.headerInfo}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.headerArtist}>
              {artist}
              {album ? ` • ${album}` : ''}
            </Text>
          </View>

          {/* Quick Heart Action */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onToggleLike?.(song)}
            style={styles.headerHeartBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={20}
              color={isLiked ? '#FFFFFF' : '#71717A'}
              fill={isLiked ? '#FFFFFF' : 'none'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.headerCloseBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color="#71717A" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Options List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollList}
          contentContainerStyle={styles.scrollListContent}
        >
          {menuItems.map((item) => {
            const ItemIcon = item.Icon;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={item.onPress}
                style={styles.menuRow}
              >
                <View style={styles.iconCircle}>
                  <ItemIcon size={18} color="#D4D4D8" strokeWidth={2} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
    alignSelf: 'center',
    marginBottom: 12,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  headerCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1c1c20',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  headerArtist: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#A1A1AA',
  },
  headerHeartBtn: {
    padding: 6,
  },
  headerCloseBtn: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 6,
  },
  scrollList: {
    maxHeight: 460,
  },
  scrollListContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#71717A',
  },
});
