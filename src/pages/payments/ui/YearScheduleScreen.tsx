import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice } from '@/entities/portfolio';
import { SegmentedSelect, YearNav } from '@/shared/ui';
import { useFilteredWallet } from '../model/useFilteredWallet.hook';
import { useYearSchedule } from '../model/useYearSchedule.hook';
import { PaymentSectionList } from './PaymentSectionList';
import { ScheduleSummary } from './ScheduleSummary';

/** One year: money in and out, the monthly chart, then every payment and purchase. */
export default function YearScheduleScreen() {
  const filtered = useFilteredWallet();
  const { wallet } = filtered;
  const schedule = useYearSchedule(filtered);
  const {
    firstYear,
    lastYear,
    year,
    setChosenYear,
    currencies,
    currency,
    setChosenCurrency,
    yearPayments,
    yearPurchases,
    sections,
  } = schedule;

  return (
    <PaymentSectionList
      sections={sections}
      refreshControl={<RefreshControl refreshing={wallet.isFetching} onRefresh={wallet.refresh} />}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <StaleBondsNotice error={wallet.error} />
          <YearNav year={year} min={firstYear} max={lastYear} onChange={setChosenYear} />
          {currencies.length > 1 && (
            <SegmentedSelect
              options={currencies.map((value) => ({ label: value, value }))}
              value={currency}
              onChange={setChosenCurrency}
            />
          )}
          {currency && (yearPayments.length > 0 || yearPurchases.length > 0) && (
            <ScheduleSummary schedule={schedule} />
          )}
        </View>
      }
      emptyMessage={`У ${year} році виплат і покупок немає.`}
      ListFooterComponent={<NbuSourceNote />}
    />
  );
}

const styles = StyleSheet.create({
  listHeader: { gap: 24 },
});
