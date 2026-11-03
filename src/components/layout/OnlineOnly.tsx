import type { ReactNode } from 'react';

import { Typography } from '@/components/typography/Typography';
import { useIsOnline } from '@/hooks/useIsOnline.hook';

type Props = {
  /** What is missing without the internet and when it comes back, in place of `children` */
  offlineMessage: string;
  /** What needs the internet; not mounted without it, so it starts no request */
  children: ReactNode;
};

/**
 * What needs the internet, such as the cloud backup: shown only while the device is online.
 * Without a connection a line in place of it says why it is gone; it comes back by itself.
 */
export function OnlineOnly({ offlineMessage, children }: Props) {
  if (useIsOnline()) return children;
  return (
    <Typography variant="caption1" tone="warning" align="center" accessibilityLiveRegion="polite">
      {offlineMessage}
    </Typography>
  );
}
