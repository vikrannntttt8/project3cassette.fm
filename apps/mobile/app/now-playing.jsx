import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function MobileNowPlayingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#0e0e0e] justify-between p-6">
      {/* Top Header */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-white text-lg">✕</Text>
        </TouchableOpacity>
        <Text className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Now Playing
        </Text>
        <View className="w-6" />
      </View>

      {/* Album Artwork */}
      <View className="items-center justify-center my-8">
        <View className="w-72 h-72 rounded-3xl bg-[#161616] border border-white/10 items-center justify-center shadow-2xl">
          <Text className="text-white text-5xl opacity-40">♫</Text>
        </View>
      </View>

      {/* Track Info */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-white tracking-tight mb-1">
          No Track Loaded
        </Text>
        <Text className="text-sm text-neutral-400">
          Select a track from the library or search
        </Text>
      </View>

      {/* Scrubber Placeholder */}
      <View className="w-full mb-6">
        <View className="h-1 bg-white/10 rounded-full w-full mb-2">
          <View className="h-1 bg-white rounded-full w-1/3" />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs font-mono text-neutral-500">0:00</Text>
          <Text className="text-xs font-mono text-neutral-500">3:30</Text>
        </View>
      </View>

      {/* Transport Controls */}
      <View className="flex-row items-center justify-center gap-8 mb-4">
        <TouchableOpacity className="p-3">
          <Text className="text-white text-xl">⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity className="w-16 h-16 rounded-full bg-white items-center justify-center shadow-lg">
          <Text className="text-black text-2xl font-bold">▶</Text>
        </TouchableOpacity>
        <TouchableOpacity className="p-3">
          <Text className="text-white text-xl">⏭</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
