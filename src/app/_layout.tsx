import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../state/AppProvider';
import { colors, type } from '../theme';
import { Notice } from '../components/ui';
import { SplashVideo } from '../components/SplashVideo';

// Keep the native splash up until the launch video has drawn its first frame (native only).
if (Platform.OS !== 'web') void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Gate() {
  const { status, error } = useApp();
  if (status === 'loading') {
    return (
      <View style={styles.center} accessibilityLabel="Loading offline data">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[type.small, { marginTop: 12 }]}>Loading offline data…</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Notice tone="warn" title="MetroMate could not load its data">
          {error ?? 'Unknown error.'} Restart the app. If this persists, reinstall to restore the bundled offline data.
        </Notice>
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="route" />
      <Stack.Screen name="station/[id]" />
      <Stack.Screen name="data" />
    </Stack>
  );
}

export default function RootLayout() {
  // The launch video plays on every cold start on a device; the web preview skips it.
  const [splashDone, setSplashDone] = useState(Platform.OS === 'web');
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" hidden={!splashDone} />
        <Gate />
        {splashDone ? null : <SplashVideo onDone={() => setSplashDone(true)} />}
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
});
