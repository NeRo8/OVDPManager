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

  const changeDate = (_: unknown, selectedDate: Date) => onChange(toISODate(selectedDate));

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={date}
        mode="date"
        display="compact"
        maximumDate={max}
        onValueChange={changeDate}
        style={styles.iosPicker}
      />
    );
  }

  const openPicker = () =>
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      maximumDate: max,
      onValueChange: changeDate,
    });

  return (
    <Pressable onPress={openPicker} style={styles.button} accessibilityRole="button">
      <Typography tabular>{formatDate(value)}</Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  iosPicker: { alignSelf: 'flex-end' },
  button: {
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    backgroundColor: theme.muted,
  },
}));
