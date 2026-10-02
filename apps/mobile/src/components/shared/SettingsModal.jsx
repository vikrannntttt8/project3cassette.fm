import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Volume2,
  Database,
  Info,
  Check,
  Sliders,
  Moon,
  Trash2,
  Clock,
  Sparkles,
  Wifi,
} from 'lucide-react-native';

const QUALITY_OPTIONS = [
  { id: 'max', label: 'Maximum (Lossless / 256-320kbps)', desc: 'Best audio fidelity, higher data usage' },
  { id: 'standard', label: 'Standard (160kbps AAC/Opus)', desc: 'Balanced performance and clarity' },
  { id: 'datasaver', label: 'Data Saver (96kbps)', desc: 'Optimized for low-bandwidth connections' },
];

const EQ_PRESETS = [
  'Flat',
  'Bass Boost',
  'Vocal Clarity',
  'Acoustic',
  'Electronic',
];

const SLEEP_TIMERS = ['Off', '15m', '30m', '45m', '60m'];

const ACCENT_COLORS = [
  { id: 'white', label: 'Pulse White', hex: '#FFFFFF' },
  { id: 'purple', label: 'Electric Purple', hex: '#8b5cf6' },
  { id: 'cyan', label: 'Neon Cyan', hex: '#06b6d4' },
  { id: 'emerald', label: 'Emerald Green', hex: '#10b981' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [quality, setQuality] = useState('max');
  const [eqPreset, setEqPreset] = useState('Bass Boost');
  const [sleepTimer, setSleepTimer] = useState('Off');
  const [accentColor, setAccentColor] = useState('white');
  const [offlineCacheEnabled, setOfflineCacheEnabled] = useState(true);
  const [gaplessPlayback, setGaplessPlayback] = useState(true);
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [autoplaySimilar, setAutoplaySimilar] = useState(true);
  const [cacheSize, setCacheSize] = useState('142.8 MB');

  const handleClearCache = () => {
    Alert.alert(
      'Clear Track Cache',
      'This will remove all locally cached audio streams. Offline songs will need to re-download.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setCacheSize('0.0 MB');
            Alert.alert('Cache Cleared', 'All temporary audio buffers have been freed.');
          },
        },
      ]
    );
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header with dismiss button */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Audio & Settings</Text>
            <Text style={styles.headerSubtitle}>Customize playback & native engine</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Audio Stream Quality */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Volume2 size={16} color="#A3A3A3" />
              <Text style={styles.sectionTitle}>Audio Stream Quality</Text>
            </View>

            <View style={styles.card}>
              {QUALITY_OPTIONS.map((opt) => {
                const isSelected = quality === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.7}
                    onPress={() => setQuality(opt.id)}
                    style={[
                      styles.qualityRow,
                      isSelected && styles.qualityRowSelected,
                    ]}
                  >
                    <View style={styles.qualityTextContainer}>
                      <Text
                        style={[
                          styles.qualityLabel,
                          isSelected && styles.qualityLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={styles.qualityDesc}>{opt.desc}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={14} color="#000000" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section: Equalizer & DSP Enhancements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sliders size={16} color="#A3A3A3" />
              <Text style={styles.sectionTitle}>Equalizer Presets</Text>
            </View>

            <View style={styles.card}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetScroll}
              >
                {EQ_PRESETS.map((preset) => {
                  const isSelected = eqPreset === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      activeOpacity={0.7}
                      onPress={() => setEqPreset(preset)}
                      style={[
                        styles.presetChip,
                        isSelected ? styles.presetChipActive : styles.presetChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isSelected ? styles.presetChipTextActive : styles.presetChipTextInactive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Section: Playback Behavior */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={16} color="#A3A3A3" />
              <Text style={styles.sectionTitle}>Playback Experience</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleLabel}>Gapless Crossfade</Text>
                  <Text style={styles.toggleDesc}>Seamless track transitions without silence</Text>
                </View>
                <Switch
                  value={gaplessPlayback}
                  onValueChange={setGaplessPlayback}
                  trackColor={{ false: '#262626', true: '#ffffff' }}
                  thumbColor={gaplessPlayback ? '#000000' : '#737373'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleLabel}>Volume Normalization</Text>
                  <Text style={styles.toggleDesc}>Balance volume across all tracks</Text>
                </View>
                <Switch
                  value={normalizeVolume}
                  onValueChange={setNormalizeVolume}
                  trackColor={{ false: '#262626', true: '#ffffff' }}
                  thumbColor={normalizeVolume ? '#000000' : '#737373'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleLabel}>Autoplay Similar</Text>
                  <Text style={styles.toggleDesc}>Keep the vibe going when queue finishes</Text>
                </View>
                <Switch
                  value={autoplaySimilar}
                  onValueChange={setAutoplaySimilar}
                  trackColor={{ false: '#262626', true: '#ffffff' }}
                  thumbColor={autoplaySimilar ? '#000000' : '#737373'}
                />
              </View>
            </View>
          </View>

          {/* Section: Sleep Timer */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={16} color="#A3A3A3" />
              <Text style={styles.sectionTitle}>Sleep Timer</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.sleepTimerRow}>
                {SLEEP_TIMERS.map((time) => {
                  const isSelected = sleepTimer === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      activeOpacity={0.7}
                      onPress={() => setSleepTimer(time)}
                      style={[
                        styles.sleepTimerChip,
                        isSelected ? styles.sleepTimerChipActive : styles.sleepTimerChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sleepTimerText,
                          isSelected ? styles.sleepTimerTextActive : styles.sleepTimerTextInactive,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section: Storage & Cache */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Database size={16} color="#A3A3A3" />
              <Text style={styles.sectionTitle}>Storage & Cache</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleLabel}>Offline Track Cache</Text>
                  <Text style={styles.toggleDesc}>Store audio chunks locally for instant start</Text>
                </View>
                <Switch
                  value={offlineCacheEnabled}
                  onValueChange={setOfflineCacheEnabled}
                  trackColor={{ false: '#262626', true: '#ffffff' }}
                  thumbColor={offlineCacheEnabled ? '#000000' : '#737373'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.cacheRow}>
                <View>
                  <Text style={styles.toggleLabel}>Local Cache Size</Text>
                  <Text style={styles.toggleDesc}>{cacheSize} occupied</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClearCache}
                  style={styles.clearCacheBtn}
                >
                  <Trash2 size={14} color="#ef4444" />
                  <Text style={styles.clearCacheText}>Clear Cache</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section: Diagnostics & Architecture */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Info size={16} color="#A3A3A3" />
              <Text style={styles.sectionTitle}>Engine & Diagnostics</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.diagRow}>
                <Text style={styles.diagKey}>App Platform</Text>
                <Text style={styles.diagVal}>cassette.fm Mobile Native</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagKey}>Audio Framework</Text>
                <Text style={styles.diagVal}>RN TrackPlayer (Media3 NewArch)</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagKey}>Engine Runtime</Text>
                <Text style={styles.diagVal}>Expo SDK 57 • RN 0.86.3</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagKey}>CDN Connectivity</Text>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Active / Direct Piped</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#a3a3a3',
  },
  card: {
    backgroundColor: '#161618',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  qualityRowSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  qualityTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d4d4d8',
    marginBottom: 2,
  },
  qualityLabelSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  qualityDesc: {
    fontSize: 11.5,
    color: '#71717a',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetChipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  presetChipInactive: {
    backgroundColor: '#202023',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#000000',
  },
  presetChipTextInactive: {
    color: '#a1a1aa',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 14,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 11.5,
    color: '#71717a',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
  sleepTimerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  sleepTimerChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sleepTimerChipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  sleepTimerChipInactive: {
    backgroundColor: '#202023',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sleepTimerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sleepTimerTextActive: {
    color: '#000000',
  },
  sleepTimerTextInactive: {
    color: '#a1a1aa',
  },
  cacheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  clearCacheBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  clearCacheText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  diagKey: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  diagVal: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#ffffff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#10b981',
    fontWeight: '600',
  },
});
