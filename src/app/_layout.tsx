import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../state/AppProvider';
import { colors, type } from '../theme';
import { Notice } from '../components/ui';

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
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Gate />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
});
