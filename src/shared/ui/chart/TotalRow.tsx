import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

export type TotalRowProps = {
  label: string;
  value: string;
};

/** The sum of the legend rows above it, its label lined up with theirs. */
export function TotalRow({ label, value }: TotalRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.swatchSpace} />
      <Typography variant="footnote" weight="semibold" style={styles.label}>
        {label}
      </Typography>
      <Typography variant="footnote" weight="semibold" tabular>
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  // The width of a legend row's swatch.
  swatchSpace: { width: 10 },
  label: { flex: 1 },
}));
