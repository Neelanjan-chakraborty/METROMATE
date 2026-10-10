import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Languages } from 'lucide-react-native';
import { LANGUAGES, languageInfo } from '../i18n/languages';
import { useT } from '../i18n/useT';
import { colors, radius, space } from '../theme';

/** Title in all three languages, so someone who cannot read the current one can still find the way. */
const TRILINGUAL_TITLE = 'Language · भाषा · ભાષા';

/** The language sheet: three options, each in its own script. */
export function LanguageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, lang, setLanguage } = useT();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} accessibilityRole="button" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }]}>
        <Text style={styles.title} accessibilityRole="header">
          {TRILINGUAL_TITLE}
        </Text>
        {LANGUAGES.map((l) => {
          const on = l.id === lang;
          return (
            <Pressable
              key={l.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, checked: on }}
              accessibilityLabel={t(on ? 'common.language.option.a11y' : 'common.language.optionOff.a11y', { language: l.native })}
              onPress={() => {
                void setLanguage(l.id);
                onClose();
              }}
              style={({ pressed }) => [styles.row, on && styles.rowOn, pressed && { opacity: 0.85 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.native, on && { color: colors.primary }]}>{l.native}</Text>
                {l.id !== 'en' ? <Text style={styles.english}>{l.english}</Text> : null}
              </View>
              {on ? <Check size={22} color={colors.primary} strokeWidth={2.4} /> : null}
            </Pressable>
          );
        })}
        <Text style={styles.note}>{t('common.language.note')}</Text>
      </View>
    </Modal>
  );
}

/** A small round button showing the current language's code; opens the sheet. */
export function LanguageButton({ size = 36, tint = colors.primary, background = 'rgba(255,255,255,0.85)' }: { size?: number; tint?: string; background?: string }) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const info = languageInfo(lang);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.language.a11y', { language: info.native })}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.btn, { width: size, height: size, borderRadius: size / 2, backgroundColor: background, opacity: pressed ? 0.8 : 1 }]}
      >
        <Languages size={size * 0.42} color={tint} strokeWidth={2} />
        <Text style={[styles.code, { color: tint, fontSize: size * 0.28 }]}>{info.short}</Text>
      </Pressable>
      <LanguageSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,26,50,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg, gap: space.sm, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: space.lg, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  native: { fontSize: 18, fontWeight: '700', color: colors.text },
  english: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
  note: { fontSize: 12.5, lineHeight: 18, color: colors.muted, marginTop: space.xs },
  btn: { alignItems: 'center', justifyContent: 'center', gap: 0 },
  code: { fontWeight: '800', marginTop: -1 },
});
