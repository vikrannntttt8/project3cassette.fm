import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function MobileHomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#0e0e0e]" edges={['top', 'left', 'right']}>
      {/* ── Branded Header ── */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-white/5">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-2xl font-bold tracking-tight text-white">cassette.fm</Text>
          <View className="w-2 h-2 rounded-full bg-white shadow-sm" />
        </View>
        <TouchableOpacity
          className="p-2 rounded-full bg-white/5"
          onPress={() => console.log('Search pressed')}
        >
          <Text className="text-white text-xs font-mono uppercase tracking-wider">Search</Text>
        </TouchableOpacity>
      </View>

      {/* ── Content Feed ── */}
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">
            Trending Now
          </Text>
          <Text className="text-xl font-bold text-white tracking-tight">
            Discover Music
          </Text>
        </View>

        {/* Quick Shelf placeholder */}
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            className="flex-1 p-4 rounded-2xl bg-[#161616] border border-white/5"
            onPress={() => router.push('/now-playing')}
          >
            <View className="w-12 h-12 rounded-xl bg-white/10 mb-3 items-center justify-center">
              <Text className="text-white text-lg">▶</Text>
            </View>
            <Text className="text-sm font-semibold text-white truncate">Open Player</Text>
            <Text className="text-xs text-neutral-400">Lock-screen ready</Text>
          </TouchableOpacity>

          <View className="flex-1 p-4 rounded-2xl bg-[#161616] border border-white/5">
            <View className="w-12 h-12 rounded-xl bg-white/10 mb-3 items-center justify-center">
              <Text className="text-white text-lg">✦</Text>
            </View>
            <Text className="text-sm font-semibold text-white truncate">Native Audio</Text>
            <Text className="text-xs text-neutral-400">Background Engine</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Mini-Player Dock ── */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/now-playing')}
        className="mx-3 mb-2 p-3 rounded-2xl bg-[#18181a] border border-white/10 flex-row items-center justify-between shadow-2xl"
      >
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <View className="w-11 h-11 rounded-xl bg-neutral-800 items-center justify-center">
            <Text className="text-neutral-500 text-lg">♫</Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-semibold text-white truncate">cassette.fm Mobile</Text>
            <Text className="text-xs text-neutral-400 truncate">Tap to expand player</Text>
          </View>
        </View>
        <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
          <Text className="text-black text-sm font-bold">▶</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
