import type { ReactNode } from 'react';

import { Typography } from '../typography/Typography';
import { StyleSheet } from 'react-native-unistyles';

export type SectionTextProps = {
  children: ReactNode;
};

/** A paragraph filling a section card. */
export function SectionText({ children }: SectionTextProps) {
  return (
    <Typography variant="subhead" style={styles.text}>
      {children}
    </Typography>
  );
}

const styles = StyleSheet.create((theme) => ({
  text: { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, lineHeight: 21 },
}));
