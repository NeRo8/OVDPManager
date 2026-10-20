import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { formatDate, fromISODate, toISODate } from '@/shared/lib';
import { themeStyles } from '@/shared/theme';
import { Typography } from '../typography/Typography';

type Props = {
  value: string;
  onChange: (isoDate: string) => void;
  maximumDate?: string;
};

export function DateField({ value, onChange, maximumDate }: Props) {
  const theme = themeStyles;
  const date = fromISODate(value);
  const max = maximumDate ? fromISODate(maximumDate) : undefined;

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={date}
        mode="date"
        display="compact"
        maximumDate={max}
        onValueChange={(_, date) => onChange(toISODate(date))}
        style={styles.iosPicker}
      />
    );
  }

  return (
    <Pressable
      onPress={() =>
        DateTimePickerAndroid.open({
          value: date,
          mode: 'date',
          maximumDate: max,
          onValueChange: (_, selectedDate) => onChange(toISODate(selectedDate)),
        })
      }
      style={[styles.button, theme.muted]}
      accessibilityRole="button"
    >
      <Typography tabular>{formatDate(value)}</Typography>
    </Pressable>
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
});
