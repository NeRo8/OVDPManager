import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '@/shared/ui';

/** Footer of pull-to-refresh lists built on NBU data. */
export function NbuSourceNote() {
  return (
    <Typography variant="caption2" tone="secondary" align="center" style={styles.source}>
      Графіки виплат — з депозитарію НБУ. Потягніть донизу, щоб оновити.
    </Typography>
  );
}

const styles = StyleSheet.create((theme) => ({
  source: { marginTop: theme.space.xl },
}));
