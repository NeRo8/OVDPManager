import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice } from '@/entities/portfolio';
import { plural, usePullToRefresh } from '@/shared/lib';
import { Typography } from '@/shared/ui';
import { upcomingPayments } from '../model/upcomingPayments';
import { useFilteredWallet } from '../model/useFilteredWallet.hook';
import { ScheduleSectionList } from './ScheduleSectionList';

/** Payments still ahead, month by month. */
export default function UpcomingPaymentsScreen() {
  const filtered = useFilteredWallet();
  const { wallet, activeFilterCount } = filtered;
  const pullToRefresh = usePullToRefresh(wallet.refresh);
  const { upcoming, allCount, sections } = upcomingPayments(filtered);

  return (
    <ScheduleSectionList
      sections={sections}
      refreshControl={<RefreshControl {...pullToRefresh} />}
      ListHeaderComponent={
        <View style={styles.listHeader}>
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

const styles = StyleSheet.create((theme) => ({
  listHeader: { gap: theme.space.lg, marginBottom: theme.space.sm },
}));
