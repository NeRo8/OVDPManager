import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '@/shared/ui';

type Props = {
  /** The year or the dates the report covers */
  title: string;
  subtitle?: string;
};

/** What the report covers, at its top, so it reads so on paper too. */
export function ReportHeading({ title, subtitle }: Props) {
  return (
    <View style={styles.heading}>
      <Typography variant="title2" weight="semibold" tabular align="center">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="subhead" tone="secondary" align="center">
          {subtitle}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  heading: { gap: theme.space.xxs },
}));
