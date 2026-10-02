import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Volume2, ShieldCheck, Database, Radio, Info, ChevronRight, Check } from 'lucide-react-native';

const QUALITY_OPTIONS = [
  { id: 'max', label: 'Maximum (Lossless / 256-320kbps)', desc: 'Best audio fidelity, higher data usage' },
  { id: 'standard', label: 'Standard (160kbps AAC/Opus)', desc: 'Balanced performance and clarity' },
  { id: 'datasaver', label: 'Data Saver (96kbps)', desc: 'Optimized for low-bandwidth connections' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [quality, setQuality] = useState('max');
  const [offlineCacheEnabled, setOfflineCacheEnabled] = useState(true);
  const [gaplessPlayback, setGaplessPlayback] = useState(true);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-[#0e0e0e]" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/5">
          <Text className="text-xl font-bold text-white tracking-tight">Settings</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {/* Audio Quality Section */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Volume2 size={16} color="#A3A3A3" />
              <Text className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                Audio Stream Quality
              </Text>
            </View>

            <View className="bg-[#161616] rounded-2xl p-2 border border-white/5">
              {QUALITY_OPTIONS.map((opt) => {
                const isSelected = quality === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.7}
                    onPress={() => setQuality(opt.id)}
                    className="flex-row items-center justify-between p-3.5 rounded-xl active:bg-white/5"
                  >
                    <View className="flex-1 mr-3">
                      <Text className={`text-sm font-semibold mb-0.5 ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                        {opt.label}
                      </Text>
                      <Text className="text-xs text-neutral-500">{opt.desc}</Text>
                    </View>
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                        <Check size={14} color="#000000" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Playback & Cache Section */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Database size={16} color="#A3A3A3" />
              <Text className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                Storage & Playback
              </Text>
            </View>

            <View className="bg-[#161616] rounded-2xl p-4 border border-white/5 gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-white mb-0.5">Offline Track Cache</Text>
                  <Text className="text-xs text-neutral-500">Cache songs locally for instant playback</Text>
                </View>
                <Switch
                  value={offlineCacheEnabled}
                  onValueChange={setOfflineCacheEnabled}
                  trackColor={{ false: '#262626', true: '#ffffff' }}
                  thumbColor={offlineCacheEnabled ? '#000000' : '#737373'}
                />
              </View>

              <View className="h-px bg-white/5" />

              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-white mb-0.5">Gapless Transition</Text>
                  <Text className="text-xs text-neutral-500">Seamless audio crossfade between tracks</Text>
                </View>
                <Switch
                  value={gaplessPlayback}
                  onValueChange={setGaplessPlayback}
                  trackColor={{ false: '#262626', true: '#ffffff' }}
                  thumbColor={gaplessPlayback ? '#000000' : '#737373'}
                />
              </View>
            </View>
          </View>

          {/* Engine & Architecture Info */}
          <View className="mb-8">
            <View className="flex-row items-center gap-2 mb-3">
              <Info size={16} color="#A3A3A3" />
              <Text className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                About cassette.fm
              </Text>
            </View>

            <View className="bg-[#161616] rounded-2xl p-4 border border-white/5 gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-neutral-400">Version</Text>
                <Text className="text-sm font-mono text-white">1.0.0 (Native Monorepo)</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-neutral-400">Runtime</Text>
                <Text className="text-sm font-mono text-white">Expo SDK 57 • React Native</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-neutral-400">Audio Engine</Text>
                <Text className="text-sm font-mono text-white">react-native-track-player 4.1.2</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-neutral-400">Stream Protocol</Text>
                <Text className="text-sm font-mono text-white">Direct CDN + Piped Fallback</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
