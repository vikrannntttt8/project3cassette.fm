import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { setupTrackPlayer } from '../src/services/trackPlayerService';
import { hydrateMobileStorage } from '@cassette/core';
import { NativeAppProviders } from '../src/context/NativeContextProviders.jsx';

// Prevent splash screen from auto-hiding before fonts & storage are hydrated
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        // 1. Load custom web-parity typography (Inter and Shrikhand)
        await Font.loadAsync({
          'Inter': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-SemiBold': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Bold': require('../assets/fonts/Inter-Regular.ttf'),
          'Shrikhand': require('../assets/fonts/Shrikhand-Regular.ttf'),
          'font-cassette': require('../assets/fonts/Shrikhand-Regular.ttf'),
        });
      } catch (fontErr) {
        console.warn('[RootLayout] Custom font load warning:', fontErr);
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
        setIsReady(true);
        try {
          await SplashScreen.hideAsync().catch(() => {});
        } catch {}
      }
    }

    initializeApp();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <NativeAppProviders>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000000' }}>
          <StatusBar style="light" backgroundColor="#000000" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000000' },
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
    </View>
  );
}
