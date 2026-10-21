import { router } from 'expo-router';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BondsUnavailable, NbuSourceNote, StaleBondsNotice } from '@/entities/portfolio';
import { plural } from '@/shared/lib';
import { Button, EmptyState, Typography } from '@/shared/ui';
import { useUpcomingPayments } from '../model/useUpcomingPayments.hook';
import { PaymentSectionList } from './PaymentSectionList';

export default function UpcomingPaymentsScreen() {
  const {
    holdingsCount,
    bonds,
    isFetching,
    error,
    refresh,
    upcoming,
    allCount,
    sections,
    activeFilterCount,
  } = useUpcomingPayments();
  const isFiltered = activeFilterCount > 0;

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
          onPress={() => router.push('/backup/import')}
        />
      </EmptyState>
    );
  }

  if (!bonds) return <BondsUnavailable error={error} onRetry={refresh} />;

  return (
    <PaymentSectionList
      sections={sections}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <StaleBondsNotice error={error} />
          <Typography variant="subhead" tone="secondary" align="center">
            {isFiltered
              ? `Показано виплат: ${upcoming.length} із ${allCount}`
              : `${upcoming.length} ${plural(upcoming.length, 'майбутня виплата', 'майбутні виплати', 'майбутніх виплат')}`}
          </Typography>
        </View>
      }
      emptyMessage={
        isFiltered ? 'За цими фільтрами виплат немає.' : 'Майбутніх виплат за вашими ОВДП немає.'
      }
      ListFooterComponent={<NbuSourceNote />}
    />
  );
}

const styles = StyleSheet.create({
  listHeader: { gap: 18, marginBottom: 6 },
});
