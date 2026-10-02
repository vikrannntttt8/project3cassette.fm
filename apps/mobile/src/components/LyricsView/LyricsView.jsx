import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Music2,
  ListMusic,
} from 'lucide-react-native';
import { formatTime } from '@cassette/core';
import AlbumArtPanel from './AlbumArtPanel.jsx';
import LyricsPanel from './LyricsPanel.jsx';

export default function LyricsView({
  currentSong,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  lyrics = [],
  isLiked = false,
  isShuffled = false,
  isRepeat = false,
  onClose,
  onTogglePlay,
  onSkipNext,
  onSkipPrev,
  onSeek,
  onToggleLike,
  onToggleShuffle,
  onToggleRepeat,
}) {
  const [tab, setTab] = useState('art'); // 'art' | 'lyrics'
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0e0e0e', justifyContent: 'space-between' }}
      className="flex-1 bg-[#0e0e0e] justify-between"
      edges={['top', 'bottom']}
    >
      {/* ── Top Bar ── */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-white/5">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/5"
        >
          <ChevronDown size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Tab switch between Art & Lyrics */}
        <View className="flex-row bg-[#161616] rounded-full p-1 border border-white/5">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setTab('art')}
            className={`px-3 py-1 rounded-full ${tab === 'art' ? 'bg-white' : ''}`}
          >
            <Text className={`text-xs font-semibold ${tab === 'art' ? 'text-black' : 'text-neutral-400'}`}>
              Cover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setTab('lyrics')}
            className={`px-3 py-1 rounded-full ${tab === 'lyrics' ? 'bg-white' : ''}`}
          >
            <Text className={`text-xs font-semibold ${tab === 'lyrics' ? 'text-black' : 'text-neutral-400'}`}>
              Lyrics
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleLike?.(currentSong)}
          className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/5"
        >
          <Heart size={18} color={isLiked ? '#FFFFFF' : '#737373'} fill={isLiked ? '#FFFFFF' : 'none'} />
        </TouchableOpacity>
      </View>

      {/* ── Main Canvas (Cover or Lyrics) ── */}
      <View className="flex-1 justify-center px-4">
        {tab === 'art' ? (
          <AlbumArtPanel song={currentSong} />
        ) : (
          <LyricsPanel
            lyrics={lyrics}
            currentTime={currentTime}
            onSeek={onSeek}
            hasLyrics={lyrics.length > 0}
          />
        )}
      </View>

      {/* ── Scrubber & Bottom Controls ── */}
      <View className="px-6 pb-6 pt-2">
        {/* Scrubber bar */}
        <View className="w-full mb-4">
          <View className="h-1.5 bg-neutral-800 rounded-full overflow-hidden w-full mb-2">
            <View
              className="h-full bg-white rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-[11px] font-mono text-neutral-400">
              {formatTime(currentTime)}
            </Text>
            <Text className="text-[11px] font-mono text-neutral-400">
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Transport controls */}
        <View className="flex-row items-center justify-between px-2">
          {/* Shuffle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleShuffle}
            className="p-2"
          >
            <Shuffle size={20} color={isShuffled ? '#FFFFFF' : '#525252'} />
          </TouchableOpacity>

          {/* Previous */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSkipPrev}
            className="p-2"
          >
            <SkipBack size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onTogglePlay}
            className="w-16 h-16 rounded-full bg-white items-center justify-center shadow-2xl"
          >
            {isPlaying ? (
              <Pause size={26} color="#000000" fill="#000000" />
            ) : (
              <Play size={26} color="#000000" fill="#000000" />
            )}
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSkipNext}
            className="p-2"
          >
            <SkipForward size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleRepeat}
            className="p-2"
          >
            <Repeat size={20} color={isRepeat ? '#FFFFFF' : '#525252'} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
