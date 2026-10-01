import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function LyricsPanel({
  lyrics = [],
  currentTime = 0,
  onSeek,
  hasLyrics = false,
}) {
  const scrollViewRef = useRef(null);

  // Find active lyric index
  let activeIndex = -1;
  if (Array.isArray(lyrics) && lyrics.length > 0) {
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  return (
    <View className="flex-1 w-full justify-center">
      {hasLyrics && lyrics.length > 0 ? (
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4 py-2"
          contentContainerStyle={{ paddingVertical: 40 }}
        >
          {lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => onSeek?.(line.time)}
                className="py-2.5 my-0.5"
              >
                <Text
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isActive
                      ? 'text-white scale-105'
                      : 'text-neutral-600'
                  }`}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View className="items-center justify-center py-12 px-6">
          <Text className="text-sm font-semibold text-neutral-500 text-center">
            {hasLyrics ? 'Loading lyrics...' : 'No synchronized lyrics available for this track'}
          </Text>
        </View>
      )}
    </View>
  );
}
