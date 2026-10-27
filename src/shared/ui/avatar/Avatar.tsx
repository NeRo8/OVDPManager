import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { AppTheme } from '@/shared/theme';
import { Typography } from '../typography/Typography';

const SIZE = 36;

type Props = {
  /** One or two characters, such as a currency sign */
  label: string;
  /** A fill that `accentText` reads on: a series' badge or a currency's color */
  color: keyof AppTheme;
};

/**
 * A round colored badge with a short label in the middle. Decorative: the row it leads
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
  avatar: (color: keyof AppTheme) => ({
    width: SIZE,
    height: SIZE,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme[color],
  }),
}));
