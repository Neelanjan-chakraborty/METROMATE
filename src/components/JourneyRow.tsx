import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, ArrowLeftRight, Trash2 } from 'lucide-react-native';
import { colors, space, type } from '../theme';
import { IconButton } from './ui';
import { useT } from '../i18n/useT';

interface Props {
  fromName: string;
  toName: string;
  onOpen: () => void;
  onReverse?: () => void;
  onRemove?: () => void;
  /** The verb for the remove button's accessibility label; defaults to "Remove". */
  removeLabel?: string;
}

export function JourneyRow({ fromName, toName, onOpen, onReverse, onRemove, removeLabel }: Props) {
  const { t } = useT();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('saved.row.open.a11y', { from: fromName, to: toName })}
        onPress={onOpen}
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}
      >
        <Text style={type.h3} numberOfLines={1}>
          {fromName}
        </Text>
        <View style={styles.arrowLine}>
          <ArrowRight size={14} color={colors.faint} />
          <Text style={[type.body, { flexShrink: 1 }]} numberOfLines={1}>
            {toName}
          </Text>
        </View>
      </Pressable>
      {onReverse ? <IconButton icon={ArrowLeftRight} label={t('saved.row.reverse.a11y', { from: fromName, to: toName })} onPress={onReverse} /> : null}
      {onRemove ? <IconButton icon={Trash2} label={t('saved.row.remove.a11y', { label: removeLabel ?? t('saved.row.remove'), from: fromName, to: toName })} onPress={onRemove} color={colors.destination} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 60 },
  main: { flex: 1, paddingVertical: space.sm, gap: 2 },
  arrowLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
