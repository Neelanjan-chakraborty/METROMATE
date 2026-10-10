import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../state/AppProvider';
import { colors, type } from '../theme';
import { Notice } from '../components/ui';
import { SplashVideo } from '../components/SplashVideo';
import { useT } from '../i18n/useT';
import { OnboardingFlow, type OnboardingTarget } from '../components/onboarding/OnboardingFlow';

// Keep the native splash up until the launch video has drawn its first frame (native only).
if (Platform.OS !== 'web') void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Gate() {
  const { status, error, onboarding, completeOnboarding } = useApp();
  const { t } = useT();
  const [handoff, setHandoff] = useState<OnboardingTarget | null>(null);
  if (status === 'loading' || (status === 'ready' && onboarding === 'loading')) {
    return (
      <View style={styles.center} accessibilityLabel={t('common.loading')}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[type.small, { marginTop: 12 }]}>{t('common.loading')}</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Notice tone="warn" title={t('common.loadError.title')}>
          {t('common.loadError.body', { error: error ?? t('common.unknownError') })}
        </Notice>
      </View>
    );
  }
  // First launch: the welcome walkthrough comes before the app, once. It asks for no permissions.
  if (onboarding === 'pending') {
    return (
      <OnboardingFlow
        onFinish={(target) => {
          setHandoff(target);
          void completeOnboarding();
        }}
      />
    );
  }
  return (
    <>
      <AppStack />
      <Handoff target={handoff} />
    </>
  );
}

/** After the walkthrough, "Explore the map first" opens the real map once the app's navigator is up. */
function Handoff({ target }: { target: OnboardingTarget | null }) {
  useEffect(() => {
    if (target !== 'map') return;
    const id = setTimeout(() => router.navigate('/map'), 60);
    return () => clearTimeout(id);
  }, [target]);
  return null;
}

function AppStack() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="route" />
      <Stack.Screen name="station/[id]" />
      <Stack.Screen name="bus/route/[id]" />
      <Stack.Screen name="bus/stop/[id]" />
      <Stack.Screen name="data" />
      <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
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
