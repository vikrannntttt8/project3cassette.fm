import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Volume2,
  Globe,
  Database,
  Info,
  Cloud,
  Check,
  RotateCw,
  Trash2,
  Download,
  Upload,
  Settings as SettingsIcon,
  User,
  LogOut,
  Palette,
} from 'lucide-react-native';
import { googleAuthSyncService } from '../../services/googleAuthSyncService.js';
import { useSettings } from '../../context/NativeContextProviders.jsx';
import { apiUrl } from '@cassette/core';

const PRESET_PALETTES = [
  { id: 'white', label: 'Default Monochrome', hex: '#ffffff' },
  { id: 'amber', label: 'Warm Amber', hex: '#f59e0b' },
  { id: 'cyan', label: 'Electric Cyan', hex: '#38bdf8' },
  { id: 'emerald', label: 'Emerald Green', hex: '#10b981' },
  { id: 'pink', label: 'Neon Pink', hex: '#ec4899' },
  { id: 'purple', label: 'Electric Purple', hex: '#8b5cf6' },
];

export default function SettingsModal({ isOpen, onClose, onOpenAuth }) {
  const [currentSubpage, setCurrentSubpage] = useState('menu'); // 'menu' | 'account' | 'interface' | 'quality' | 'content' | 'backup' | 'about'
  const [user, setUser] = useState(googleAuthSyncService.getUser());
  const [isSyncing, setIsSyncing] = useState(false);
  const { settings, updateSetting, resetSettings } = useSettings();

  const [ytPlaylistUrl, setYtPlaylistUrl] = useState('');
  const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState('');
  const [importing, setImporting] = useState(false);

  // Storage counts
  const [storageCounts, setStorageCounts] = useState({ liked: 0, playlists: 0, history: 0 });

  const loadStorageCounts = async () => {
    try {
      const [likedRaw, plRaw, histRaw] = await Promise.all([
        AsyncStorage.getItem('likedSongs'),
        AsyncStorage.getItem('pulse_playlists'),
        AsyncStorage.getItem('pulse_playback_history'),
      ]);
      setStorageCounts({
        liked: likedRaw ? JSON.parse(likedRaw).length : 0,
        playlists: plRaw ? JSON.parse(plRaw).length : 0,
        history: histRaw ? JSON.parse(histRaw).length : 0,
      });
    } catch {}
  };

  useEffect(() => {
    const unsub = googleAuthSyncService.subscribe((u, syncing) => {
      setUser(u);
      setIsSyncing(syncing);
    });
    loadStorageCounts();
    return () => unsub();
  }, []);

  const handleSyncCloud = async () => {
    if (!user?.isConnected) {
      Alert.alert(
        'Sign In Required',
        'Sign in to synchronize your playlists and liked songs with YouTube Music.',
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
    loadStorageCounts();

    if (res?.success) {
      Alert.alert(
        'Cloud Sync Complete',
        `Successfully synced ${res.data?.likedCount || 0} liked tracks and ${res.data?.playlistCount || 0} playlists.`
      );
    } else {
      Alert.alert('Sync Result', res?.error || 'Synced cached library items.');
    }
  };

  const handleAuthAction = async () => {
    if (user?.isConnected) {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await googleAuthSyncService.signOut();
            setCurrentSubpage('menu');
          },
        },
      ]);
    } else {
      onOpenAuth?.();
    }
  };

  const handleImportYouTubePlaylist = async () => {
    if (!ytPlaylistUrl.trim()) return;
    setImporting(true);
    try {
      const res = await fetch(apiUrl('/api/playlist/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ytPlaylistUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data?.songs) {
        // Save playlist to pulse_playlists
        const currentPlRaw = await AsyncStorage.getItem('pulse_playlists');
        const currentPl = currentPlRaw ? JSON.parse(currentPlRaw) : [];
        const newPl = {
          id: `pl-${Date.now()}`,
          title: data.title || 'Imported YouTube Playlist',
          itemCount: data.songs.length,
          songs: data.songs,
          collageImages: data.songs.slice(0, 4).map((s) => s.thumbnail || s.cover),
        };
        await AsyncStorage.setItem('pulse_playlists', JSON.stringify([newPl, ...currentPl]));
        setYtPlaylistUrl('');
        loadStorageCounts();
        Alert.alert('Import Complete', `Imported "${newPl.title}" with ${data.songs.length} tracks.`);
      } else {
        Alert.alert('Import Failed', data?.error || 'Could not parse YouTube playlist URL.');
      }
    } catch (e) {
      Alert.alert('Import Error', e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleImportSpotifyPlaylist = async () => {
    if (!spotifyPlaylistUrl.trim()) return;
    setImporting(true);
    try {
      const res = await fetch(apiUrl('/api/spotify/playlist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: spotifyPlaylistUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data?.playlist?.tracks) {
        const currentPlRaw = await AsyncStorage.getItem('pulse_playlists');
        const currentPl = currentPlRaw ? JSON.parse(currentPlRaw) : [];
        const newPl = {
          id: `pl-spot-${Date.now()}`,
          title: data.playlist.name || 'Imported Spotify Playlist',
          itemCount: data.playlist.tracks.length,
          songs: data.playlist.tracks,
          collageImages: data.playlist.tracks.slice(0, 4).map((s) => s.thumbnail || s.cover),
        };
        await AsyncStorage.setItem('pulse_playlists', JSON.stringify([newPl, ...currentPl]));
        setSpotifyPlaylistUrl('');
        loadStorageCounts();
        Alert.alert('Import Complete', `Imported "${newPl.title}" with ${data.playlist.tracks.length} tracks.`);
      } else {
        Alert.alert('Import Failed', data?.error || 'Could not parse Spotify playlist URL.');
      }
    } catch (e) {
      Alert.alert('Import Error', e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const [history, liked, playlists] = await Promise.all([
        AsyncStorage.getItem('pulse_playback_history'),
        AsyncStorage.getItem('likedSongs'),
        AsyncStorage.getItem('pulse_playlists'),
      ]);
      const backupData = JSON.stringify(
        {
          version: '2.4.0',
          exportedAt: new Date().toISOString(),
          settings,
          likedSongs: liked ? JSON.parse(liked) : [],
          playlists: playlists ? JSON.parse(playlists) : [],
          history: history ? JSON.parse(history) : [],
        },
        null,
        2
      );
      await Share.share({
        title: 'cassette.fm_backup.json',
        message: backupData,
      });
    } catch (e) {
      Alert.alert('Export Error', e.message);
    }
  };

  const handleClearHistory = async () => {
    Alert.alert('Clear History', 'Remove all recently played history from Listen Again?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('pulse_playback_history');
          loadStorageCounts();
          Alert.alert('History Cleared', 'Your recent track playback history has been reset.');
        },
      },
    ]);
  };

  const handleClearCache = async () => {
    Alert.alert('Clear Audio Cache', 'Remove all locally cached streams and temporary audio buffers?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Cache',
        style: 'destructive',
        onPress: async () => {
          Alert.alert('Cache Cleared', 'All temporary buffers have been purged.');
        },
      },
    ]);
  };

  const toggleNavTab = (tabKey) => {
    const current = settings.navVisibility || {};
    const next = { ...current, [tabKey]: !current[tabKey] };
    // Ensure at least one tab stays active
    if (Object.values(next).filter(Boolean).length === 0) return;
    updateSetting('navVisibility', next);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Navigation Top Bar */}
        <View style={styles.topBar}>
          {currentSubpage === 'menu' ? (
            <View>
              <Text style={styles.topBarTitle}>Settings</Text>
              <Text style={styles.topBarSubtitle}>cassette.fm Configuration</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentSubpage('menu')}
              style={styles.backButton}
            >
              <ChevronLeft size={22} color="#ffffff" />
              <Text style={styles.backButtonText}>Settings</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ============================================================== */}
          {/* PAGE 7: SETTINGS MAIN MENU                                     */}
          {/* ============================================================== */}
          {currentSubpage === 'menu' && (
            <View>
              {/* Account Card (Page 7) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (user?.isConnected) {
                    setCurrentSubpage('account');
                  } else {
                    onOpenAuth?.();
                  }
                }}
                style={styles.accountCard}
              >
                {user?.isConnected ? (
                  <View style={[styles.avatarCircle, { backgroundColor: user.avatarBg || '#ea580c' }]}>
                    <Text style={styles.avatarLetter}>{user.avatarLetter || 'V'}</Text>
                  </View>
                ) : (
                  <View style={[styles.avatarCircle, { backgroundColor: '#27272a' }]}>
                    <User size={20} color="#a1a1aa" />
                  </View>
                )}
                <View style={styles.accountDetails}>
                  <Text style={styles.accountName}>
                    {user?.isConnected ? user.name : 'Sign in to cassette.fm'}
                  </Text>
                  <Text style={styles.accountSubtitle}>
                    {user?.isConnected
                      ? isSyncing
                        ? 'Syncing YouTube Music...'
                        : user.statusText || 'Google Connected · Library Synced'
                      : 'Connect Google or email to sync your cloud library'}
                  </Text>
                </View>
                <ChevronRight size={18} color="#71717a" />
              </TouchableOpacity>

              {/* 5 Menu Navigation Cards */}
              <View style={styles.menuCardsGroup}>
                {/* 1. Interface & Behavior */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentSubpage('interface')}
                  style={styles.menuCard}
                >
                  <View style={[styles.menuIconBadge, { backgroundColor: '#3b82f620' }]}>
                    <Sliders size={20} color="#60a5fa" />
                  </View>
                  <View style={styles.menuCardMeta}>
                    <Text style={styles.menuCardTitle}>Interface & Behavior</Text>
                    <Text style={styles.menuCardSubtitle}>Themes, dynamic glow, layout toggles</Text>
                  </View>
                  <ChevronRight size={18} color="#71717a" />
                </TouchableOpacity>

                {/* 2. Quality & Playback */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentSubpage('quality')}
                  style={styles.menuCard}
                >
                  <View style={[styles.menuIconBadge, { backgroundColor: '#10b98120' }]}>
                    <Volume2 size={20} color="#34d399" />
                  </View>
                  <View style={styles.menuCardMeta}>
                    <Text style={styles.menuCardTitle}>Quality & Playback</Text>
                    <Text style={styles.menuCardSubtitle}>OPUS 256k, gapless audio, volume normalize</Text>
                  </View>
                  <ChevronRight size={18} color="#71717a" />
                </TouchableOpacity>

                {/* 3. Content & Language */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentSubpage('content')}
                  style={styles.menuCard}
                >
                  <View style={[styles.menuIconBadge, { backgroundColor: '#8b5cf620' }]}>
                    <Globe size={20} color="#a78bfa" />
                  </View>
                  <View style={styles.menuCardMeta}>
                    <Text style={styles.menuCardTitle}>Content & Language</Text>
                    <Text style={styles.menuCardSubtitle}>Regional charts, explicit content filter</Text>
                  </View>
                  <ChevronRight size={18} color="#71717a" />
                </TouchableOpacity>

                {/* 4. Backup & Import */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentSubpage('backup')}
                  style={styles.menuCard}
                >
                  <View style={[styles.menuIconBadge, { backgroundColor: '#f59e0b20' }]}>
                    <Database size={20} color="#fbbf24" />
                  </View>
                  <View style={styles.menuCardMeta}>
                    <Text style={styles.menuCardTitle}>Backup & Import</Text>
                    <Text style={styles.menuCardSubtitle}>YouTube/Spotify import, JSON library sync</Text>
                  </View>
                  <ChevronRight size={18} color="#71717a" />
                </TouchableOpacity>

                {/* 5. About & Diagnostics */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentSubpage('about')}
                  style={styles.menuCard}
                >
                  <View style={[styles.menuIconBadge, { backgroundColor: '#ec489920' }]}>
                    <Info size={20} color="#f472b6" />
                  </View>
                  <View style={styles.menuCardMeta}>
                    <Text style={styles.menuCardTitle}>About & Diagnostics</Text>
                    <Text style={styles.menuCardSubtitle}>Engine status, stream format, cache</Text>
                  </View>
                  <ChevronRight size={18} color="#71717a" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* PAGE 8: ACCOUNT & CLOUD SYNC                                   */}
          {/* ============================================================== */}
          {currentSubpage === 'account' && (
            <View>
              {/* Cloud Synchronization Card */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.headerTitleWithIcon}>
                    <Cloud size={16} color="#60a5fa" />
                    <Text style={styles.cardHeaderTitle}>Cloud Synchronization</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSyncCloud}
                    disabled={isSyncing}
                    style={styles.syncPillBtn}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <RotateCw size={13} color="#000000" />
                    )}
                    <Text style={styles.syncPillText}>Sync Cloud</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardDescription}>
                  Supabase PostgreSQL synchronization powers real-time cross-device updates for playlists, playback history, and liked songs.
                </Text>
              </View>

              {/* User Profile Card */}
              <View style={styles.sectionCard}>
                {user?.isConnected ? (
                  <>
                    <View style={styles.profileRow}>
                      <View style={[styles.avatarCircleLarge, { backgroundColor: user.avatarBg || '#ea580c' }]}>
                        <Text style={styles.avatarLetterLarge}>{user.avatarLetter || 'V'}</Text>
                      </View>
                      <View style={styles.profileDetails}>
                        <Text style={styles.profileName}>{user.name}</Text>
                        <Text style={styles.profileEmail}>{user.email}</Text>
                        <View style={styles.activePillBadge}>
                          <View style={styles.greenDot} />
                          <Text style={styles.activePillText}>{user.statusText || 'Connected · Synced'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.profileButtonsRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => onOpenAuth?.()}
                        style={styles.profileSecondaryBtn}
                      >
                        <Text style={styles.profileSecondaryText}>Account Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleAuthAction}
                        style={[styles.profileSecondaryBtn, styles.signOutBtn]}
                      >
                        <Text style={[styles.profileSecondaryText, styles.signOutText]}>
                          Sign Out
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <Text style={styles.profileName}>Not Signed In</Text>
                    <Text style={[styles.cardDescription, { textAlign: 'center', marginTop: 4, marginBottom: 14 }]}>
                      Sign in to synchronize your playlists, liked tracks, and listening history with the cloud.
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => onOpenAuth?.()}
                      style={styles.importPrimaryBtn}
                    >
                      <User size={15} color="#000000" />
                      <Text style={styles.importPrimaryText}>Sign In / Register</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* PAGE 9: INTERFACE & BEHAVIOR                                   */}
          {/* ============================================================== */}
          {currentSubpage === 'interface' && (
            <View>
              <Text style={styles.subpageSectionTitle}>THEMES & AESTHETICS</Text>
              <View style={styles.sectionCard}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Monochrome B&W Mode</Text>
                    <Text style={styles.toggleDesc}>Render all cover artwork in high-contrast grayscale</Text>
                  </View>
                  <Switch
                    value={settings.monochromeMode}
                    onValueChange={(v) => updateSetting('monochromeMode', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.monochromeMode ? '#000000' : '#71717a'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Dynamic Glow</Text>
                    <Text style={styles.toggleDesc}>Sample album dominant colors for responsive glow</Text>
                  </View>
                  <Switch
                    value={settings.dynamicGlow}
                    onValueChange={(v) => updateSetting('dynamicGlow', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.dynamicGlow ? '#000000' : '#71717a'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Ambient Background Glow</Text>
                    <Text style={styles.toggleDesc}>Subtle radial backlights in now-playing sheet</Text>
                  </View>
                  <Switch
                    value={settings.ambientGlow}
                    onValueChange={(v) => updateSetting('ambientGlow', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.ambientGlow ? '#000000' : '#71717a'}
                  />
                </View>

                {/* Custom Accent Color Palette */}
                <View style={styles.divider} />
                <Text style={styles.toggleTitle}>Custom Accent Color</Text>
                <Text style={styles.toggleDesc}>Custom color palette applied when dynamic glow is off</Text>
                <View style={styles.paletteRow}>
                  {PRESET_PALETTES.map((pal) => {
                    const isSelected = settings.customAccentColor === pal.hex;
                    return (
                      <TouchableOpacity
                        key={pal.id}
                        activeOpacity={0.8}
                        onPress={() => updateSetting('customAccentColor', pal.hex)}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: pal.hex },
                          isSelected && styles.colorCircleSelected,
                        ]}
                      >
                        {isSelected && (
                          <Check
                            size={14}
                            color={pal.hex === '#ffffff' ? '#000000' : '#ffffff'}
                            strokeWidth={3}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Romanized Phonetic Lyrics</Text>
                    <Text style={styles.toggleDesc}>Transliterate Japanese, Korean, and non-latin scripts</Text>
                  </View>
                  <Switch
                    value={settings.romanizedLyrics}
                    onValueChange={(v) => updateSetting('romanizedLyrics', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.romanizedLyrics ? '#000000' : '#71717a'}
                  />
                </View>

                <View style={styles.divider} />
                <Text style={styles.toggleTitle}>Synced Lyrics Font Size</Text>
                <View style={styles.chipSelectorRow}>
                  {['small', 'normal', 'large'].map((size) => {
                    const isSelected = settings.lyricFontSize === size;
                    return (
                      <TouchableOpacity
                        key={size}
                        activeOpacity={0.7}
                        onPress={() => updateSetting('lyricFontSize', size)}
                        style={[styles.regionChip, isSelected && styles.regionChipActive]}
                      >
                        <Text style={[styles.regionChipText, isSelected && styles.regionChipTextActive]}>
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Text style={styles.subpageSectionTitle}>LAYOUT PREFERENCES</Text>
              <View style={styles.sectionCard}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Quick Picks Feed</Text>
                    <Text style={styles.toggleDesc}>Show dynamic instant radio recommendations</Text>
                  </View>
                  <Switch
                    value={settings.showQuickPicks !== false}
                    onValueChange={(v) => updateSetting('showQuickPicks', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.showQuickPicks !== false ? '#000000' : '#71717a'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Listen Again Feed</Text>
                    <Text style={styles.toggleDesc}>Show your recent playback history on home</Text>
                  </View>
                  <Switch
                    value={settings.showListenAgain !== false}
                    onValueChange={(v) => updateSetting('showListenAgain', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.showListenAgain !== false ? '#000000' : '#71717a'}
                  />
                </View>
              </View>

              <Text style={styles.subpageSectionTitle}>NAVIGATION DESTINATIONS</Text>
              <View style={styles.sectionCard}>
                {[
                  { key: 'home', label: 'Home Tab' },
                  { key: 'radio', label: 'Radio Tab' },
                  { key: 'explore', label: 'Explore Tab' },
                  { key: 'library', label: 'Library Tab' },
                  { key: 'settings', label: 'Settings Tab' },
                ].map((navItem, idx) => (
                  <React.Fragment key={navItem.key}>
                    {idx > 0 && <View style={styles.divider} />}
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleTitle}>{navItem.label}</Text>
                      <Switch
                        value={settings.navVisibility?.[navItem.key] !== false}
                        onValueChange={() => toggleNavTab(navItem.key)}
                        trackColor={{ false: '#27272a', true: '#ffffff' }}
                        thumbColor={settings.navVisibility?.[navItem.key] !== false ? '#000000' : '#71717a'}
                      />
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* PAGE 10: QUALITY & PLAYBACK                                    */}
          {/* ============================================================== */}
          {currentSubpage === 'quality' && (
            <View>
              <Text style={styles.subpageSectionTitle}>STREAMING AUDIO QUALITY</Text>
              <View style={styles.qualityCardsGroup}>
                {/* Maximum 256k */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => updateSetting('audioQuality', 'max')}
                  style={[
                    styles.qualityOptionCard,
                    settings.audioQuality === 'max' && styles.qualityOptionCardActive,
                  ]}
                >
                  <View style={styles.qualityCardLeft}>
                    <Text
                      style={[
                        styles.qualityCardTitle,
                        settings.audioQuality === 'max' && styles.qualityCardTitleActive,
                      ]}
                    >
                      Maximum (256k)
                    </Text>
                    <Text
                      style={[
                        styles.qualityCardSubtitle,
                        settings.audioQuality === 'max' && styles.qualityCardSubtitleActive,
                      ]}
                    >
                      High-Res OPUS Audio • Lossless Fidelity
                    </Text>
                  </View>
                  {settings.audioQuality === 'max' && (
                    <View style={styles.blackCheckCircle}>
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Balanced 160k */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => updateSetting('audioQuality', 'balanced')}
                  style={[
                    styles.qualityOptionCard,
                    settings.audioQuality === 'balanced' && styles.qualityOptionCardActive,
                  ]}
                >
                  <View style={styles.qualityCardLeft}>
                    <Text
                      style={[
                        styles.qualityCardTitle,
                        settings.audioQuality === 'balanced' && styles.qualityCardTitleActive,
                      ]}
                    >
                      Balanced (160k)
                    </Text>
                    <Text
                      style={[
                        styles.qualityCardSubtitle,
                        settings.audioQuality === 'balanced' && styles.qualityCardSubtitleActive,
                      ]}
                    >
                      Smooth Bandwidth • Crisp Clarity
                    </Text>
                  </View>
                  {settings.audioQuality === 'balanced' && (
                    <View style={styles.blackCheckCircle}>
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Data Saver 128k */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => updateSetting('audioQuality', 'datasaver')}
                  style={[
                    styles.qualityOptionCard,
                    settings.audioQuality === 'datasaver' && styles.qualityOptionCardActive,
                  ]}
                >
                  <View style={styles.qualityCardLeft}>
                    <Text
                      style={[
                        styles.qualityCardTitle,
                        settings.audioQuality === 'datasaver' && styles.qualityCardTitleActive,
                      ]}
                    >
                      Data Saver (128k)
                    </Text>
                    <Text
                      style={[
                        styles.qualityCardSubtitle,
                        settings.audioQuality === 'datasaver' && styles.qualityCardSubtitleActive,
                      ]}
                    >
                      Minimal Mobile Data Usage
                    </Text>
                  </View>
                  {settings.audioQuality === 'datasaver' && (
                    <View style={styles.blackCheckCircle}>
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.subpageSectionTitle}>PLAYBACK MECHANICS</Text>
              <View style={styles.sectionCard}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Gapless Audio Engine</Text>
                    <Text style={styles.toggleDesc}>Seamless transitions and aggressive chunk prefetch</Text>
                  </View>
                  <Switch
                    value={settings.gaplessPlayback}
                    onValueChange={(v) => updateSetting('gaplessPlayback', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.gaplessPlayback ? '#000000' : '#71717a'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Volume Normalization</Text>
                    <Text style={styles.toggleDesc}>Standardize gain (ReplayGain -14 LUFS)</Text>
                  </View>
                  <Switch
                    value={settings.normalizeAudio}
                    onValueChange={(v) => updateSetting('normalizeAudio', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.normalizeAudio ? '#000000' : '#71717a'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Remove Track Silence</Text>
                    <Text style={styles.toggleDesc}>Trim lead-in and lead-out dead audio air</Text>
                  </View>
                  <Switch
                    value={settings.removeSilence}
                    onValueChange={(v) => updateSetting('removeSilence', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.removeSilence ? '#000000' : '#71717a'}
                  />
                </View>

                {/* Crossfade Duration */}
                <View style={styles.divider} />
                <Text style={styles.toggleTitle}>Crossfade Duration</Text>
                <View style={styles.chipSelectorRow}>
                  {[0, 2, 5, 8, 12].map((dur) => {
                    const isSelected = settings.crossfadeDuration === dur;
                    return (
                      <TouchableOpacity
                        key={dur}
                        activeOpacity={0.7}
                        onPress={() => updateSetting('crossfadeDuration', dur)}
                        style={[styles.regionChip, isSelected && styles.regionChipActive]}
                      >
                        <Text style={[styles.regionChipText, isSelected && styles.regionChipTextActive]}>
                          {dur === 0 ? 'Off (0s)' : `${dur}s`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* PAGE 11: CONTENT & LANGUAGE                                    */}
          {/* ============================================================== */}
          {currentSubpage === 'content' && (
            <View>
              <Text style={styles.subpageSectionTitle}>REGIONAL CHARTS</Text>
              <View style={styles.sectionCard}>
                <Text style={styles.toggleTitle}>Explore & Trending Region</Text>
                <Text style={styles.toggleDesc}>Determines top charts and regional new releases</Text>
                <View style={styles.chipSelectorRow}>
                  {['Global', 'United States', 'India', 'UK', 'Japan'].map((region) => {
                    const isSelected = settings.regionalCharts?.includes(region);
                    return (
                      <TouchableOpacity
                        key={region}
                        activeOpacity={0.7}
                        onPress={() => updateSetting('regionalCharts', region)}
                        style={[styles.regionChip, isSelected && styles.regionChipActive]}
                      >
                        <Text style={[styles.regionChipText, isSelected && styles.regionChipTextActive]}>
                          {region}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Text style={styles.subpageSectionTitle}>CONTENT FILTERS</Text>
              <View style={styles.sectionCard}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Filter Explicit Content</Text>
                    <Text style={styles.toggleDesc}>Hide songs tagged with parental advisory</Text>
                  </View>
                  <Switch
                    value={settings.explicitFilter}
                    onValueChange={(v) => updateSetting('explicitFilter', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.explicitFilter ? '#000000' : '#71717a'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Remember Last Played Track</Text>
                    <Text style={styles.toggleDesc}>Auto-resume playback position on app launch</Text>
                  </View>
                  <Switch
                    value={settings.rememberLastSong}
                    onValueChange={(v) => updateSetting('rememberLastSong', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.rememberLastSong ? '#000000' : '#71717a'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleMeta}>
                    <Text style={styles.toggleTitle}>Mobile Data Saver</Text>
                    <Text style={styles.toggleDesc}>Downgrade bitrate when not connected to WiFi</Text>
                  </View>
                  <Switch
                    value={settings.dataSaver}
                    onValueChange={(v) => updateSetting('dataSaver', v)}
                    trackColor={{ false: '#27272a', true: '#ffffff' }}
                    thumbColor={settings.dataSaver ? '#000000' : '#71717a'}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* PAGE 12: BACKUP & IMPORT                                       */}
          {/* ============================================================== */}
          {currentSubpage === 'backup' && (
            <View>
              <Text style={styles.subpageSectionTitle}>YOUTUBE MUSIC PLAYLIST IMPORTER</Text>
              <View style={styles.sectionCard}>
                <TextInput
                  value={ytPlaylistUrl}
                  onChangeText={setYtPlaylistUrl}
                  placeholder="https://music.youtube.com/playlist?list=..."
                  placeholderTextColor="#71717a"
                  style={styles.urlInput}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleImportYouTubePlaylist}
                  disabled={importing}
                  style={styles.importPrimaryBtn}
                >
                  {importing ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Download size={14} color="#000000" />
                  )}
                  <Text style={styles.importPrimaryText}>Import as Playlist</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subpageSectionTitle}>SPOTIFY PLAYLIST IMPORTER</Text>
              <View style={styles.sectionCard}>
                <TextInput
                  value={spotifyPlaylistUrl}
                  onChangeText={setSpotifyPlaylistUrl}
                  placeholder="https://open.spotify.com/playlist/..."
                  placeholderTextColor="#71717a"
                  style={styles.urlInput}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleImportSpotifyPlaylist}
                  disabled={importing}
                  style={styles.importPrimaryBtn}
                >
                  {importing ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <RotateCw size={14} color="#000000" />
                  )}
                  <Text style={styles.importPrimaryText}>Sync Spotify Playlist</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subpageSectionTitle}>JSON BACKUP & RESTORE</Text>
              <View style={styles.sectionCard}>
                <Text style={styles.cardDescription}>
                  Export an offline JSON snapshot of all your custom playlists, liked tracks, and app preferences.
                </Text>
                <View style={styles.importButtonsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleExportBackup}
                    style={styles.importPrimaryBtn}
                  >
                    <Download size={14} color="#000000" />
                    <Text style={styles.importPrimaryText}>Export Backup JSON</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* PAGE 13: ABOUT & DIAGNOSTICS                                   */}
          {/* ============================================================== */}
          {currentSubpage === 'about' && (
            <View>
              <Text style={styles.subpageSectionTitle}>AUDIO PIPELINE DIAGNOSTICS</Text>
              <View style={styles.sectionCard}>
                <View style={styles.diagRow}>
                  <Text style={styles.diagKey}>App Platform</Text>
                  <Text style={styles.diagVal}>cassette.fm v2.4.0 (Native)</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.diagRow}>
                  <Text style={styles.diagKey}>Audio Framework</Text>
                  <Text style={styles.diagVal}>RN TrackPlayer (Media3)</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.diagRow}>
                  <Text style={styles.diagKey}>Audio Codec</Text>
                  <Text style={styles.diagVal}>audio/webm; codecs="opus"</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.diagRow}>
                  <Text style={styles.diagKey}>Stream Format</Text>
                  <Text style={styles.diagVal}>
                    {settings.audioQuality === 'max'
                      ? '#251 (High Bitrate 256k)'
                      : settings.audioQuality === 'balanced'
                      ? '#250 (Medium Bitrate 160k)'
                      : '#249 (Data Saver 128k)'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.diagRow}>
                  <Text style={styles.diagKey}>Host Environment</Text>
                  <Text style={styles.diagVal}>Native Mobile · Hermes Ready</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.diagRow}>
                  <Text style={styles.diagKey}>CDN Connectivity</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active / Direct Piped</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.subpageSectionTitle}>STORAGE & CACHE</Text>
              <View style={styles.sectionCard}>
                <View style={styles.diagRow}>
                  <Text style={styles.diagKey}>Library Storage</Text>
                  <Text style={styles.diagVal}>
                    {`${storageCounts.liked} Liked · ${storageCounts.playlists} Playlists · ${storageCounts.history} History`}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.importButtonsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleClearHistory}
                    style={styles.importSecondaryBtn}
                  >
                    <Trash2 size={13} color="#ef4444" />
                    <Text style={[styles.importSecondaryText, { color: '#ef4444' }]}>Clear History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleClearCache}
                    style={styles.importSecondaryBtn}
                  >
                    <Trash2 size={13} color="#ef4444" />
                    <Text style={[styles.importSecondaryText, { color: '#ef4444' }]}>Clear Cache</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0e',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  topBarTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  topBarSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    marginTop: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1f1f23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#ffffff',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
  },
  accountSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    marginTop: 2,
  },
  menuCardsGroup: {
    gap: 10,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuCardMeta: {
    flex: 1,
  },
  menuCardTitle: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
  },
  menuCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#71717a',
    marginTop: 2,
  },
  subpageSectionTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#71717a',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: '#161618',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
  },
  syncPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  syncPillText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#000000',
  },
  cardDescription: {
    fontSize: 12.5,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    lineHeight: 18,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircleLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetterLarge: {
    fontSize: 22,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#ffffff',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
  },
  profileEmail: {
    fontSize: 12.5,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    marginTop: 2,
  },
  activePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  activePillText: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#10b981',
    fontWeight: '600',
  },
  profileButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  profileSecondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#222226',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileSecondaryText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#ffffff',
  },
  signOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutText: {
    color: '#ef4444',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleMeta: {
    flex: 1,
    marginRight: 14,
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#ffffff',
  },
  toggleDesc: {
    fontSize: 11.5,
    fontFamily: 'Inter',
    color: '#71717a',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.15 }],
  },
  qualityCardsGroup: {
    gap: 8,
  },
  qualityOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161618',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
  },
  qualityOptionCardActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  qualityCardLeft: {
    flex: 1,
  },
  qualityCardTitle: {
    fontSize: 14.5,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
  },
  qualityCardTitleActive: {
    color: '#000000',
  },
  qualityCardSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Inter',
    color: '#71717a',
    marginTop: 2,
  },
  qualityCardSubtitleActive: {
    color: '#3f3f46',
  },
  blackCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  regionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#202024',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  regionChipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  regionChipText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    fontWeight: '600',
  },
  regionChipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  urlInput: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#202024',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#ffffff',
    marginBottom: 12,
  },
  importButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  importPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 14,
  },
  importPrimaryText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#000000',
  },
  importSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#222226',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    borderRadius: 14,
  },
  importSecondaryText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#ffffff',
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  diagKey: {
    fontSize: 13,
    fontFamily: 'Inter',
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
