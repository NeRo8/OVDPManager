import type { ReactNode } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice } from '@/entities/portfolio';
import { plural } from '@/shared/lib';
import { Typography } from '@/shared/ui';
import { upcomingPayments } from '../model/upcomingPayments';
import type { FilteredWallet } from '../model/useFilteredWallet.hook';
import { PaymentSectionList } from './PaymentSectionList';

type Props = {
  filtered: FilteredWallet;
  /** Rendered above the list content: the mode switch of the payments screen */
  header: ReactNode;
};

/** Payments still ahead, month by month. */
export function UpcomingPaymentsList({ filtered, header }: Props) {
  const { wallet, activeFilterCount } = filtered;
  const { upcoming, allCount, sections } = upcomingPayments(filtered);

  return (
    <PaymentSectionList
      sections={sections}
      refreshControl={<RefreshControl refreshing={wallet.isFetching} onRefresh={wallet.refresh} />}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          {header}
          <StaleBondsNotice error={wallet.error} />
          <Typography variant="subhead" tone="secondary" align="center">
            {activeFilterCount > 0
              ? `Показано виплат: ${upcoming.length} із ${allCount}`
              : `${upcoming.length} ${plural(upcoming.length, 'майбутня виплата', 'майбутні виплати', 'майбутніх виплат')}`}
          </Typography>
        </View>
      }
      emptyMessage={
        activeFilterCount > 0
          ? 'За цими фільтрами виплат немає.'
          : 'Майбутніх виплат за вашими ОВДП немає.'
      }
      ListFooterComponent={<NbuSourceNote />}
    />
  );
}

const styles = StyleSheet.create({
  listHeader: { gap: 18, marginBottom: 6 },
});
