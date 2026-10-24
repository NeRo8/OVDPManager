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
  /** Why there is nothing to show, and what would change it */
  message?: string;
  /**
   * `screen` fills a screen of its own; `inline` takes its place in a scrolling screen or a list,
   * under what still shows there (a header, a year, the period)
   */
  layout?: 'screen' | 'inline';
  children?: ReactNode;
};

/** Placeholder for empty and error states; actions go in `children`. */
export function EmptyState({ icon, title, message, layout = 'screen', children }: EmptyStateProps) {
  styles.useVariants({ layout });

  return (
    <View style={styles.container}>
      {icon && (
        <View style={styles.icon}>
          <IconBadge icon={icon} />
        </View>
      )}
      {title && (
        <Typography
          variant={layout === 'screen' ? 'title2' : 'title3'}
          weight={layout === 'inline' ? 'semibold' : undefined}
          align="center"
        >
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    variants: {
      layout: {
        screen: { flex: 1, padding: theme.space.xxl, backgroundColor: theme.background },
        inline: { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.xl },
      },
    },
  },
  icon: { marginBottom: theme.space.md },
  actions: { width: '100%', maxWidth: 400, gap: theme.space.sm, marginTop: theme.space.sm },
}));
