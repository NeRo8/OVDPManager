import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { themeStyles } from '@/shared/theme';
import { Typography } from '../typography/Typography';

/** Full-screen placeholder for empty, error and loading states; actions go in `children`. */
export function EmptyState({
  title,
  message,
  loading,
  children,
}: {
  title?: string;
  message?: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  const theme = themeStyles;
  return (
    <View style={[styles.container, theme.background]}>
      {loading && <ActivityIndicator />}
      {title && (
        <Typography variant="title2" align="center">
          {title}
        </Typography>
      )}
      {message && (
        <Typography variant="subhead" tone="secondary" align="center" style={styles.message}>
          {message}
        </Typography>
      )}
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  message: { lineHeight: 21, maxWidth: 400 },
  actions: { width: '100%', maxWidth: 400, gap: 8, marginTop: 8 },
});
