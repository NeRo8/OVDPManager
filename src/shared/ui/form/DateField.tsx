import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatDate, fromISODate, toISODate } from '@/shared/lib';
import { Typography } from '../typography/Typography';

type Props = {
  value: string;
  onChange: (isoDate: string) => void;
  maximumDate?: string;
};

export function DateField({ value, onChange, maximumDate }: Props) {
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
      style={styles.button}
      accessibilityRole="button"
    >
      <Typography tabular>{formatDate(value)}</Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  iosPicker: { alignSelf: 'flex-end' },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: theme.muted,
  },
}));
