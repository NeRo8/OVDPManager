import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { themeStyles } from '@/shared/theme';
import { YearNav } from '@/shared/ui';

/** Tab header of the schedule: the year switcher takes the place of the title. */
export function ScheduleHeader(props: ComponentProps<typeof YearNav>) {
  const theme = themeStyles;
  const insets = useSafeAreaInsets();
  return (
    <View style={[theme.card, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <YearNav {...props} />
      </View>
      <View style={[styles.border, theme.borderBackground]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 44, paddingVertical: 4, justifyContent: 'center' },
  border: { height: StyleSheet.hairlineWidth },
});
