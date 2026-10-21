import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { EmptyState, LoadingState, SegmentedSelect } from '@/shared/ui';
import { usePaymentSchedule } from '../model/usePaymentSchedule.hook';
import { PaymentSectionList } from './PaymentSectionList';
import { ScheduleHeader } from './ScheduleHeader';
import { ScheduleSummary } from './ScheduleSummary';

export default function ScheduleScreen() {
  const schedule = usePaymentSchedule();
  const {
    holdings,
    bonds,
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
    <View style={styles.screen}>
      <ScheduleHeader year={year} min={firstYear} max={lastYear} onChange={setChosenYear} />
      {!bonds && holdings.length > 0 ? (
        <LoadingState />
      ) : holdings.length === 0 ? (
        <EmptyState message="Додайте ОВДП в гаманець, і тут з’явиться графік виплат." />
      ) : (
        <PaymentSectionList
          sections={sections}
          ListHeaderComponent={
            <View style={styles.header}>
              {currencies.length > 1 && (
                <SegmentedSelect
                  options={currencies.map((value) => ({ label: value, value }))}
                  value={currency}
                  onChange={setChosenCurrency}
                />
              )}
              {(yearPayments.length > 0 || yearPurchases.length > 0) && (
                <ScheduleSummary schedule={schedule} />
              )}
            </View>
          }
          emptyMessage={`У ${year} році виплат і покупок немає.`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { gap: 24 },
});
