import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { setupTrackPlayer } from '../src/services/trackPlayerService';
import { hydrateMobileStorage } from '@cassette/core';
import { NativeAppProviders } from '../src/context/NativeContextProviders.jsx';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Proactively dismiss splash screen
    try {
      SplashScreen.hideAsync().catch(() => {});
    } catch {}

    async function initializeApp() {
      // 1. Load custom web-parity typography (Inter and Shrikhand)
      try {
        await Font.loadAsync({
          'Inter': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-SemiBold': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Bold': require('../assets/fonts/Inter-Regular.ttf'),
          'Shrikhand': require('../assets/fonts/Shrikhand-Regular.ttf'),
          'font-cassette': require('../assets/fonts/Shrikhand-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch (fontErr) {
        console.warn('[RootLayout] Custom font load warning:', fontErr);
        setFontsLoaded(true);
      }

      // 2. Hydrate persistent offline storage
      try {
        await hydrateMobileStorage([
          'pulse_supabase_url',
          'pulse_supabase_anon_key',
          'pulse_auth_config',
          'likedSongs',
          'pulse_like',
          'pulse_playback_history',
          'pulse_playlists',
          'pulse_app_settings_v2',
        ]);
      } catch (storageErr) {
        console.warn('[RootLayout] Storage hydration error:', storageErr);
      }

      // 3. Initialize audio engine
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
