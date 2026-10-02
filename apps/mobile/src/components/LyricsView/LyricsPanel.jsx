import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

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
    <View style={styles.container}>
      {hasLyrics && lyrics.length > 0 ? (
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => onSeek?.(line.time)}
                style={styles.lineButton}
              >
                <Text
                  style={[
                    styles.lineText,
                    isActive ? styles.lineTextActive : styles.lineTextInactive,
                  ]}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {hasLyrics ? 'Loading lyrics...' : 'No synchronized lyrics available for this track'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingVertical: 50,
  },
  lineButton: {
    paddingVertical: 10,
    marginVertical: 2,
  },
  lineText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  lineTextActive: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 22,
  },
  lineTextInactive: {
    color: '#52525b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
    textAlign: 'center',
  },
});
