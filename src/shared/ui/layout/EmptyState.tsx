import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';
import { StateMessage } from './StateMessage';

export type EmptyStateProps = {
  title?: string;
  message?: string;
  children?: ReactNode;
};

/** Full-screen placeholder for empty and error states; actions go in `children`. */
export function EmptyState({ title, message, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {title && (
        <Typography variant="title2" align="center">
          {title}
        </Typography>
      )}
      {message && <StateMessage text={message} />}
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
    backgroundColor: theme.background,
  },
  actions: { width: '100%', maxWidth: 400, gap: 8, marginTop: 8 },
}));
