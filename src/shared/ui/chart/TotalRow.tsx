import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { SignedValue } from '../typography/SignedValue';
import { Typography } from '../typography/Typography';

export type TotalRowProps = {
  label: string;
  value: string;
  /** When present, the numeric result determines the value color. */
  signedValue?: number;
};

/** The sum of the legend rows above it, its label lined up with theirs. */
export function TotalRow({ label, value, signedValue }: TotalRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.swatchSpace} />
      <Typography variant="footnote" weight="semibold" style={styles.label}>
        {label}
      </Typography>
      {signedValue === undefined ? (
        <Typography variant="footnote" weight="semibold" tabular>
          {value}
        </Typography>
      ) : (
        <SignedValue value={signedValue} variant="footnote" weight="semibold" tabular>
          {value}
        </SignedValue>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  // The width of a legend row's swatch.
  swatchSpace: { width: 10 },
  label: { flex: 1 },
}));
