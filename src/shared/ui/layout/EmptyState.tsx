import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { IconBadge } from '../icon/IconBadge';
import type { IconName } from '../icon/ThemedIcon';
import { Typography } from '../typography/Typography';
import { StateMessage } from './StateMessage';

export type EmptyStateProps = {
  /** Illustrates the state above the title */
  icon?: IconName;
  title?: string;
  message?: string;
  children?: ReactNode;
};

/** Full-screen placeholder for empty and error states; actions go in `children`. */
export function EmptyState({ icon, title, message, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && (
        <View style={styles.icon}>
          <IconBadge icon={icon} />
        </View>
      )}
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
    padding: theme.space.xxl,
    gap: theme.space.sm,
    backgroundColor: theme.background,
  },
  icon: { marginBottom: theme.space.md },
  actions: { width: '100%', maxWidth: 400, gap: theme.space.sm, marginTop: theme.space.sm },
}));
