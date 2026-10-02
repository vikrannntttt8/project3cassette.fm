import '../global.css';
import React, { useEffect, useState, Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { setupTrackPlayer } from '../src/services/trackPlayerService';
import { hydrateMobileStorage } from '@cassette/core';

// Prevent splash screen from auto-hiding before root layout is evaluated
SplashScreen.preventAutoHideAsync().catch(() => {});

// Root-level Error Boundary to prevent silent crashes / black screens
class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RootErrorBoundary] Caught fatal render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0e0e0e', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ color: '#a3a3a3', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            {this.state.error?.message || 'Unknown initialization error'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
          >
            <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 14 }}>Reload Interface</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  useEffect(() => {
    let isMounted = true;

    const dismissSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {}
    };

    // Immediate attempt on mount so splash never blocks UI rendering
    dismissSplash();

    // 250ms fallback guarantee: force splash screen to hide even if async setup stalls
    const fallbackTimer = setTimeout(() => {
      dismissSplash();
    }, 250);

    async function initializeApp() {
      try {
        // Hydrate stored cache from AsyncStorage non-blockingly
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
        if (isMounted) {
          clearTimeout(fallbackTimer);
          dismissSplash();
        }
      }
    }

    initializeApp();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      dismissSplash();
    };
  }, []);

  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
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
    </RootErrorBoundary>
  );
}
