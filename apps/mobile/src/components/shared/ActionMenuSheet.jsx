import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Mic, Users, Shuffle, Settings, X } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { colors, typography } from '../../theme/tokens.js';

export default function ActionMenuSheet({
  isOpen,
  onClose,
  onRecognizeMusic,
  onMusicTogether,
  onShuffleQueue,
  onOpenSettings,
  queueLength = 0,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* PRD Section 6.3: Scrim is #000000/72% */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(180)}
          style={StyleSheet.absoluteFillObject}
        />
      </Pressable>

      {/* PRD Section 6.3: Sheet is #000000 with 1 px top border #1F1F1F, handle */}
      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(220)}
        style={styles.sheet}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Actions</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.itemsList}>
          {/* 1. Recognize Music (PRD 6.3 & REC-01) */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              onRecognizeMusic?.();
            }}
          >
            <View style={styles.iconCircle}>
              <Mic size={18} color={colors.accent} strokeWidth={2.2} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Recognize music</Text>
              <Text style={styles.rowSubtitle}>Identify audio playing nearby</Text>
            </View>
          </TouchableOpacity>

          {/* 2. Music Together (PRD 6.3 & TOG-01) */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              onMusicTogether?.();
            }}
          >
            <View style={styles.iconCircle}>
              <Users size={18} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Music Together</Text>
              <Text style={styles.rowSubtitle}>Listen simultaneously with friends</Text>
            </View>
          </TouchableOpacity>

          {/* 3. Shuffle Queue (PRD 6.3 & SHF-01) */}
          <TouchableOpacity
            style={[styles.actionRow, queueLength < 3 && styles.actionRowDisabled]}
            activeOpacity={0.7}
            disabled={queueLength < 3}
            onPress={() => {
              onClose();
              onShuffleQueue?.();
            }}
          >
            <View style={styles.iconCircle}>
              <Shuffle size={18} color={queueLength >= 3 ? '#FFFFFF' : colors.textDisabled} strokeWidth={2.2} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.rowTitle, queueLength < 3 && { color: colors.textDisabled }]}>
                Shuffle queue
              </Text>
              <Text style={styles.rowSubtitle}>
                {queueLength >= 3 ? `${queueLength} tracks ready` : 'Requires 3+ tracks in queue'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 4. Settings & Account */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              onOpenSettings?.();
            }}
          >
            <View style={styles.iconCircle}>
              <Settings size={18} color={colors.textSecondary} strokeWidth={2.2} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Settings & Audio Quality</Text>
              <Text style={styles.rowSubtitle}>Configure Opus streaming & downloads</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayScrim,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemsList: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRowDisabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
