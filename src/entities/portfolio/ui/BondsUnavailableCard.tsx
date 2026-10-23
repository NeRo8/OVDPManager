import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button, Card, Typography } from '@/shared/ui';
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
      <Card>
        <View style={styles.loading}>
          <ActivityIndicator />
          <Typography variant="subhead" tone="secondary">
            Завантажуємо дані НБУ…
          </Typography>
        </View>
      </Card>
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
  loading: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  action: { marginTop: theme.space.sm },
}));
