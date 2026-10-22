import { Typography } from '../typography/Typography';
import { StyleSheet } from 'react-native-unistyles';

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
