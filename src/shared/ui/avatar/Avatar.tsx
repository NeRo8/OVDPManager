import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { SERIES_COLORS, type SeriesColor } from '@/shared/theme';
import { Typography } from '../typography/Typography';

const SIZE = 36;

type Props = {
  /** One or two characters, such as a currency sign */
  label: string;
  color: SeriesColor;
};

/**
 * A round badge in a series color with a short label in the middle. Decorative: the row it leads
 * says the same in words.
 */
export function Avatar({ label, color }: Props) {
  return (
    <View style={styles.avatar(color)} accessible={false} importantForAccessibility="no">
      <Typography variant="headline" tone="onAccent" align="center" allowFontScaling={false}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // The text step of the hue, not the chart mark: white on the lighter marks drops below 3:1.
  avatar: (color: SeriesColor) => ({
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme[SERIES_COLORS[color].text],
  }),
}));
