import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { LanguageButton } from '../LanguagePicker';
import { MetroMateLogo } from '../brand/MetroMateLogo';
import { useReduceMotion } from '../home/useHeroClock';
import { useT } from '../../i18n/useT';
import { fontFor, useOnboardingFonts } from './fonts';
import { OnboardingButton } from './OnboardingButton';
import { OnboardingScreen } from './OnboardingScreen';
import { PageIndicator } from './PageIndicator';
import { ob } from './palette';
import { SCENES } from './scenes';
import { clampStep, nextStep, targetAfterSwipe } from './pagerLogic';

/** Where the walkthrough hands over to: the Plan tab, the Map, or just back to where the user was. */
export type OnboardingTarget = 'plan' | 'map' | 'close';

interface Props {
  onFinish: (target: OnboardingTarget) => void;
}

const N = SCENES.length;
const DURATION = 380;
/** Height of the fixed control bar: indicator, gap, button and the quiet secondary action. Every step has the same bar, so nothing jumps. */
const CONTROLS_H = 6 + 20 + 14 + 52 + 50;
/** Once the first scene has finished building, the other pages mount one at a time, so later swipes never wait on a mount. */
const WARM_START_MS = 3000;
const WARM_STEP_MS = 400;
/** Longest the copy waits for Manrope before showing in the system font. */
const FONT_WAIT_MS = 700;

/**
 * The five-step welcome walkthrough: a horizontal pager (swipe, Next, Back, Skip), a fixed control bar and a top
 * bar with the language button. The current step lives in state here, so ordinary re-renders keep it. Nothing
 * on these screens asks for location or any permission.
 */
export function OnboardingFlow({ onFinish }: Props) {
  const { t, lang } = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduced = useReduceMotion();
  const fontsLoaded = useOnboardingFonts();

  const progress = useSharedValue(0);
  const startPage = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(2);
  const indexRef = useRef(0);
  const textIn = useSharedValue(reduced ? 1 : 0);
  const [fontWaitOver, setFontWaitOver] = useState(false);
  const textReady = fontsLoaded || lang !== 'en' || fontWaitOver;

  useEffect(() => {
    const id = setTimeout(() => setFontWaitOver(true), FONT_WAIT_MS);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (textReady) textIn.set(reduced ? 1 : withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));
  }, [textReady, reduced, textIn]);

  // Mount the remaining pages in the background once the first one is on screen; pages are never unmounted again,
  // so a scene keeps its finished state when you swipe back to it.
  useEffect(() => {
    if (mounted >= N) return;
    const id = setTimeout(() => setMounted((m) => Math.min(N, m + 1)), mounted === 2 ? WARM_START_MS : WARM_STEP_MS);
    return () => clearTimeout(id);
  }, [mounted]);

  const buzz = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => undefined);
  }, []);

  const goTo = useCallback(
    (i: number, haptic = true) => {
      const target = clampStep(i, N);
      if (target === indexRef.current && Math.abs(progress.get() - target) < 0.01) return;
      indexRef.current = target;
      setIndex(target);
      if (haptic) buzz();
      progress.set(withTiming(target, { duration: reduced ? 160 : DURATION, easing: Easing.out(Easing.cubic) }));
    },
    [progress, reduced, buzz],
  );

  const commitFromGesture = useCallback(
    (i: number) => {
      if (i !== indexRef.current) buzz();
      indexRef.current = i;
      setIndex(i);
    },
    [buzz],
  );

  // The scene that is mostly on screen is the one that animates.
  useAnimatedReaction(
    () => Math.round(progress.get()),
    (r, prev) => {
      if (r !== prev) runOnJS(setActive)(r);
    },
  );

  // The gesture callbacks run on gesture events (never during render); `commitFromGesture` reads a ref inside an event handler.
  /* eslint-disable react-hooks/refs */
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-20, 20])
        .onBegin(() => {
          cancelAnimation(progress);
          startPage.set(progress.get());
        })
        .onUpdate((e) => {
          let p = startPage.get() - e.translationX / width;
          if (p < 0) p *= 0.3;
          if (p > N - 1) p = N - 1 + (p - (N - 1)) * 0.3;
          progress.set(p);
        })
        .onEnd((e) => {
          const from = Math.round(startPage.get());
          const target = targetAfterSwipe(progress.get(), -e.velocityX / width, from, N);
          progress.set(withTiming(target, { duration: DURATION, easing: Easing.out(Easing.cubic) }));
          runOnJS(commitFromGesture)(target);
        }),
    [width, progress, startPage, commitFromGesture],
  );
  /* eslint-enable react-hooks/refs */

  // Android back: step back through the walkthrough; at the first step the system takes over (leaves the app, or the screen).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (indexRef.current > 0) {
        goTo(indexRef.current - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [goTo]);

  const def = SCENES[index];
  const last = index === N - 1;
  const primary = () => (last ? onFinish('plan') : goTo(nextStep(index, N)));
  // The quiet action under the button: the step's own (first and last steps), otherwise Skip.
  const secondaryLabel = def.secondary ? t(def.secondary) : t('onboarding.skip');
  const secondary = () => onFinish(last ? 'map' : 'plan');
  const controlsH = CONTROLS_H + Math.max(insets.bottom, 14);
  const controlsIn = useAnimatedStyle(() => ({ opacity: 0.4 + 0.6 * textIn.value }));

  const bar = { paddingTop: insets.top + 8 };

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <GestureDetector gesture={pan}>
        <View style={styles.pager} accessible={false} accessibilityLabel={t('onboarding.pager.a11y')}>
          {SCENES.map((s, i) =>
            i < mounted || Math.abs(i - active) <= 1 ? (
              <Page key={s.id} i={i} width={width} progress={progress}>
                <OnboardingScreen def={s} index={i} reduced={reduced} pageW={width} progress={progress} controlsH={controlsH} fontsLoaded={fontsLoaded} textIn={textIn} lang={lang} t={t} />
              </Page>
            ) : null,
          )}
        </View>
      </GestureDetector>

      <View style={[styles.topBar, bar]} pointerEvents="box-none">
        <View style={styles.topLeft}>
          {index > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('onboarding.back')} onPress={() => goTo(index - 1)} hitSlop={6} style={styles.round}>
              <ChevronLeft size={22} color={ob.indigo} strokeWidth={2.4} />
            </Pressable>
          ) : null}
          <LanguageButton size={44} tint={ob.violet} background={ob.white} />
        </View>
      </View>

      <HeaderLogo show={active === N - 1} reduced={reduced} top={insets.top + 4} />

      <Animated.View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 14) }, controlsIn]}>
        <PageIndicator count={N} progress={progress} label={t('onboarding.step', { n: index + 1, total: N })} />
        <View style={styles.buttons}>
          <OnboardingButton label={def.primary ? t(def.primary) : t('onboarding.next')} onPress={primary} textStyle={fontFor('extrabold', lang, fontsLoaded)} />
          <View style={styles.secondarySlot}>
            <OnboardingButton variant="text" label={secondaryLabel} onPress={secondary} textStyle={fontFor('bold', lang, fontsLoaded)} />
          </View>
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

/** On the last step the MetroMate mark eases down into the header. */
function HeaderLogo({ show, reduced, top }: { show: boolean; reduced: boolean; top: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(v);
    if (!show) v.set(withTiming(0, { duration: 180 }));
    else if (reduced) v.set(1);
    else v.set(withDelay(180, withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) })));
  }, [show, reduced, v]);
  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * 14 }, { scale: 0.86 + 0.14 * v.value }] }));
  return (
    <View pointerEvents="none" style={[styles.logoWrap, { top }]}>
      <Animated.View style={style}>
        <MetroMateLogo size={50} />
      </Animated.View>
    </View>
  );
}

function Page({ i, width, progress, children }: { i: number; width: number; progress: ReturnType<typeof useSharedValue<number>>; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    const d = i - progress.value;
    return { transform: [{ translateX: d * width }] };
  });
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ob.bg },
  pager: { flex: 1, overflow: 'hidden' },
  topBar: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: ob.white, alignItems: 'center', justifyContent: 'center', shadowColor: ob.violet, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  logoWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 6, gap: 14, backgroundColor: 'transparent' },
  buttons: { gap: 2 },
  secondarySlot: { minHeight: 48, justifyContent: 'center' },
});
