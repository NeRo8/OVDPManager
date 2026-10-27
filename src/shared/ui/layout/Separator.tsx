import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  /**
   * `row` parts the rows of a section card from the text inset; `card` splits a padded Card's
   * parts from its edge with room above and below, `table` with less room, between table rows.
   */
  variant?: 'row' | 'card' | 'table';
};

export function Separator({ variant = 'row' }: Props) {
  styles.useVariants({ variant });
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create((theme) => ({
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.border,
    variants: {
      variant: {
        row: { marginLeft: theme.space.lg },
        card: { marginVertical: theme.space.md },
        table: { marginVertical: theme.space.xs },
      },
    },
  },
}));
