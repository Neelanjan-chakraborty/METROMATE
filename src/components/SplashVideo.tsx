import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import * as SplashScreen from 'expo-splash-screen';

/** How much of assets/splash.mp4 plays at every launch. */
export const SPLASH_SECONDS = 6;
/** The video has a soundtrack; it stays muted so the app doesn't make noise at every launch. */
const SPLASH_MUTED = true;
/** If the video can't start or stalls, never keep the app waiting longer than this past the planned length. */
const GRACE_MS = 2500;
const FADE_MS = 240;
const SPLASH_SOURCE: VideoSource = require('../../assets/splash.mp4');

/**
 * Full-screen launch video: the first SPLASH_SECONDS of assets/splash.mp4, then a short fade into the app.
 * It is only ever a decoration: any playback problem ends it immediately and the app carries on. The app
 * itself keeps loading underneath, so its data is ready by the time the video ends.
 */
export function SplashVideo({ onDone }: { onDone: () => void }) {
  const player = useVideoPlayer(SPLASH_SOURCE, (p) => {
    p.loop = false;
    p.muted = SPLASH_MUTED;
    p.timeUpdateEventInterval = 0.1;
    p.play();
  });
  const [opacity] = useState(() => new Animated.Value(1));
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    player.pause();
    void SplashScreen.hideAsync().catch(() => undefined);
    Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => onDone());
  }, [player, opacity, onDone]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (currentTime >= SPLASH_SECONDS) finish();
  });
  useEventListener(player, 'playToEnd', finish);
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') finish();
  });

  // Safety net: the video should start almost at once; if it doesn't, give up rather than block the app.
  useEffect(() => {
    const t = setTimeout(finish, SPLASH_SECONDS * 1000 + GRACE_MS);
    return () => clearTimeout(t);
  }, [finish]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity }]} pointerEvents="auto" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        // The native splash image is the video's first frame, so hand over as soon as it is drawn.
        onFirstFrameRender={() => void SplashScreen.hideAsync().catch(() => undefined)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#B9D3F0', zIndex: 1000, elevation: 1000 },
});
