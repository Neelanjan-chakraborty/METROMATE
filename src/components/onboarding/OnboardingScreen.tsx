import React, { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { fontFor } from './fonts';
import { Board } from './motion/kit';
import { ob } from './palette';
import type { SceneDef, SceneProps } from './scenes/types';
import type { Language } from '../../i18n/languages';
import type { T } from '../../i18n';

interface Props {
  def: SceneDef;
  index: number;
  active: boolean;
  reduced: boolean;
  pageW: number;
  progress: SceneProps['progress'];
  /** Height reserved at the bottom for the fixed controls. */
  controlsH: number;
  fontsLoaded: boolean;
  lang: Language;
  t: T;
}

/** One page of the walkthrough: the illustration on top, then a rounded sheet with the headline and one sentence. */
export function OnboardingScreen({ def, index, active, reduced, pageW, progress, controlsH, fontsLoaded, lang, t }: Props) {
  const [art, setArt] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setArt({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  // Fit the 360 x 440 artboard to the area. Tall phones may magnify it up to 20% (key artwork stays inside x 30..330, so the
  // sides can crop); it is never narrower than the screen (the artboard has 60 units of overscan each side).
  const scale = art ? Math.max(Math.max(art.w / 360, Math.min(art.h / 440, art.w / 300)), art.w / 480) : 1;
  const Scene = def.Scene;
  const indic = lang !== 'en';
  const titleLH = indic ? 38 : 34;
  return (
    <View style={styles.page}>
      <View style={[styles.art, { backgroundColor: def.sky }]} onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={t(def.art)}>
        {art ? (
          <View style={[styles.artInner, { justifyContent: def.anchor === 'center' ? 'center' : 'flex-end' }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Board scale={scale} pageW={pageW} progress={progress} index={index}>
              <Scene active={active} reduced={reduced} scale={scale} pageW={pageW} progress={progress} index={index} />
            </Board>
          </View>
        ) : null}
      </View>
      <View style={styles.sheet}>
        <Text style={[styles.title, fontFor('extrabold', lang, fontsLoaded), { lineHeight: titleLH, letterSpacing: indic ? 0 : -0.5 }]} accessibilityRole="header">
          {t(def.title)}
        </Text>
        <Text style={[styles.body, fontFor('medium', lang, fontsLoaded), { lineHeight: indic ? 26 : 23 }]}>{t(def.body)}</Text>
        {def.note ? <Text style={[styles.note, fontFor('medium', lang, fontsLoaded), { lineHeight: indic ? 20 : 17 }]}>{t(def.note)}</Text> : null}
        <View style={{ height: controlsH + 10 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { ...StyleSheet.absoluteFill },
  art: { flex: 1, overflow: 'hidden' },
  artInner: { flex: 1, alignItems: 'center' },
  sheet: { marginTop: -26, backgroundColor: ob.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24, paddingHorizontal: 26, alignItems: 'center', shadowColor: ob.violet, shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: -6 }, elevation: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: ob.lavenderDeep },
  title: { fontSize: 29, color: ob.indigo, textAlign: 'center' },
  body: { fontSize: 16.5, color: ob.ink2, textAlign: 'center', marginTop: 8 },
  note: { fontSize: 12.5, color: ob.ink2, textAlign: 'center', marginTop: 10, opacity: 0.85 },
});
