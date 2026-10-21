import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

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
      {message && <Message text={message} />}
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

export type LoadingStateProps = {
  message?: string;
};

/** Full-screen spinner while the screen's data is on its way. */
export function LoadingState({ message }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator />
      {message && <Message text={message} />}
    </View>
  );
}

type MessageProps = {
  text: string;
};

function Message({ text }: MessageProps) {
  return (
    <Typography variant="subhead" tone="secondary" align="center" style={styles.message}>
      {text}
    </Typography>
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
  message: { lineHeight: 21, maxWidth: 400 },
  actions: { width: '100%', maxWidth: 400, gap: 8, marginTop: 8 },
}));
