import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { SERIES_COLORS, type SeriesColor } from '@/shared/theme';

export type SwatchProps = {
  color: SeriesColor;
};

/** Color mark of a chart series, also beside list rows of the same kind. */
export function Swatch({ color }: SwatchProps) {
  return <View style={styles.swatch(color)} />;
}

const styles = StyleSheet.create((theme) => ({
  swatch: (color: SeriesColor) => ({
    width: 10,
    height: 10,
    borderRadius: theme.radius.xs,
    backgroundColor: theme[SERIES_COLORS[color].mark],
  }),
}));
