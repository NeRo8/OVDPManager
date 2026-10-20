import { router } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { plural } from '@/shared/lib';
import { Button, EmptyState, Typography } from '@/shared/ui';
import { useUpcomingPayments } from '../model/useUpcomingPayments.hook';
import { PaymentSectionList } from './PaymentSectionList';

export default function UpcomingPaymentsScreen() {
  const { holdingsCount, bonds, isFetching, error, refresh, upcoming, sections } =
    useUpcomingPayments();

  if (holdingsCount === 0) {
    return (
      <EmptyState
        title="Поки немає виплат"
        message="Додайте ОВДП або відновіть гаманець із резервної копії."
      >
        <Button title="Додати ОВДП" onPress={() => router.push('/add')} />
        <Button
          title="Відновити з копії"
          variant="secondary"
          onPress={() => router.navigate('/backup')}
        />
      </EmptyState>
    );
  }

  if (!bonds) {
    if (!error) return <EmptyState loading />;
    return (
      <EmptyState title="Немає зв’язку з НБУ" message={error}>
        <Button title="Спробувати ще раз" onPress={refresh} />
      </EmptyState>
    );
  }

  return (
    <PaymentSectionList
      sections={sections}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          {error && (
            <Typography variant="caption1" tone="danger" align="center">
              Не вдалося оновити дані НБУ — показано збережені.
            </Typography>
          )}
          <Typography variant="subhead" tone="secondary" align="center">
            {upcoming.length}{' '}
            {plural(upcoming.length, 'майбутня виплата', 'майбутні виплати', 'майбутніх виплат')}
          </Typography>
        </View>
      }
      ListEmptyComponent={
        <Typography variant="subhead" tone="secondary" align="center" style={styles.emptyList}>
          Майбутніх виплат за вашими ОВДП немає.
        </Typography>
      }
      ListFooterComponent={
        <Typography variant="caption2" tone="secondary" align="center" style={styles.source}>
          Графік виплат — з депозитарію НБУ. Потягніть донизу, щоб оновити.
        </Typography>
      }
    />
  );
}

const styles = StyleSheet.create({
  listHeader: { gap: 18, marginBottom: 6 },
  emptyList: { marginTop: 28 },
  source: { marginTop: 24 },
});
