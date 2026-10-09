import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, ArrowLeftRight, Trash2 } from 'lucide-react-native';
import { colors, space, type } from '../theme';
import { IconButton } from './ui';

interface Props {
  fromName: string;
  toName: string;
  onOpen: () => void;
  onReverse?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}

export function JourneyRow({ fromName, toName, onOpen, onReverse, onRemove, removeLabel = 'Remove' }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open journey from ${fromName} to ${toName}`}
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
      {onReverse ? <IconButton icon={ArrowLeftRight} label={`Reverse: ${toName} to ${fromName}`} onPress={onReverse} /> : null}
      {onRemove ? <IconButton icon={Trash2} label={`${removeLabel} ${fromName} to ${toName}`} onPress={onRemove} color={colors.destination} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 60 },
  main: { flex: 1, paddingVertical: space.sm, gap: 2 },
  arrowLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
