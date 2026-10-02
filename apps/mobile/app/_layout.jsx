import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { setupTrackPlayer } from '../src/services/trackPlayerService';
import { hydrateMobileStorage } from '@cassette/core';
import { NativeAppProviders } from '../src/context/NativeContextProviders.jsx';

export default function RootLayout() {
  useEffect(() => {
    // Proactively dismiss any native splash screen so it never blocks UI rendering
    try {
      SplashScreen.hideAsync().catch(() => {});
    } catch {}

    async function initializeApp() {
      try {
        await hydrateMobileStorage([
          'pulse_supabase_url',
          'pulse_supabase_anon_key',
          'pulse_auth_config',
          'likedSongs',
          'pulse_like',
          'pulse_playback_history',
        ]);
      } catch (storageErr) {
        console.warn('[RootLayout] Storage hydration error:', storageErr);
      }

      try {
        await setupTrackPlayer();
      } catch (playerErr) {
        console.warn('[RootLayout] TrackPlayer init warning:', playerErr);
      } finally {
        try {
          SplashScreen.hideAsync().catch(() => {});
        } catch {}
      }
    }

    initializeApp();
  }, []);

  return (
    <NativeAppProviders>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0e0e0e' }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0e0e0e' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="now-playing"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </NativeAppProviders>
  );
}
