import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

export type SectionTitleProps = {
  title: string;
};

export function SectionTitle({ title }: SectionTitleProps) {
  return (
    <Typography variant="overline" tone="secondary" style={styles.sectionTitle}>
      {title}
    </Typography>
  );
}

const styles = StyleSheet.create((theme) => ({
  sectionTitle: { marginHorizontal: theme.space.lg },
}));
