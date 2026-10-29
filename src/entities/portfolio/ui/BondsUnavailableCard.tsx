import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button, Card, SkeletonCard, SkeletonGroup, Typography } from '@/shared/ui';
import { useBonds } from '../api/useBonds.hook';

/**
 * In place of what needs the NBU data, on a screen that shows the rest without it: the data
 * loading, or why it could not load with a retry. Nothing once there is data.
 */
export function BondsUnavailableCard() {
  const { bonds, error, refresh } = useBonds();
  const retry = () => void refresh();

  if (bonds) return null;
  if (!error) {
    return (
      <SkeletonGroup label="Завантажуємо дані НБУ…">
        <SkeletonCard />
      </SkeletonGroup>
    );
  }
  return (
    <Card>
      <Typography variant="headline">Немає зв’язку з НБУ</Typography>
      <Typography variant="subhead" tone="secondary">
        {error}
      </Typography>
      <View style={styles.action}>
        <Button title="Спробувати ще раз" onPress={retry} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  action: { marginTop: theme.space.sm },
}));
