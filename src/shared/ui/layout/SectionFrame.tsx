import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';
import { SectionTitle } from './SectionTitle';

export type SectionFrameProps = {
  title?: string;
  /** Explains the card under it; a string is set as secondary text */
  footer?: ReactNode;
};

type Props = SectionFrameProps & { children: ReactNode };

/** The title over a card and the footer under it, shared by Section and Card. */
export function SectionFrame({ title, footer, children }: Props) {
  if (!title && !footer) return children;

  return (
    <View style={styles.frame}>
      {title && <SectionTitle title={title} />}
      {children}
      {footer && (
        <Typography variant="caption1" tone="secondary" style={styles.footer}>
          {footer}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  frame: { gap: theme.space.sm },
  footer: { lineHeight: 18, marginHorizontal: theme.space.lg },
}));
