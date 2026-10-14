import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { X, Mic2, Feather, Disc3, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/NativeContextProviders.jsx';
import { youtubeMusicApiService } from '../../services/youtubeMusicApiService.js';

export default function CreditsModal({ isOpen, onClose, song }) {
  const insets = useSafeAreaInsets();
  const { theme, themeStyle } = useTheme();
  const isOled = themeStyle === 'oled';

  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && song) {
      setLoading(true);
      youtubeMusicApiService
        .fetchTrackCredits(song)
        .then((res) => {
          if (isMounted) {
            setCredits(res);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, song]);

  if (!isOpen || !song) return null;

  const title = song.title || 'Unknown Track';
  const artist = song.artist || song.artists?.[0]?.name || 'Unknown Artist';
  const thumbnail = song.thumbnail || song.cover;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(150)}
          style={StyleSheet.absoluteFillObject}
        />
      </Pressable>

      <Animated.View
        entering={SlideInDown.springify().damping(22).stiffness(240)}
        style={[
          styles.sheet,
          {
            backgroundColor: isOled ? '#000000' : '#121214',
            borderColor: isOled ? '#1F1F1F' : 'rgba(255, 255, 255, 0.08)',
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Song Credits</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color="#71717A" />
          </TouchableOpacity>
        </View>

        {/* Track Banner */}
        <View style={styles.trackCard}>
          <Image
            source={{ uri: thumbnail }}
            style={styles.cover}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.trackMeta}>
            <Text numberOfLines={1} style={styles.trackTitle}>{title}</Text>
            <Text numberOfLines={1} style={styles.trackArtist}>{artist}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.loadingText}>Fetching metadata & credits...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Performers */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Mic2 size={16} color="#A1A1AA" />
                <Text style={styles.sectionTitle}>Performed by</Text>
              </View>
              {credits?.performers?.map((p, idx) => (
                <View key={`perf-${idx}`} style={styles.creditRow}>
                  <Text style={styles.creditName}>{p.name}</Text>
                  <Text style={styles.creditRole}>{p.role}</Text>
                </View>
              ))}
            </View>

            {/* Written by */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather size={16} color="#A1A1AA" />
                <Text style={styles.sectionTitle}>Written by</Text>
              </View>
              {credits?.writers?.map((w, idx) => (
                <View key={`wri-${idx}`} style={styles.creditRow}>
                  <Text style={styles.creditName}>{w.name}</Text>
                  <Text style={styles.creditRole}>{w.role}</Text>
                </View>
              ))}
            </View>

            {/* Produced by */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Disc3 size={16} color="#A1A1AA" />
                <Text style={styles.sectionTitle}>Produced by</Text>
              </View>
              {credits?.producers?.map((prod, idx) => (
                <View key={`prod-${idx}`} style={styles.creditRow}>
                  <Text style={styles.creditName}>{prod.name}</Text>
                  <Text style={styles.creditRole}>{prod.role}</Text>
                </View>
              ))}
            </View>

            {/* Source & Rights */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ShieldCheck size={16} color="#A1A1AA" />
                <Text style={styles.sectionTitle}>Source & Licensing</Text>
              </View>
              <View style={styles.sourceBox}>
                <Text style={styles.sourceLabel}>Record Label</Text>
                <Text style={styles.sourceValue}>{credits?.source?.label}</Text>

                <Text style={[styles.sourceLabel, { marginTop: 8 }]}>Copyright Notice</Text>
                <Text style={styles.sourceValue}>{credits?.source?.copyright}</Text>

                <Text style={[styles.sourceLabel, { marginTop: 8 }]}>Audio Format & Fidelity</Text>
                <Text style={styles.sourceValue}>{credits?.source?.audioQuality}</Text>
              </View>
            </View>
          </ScrollView>
        )}
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
    maxHeight: '80%',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 10,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1c1c20',
  },
  trackMeta: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#A1A1AA',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#A1A1AA',
  },
  scroll: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  creditName: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  creditRole: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#71717A',
  },
  sourceBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sourceLabel: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#71717A',
    textTransform: 'uppercase',
  },
  sourceValue: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#D4D4D8',
    marginTop: 2,
  },
});
