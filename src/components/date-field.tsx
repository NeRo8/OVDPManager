import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { formatDate, fromISODate, toISODate } from '@/lib/format';
import { useColors } from '@/theme/colors';

type Props = {
  value: string;
  onChange: (isoDate: string) => void;
  maximumDate?: string;
};

export function DateField({ value, onChange, maximumDate }: Props) {
  const colors = useColors();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const max = maximumDate ? fromISODate(maximumDate) : undefined;

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={fromISODate(value)}
        mode="date"
        display="compact"
        locale="uk_UA"
        maximumDate={max}
        onValueChange={(_, date) => onChange(toISODate(date))}
        style={styles.iosPicker}
      />
    );
  }

  // Android shows a dialog that opens on mount, so it is mounted only while picking.
  return (
    <>
      <Pressable
        onPress={() => setDialogOpen(true)}
        style={[styles.button, { backgroundColor: colors.muted }]}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>{formatDate(value)}</Text>
      </Pressable>
      {isDialogOpen && (
        <DateTimePicker
          value={fromISODate(value)}
          mode="date"
          maximumDate={max}
          onValueChange={(_, date) => {
            setDialogOpen(false);
            onChange(toISODate(date));
          }}
          onDismiss={() => setDialogOpen(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  iosPicker: { alignSelf: 'flex-end' },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  buttonText: { fontSize: 17, fontVariant: ['tabular-nums'] },
});
