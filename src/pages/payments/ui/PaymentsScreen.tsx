import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice, WalletGate } from '@/entities/portfolio';
import { usePullToRefresh } from '@/shared/lib';
import { SegmentedSelect, Typography, YearNav } from '@/shared/ui';
import { useFilteredWallet } from '../model/useFilteredWallet.hook';
import { useYearSchedule } from '../model/useYearSchedule.hook';
import { describePaymentFilters } from './paymentFilterLabels';
import { ScheduleSectionList } from './ScheduleSectionList';
import { ScheduleSummary } from './ScheduleSummary';

/**
 * The payments tab, one year at a time: the monthly chart, the year's totals, then every payment
 * and purchase. The header button narrows all of it.
 */
export default function PaymentsScreen() {
  const filtered = useFilteredWallet();
  const { wallet, filters, activeFilterCount } = filtered;
  const pullToRefresh = usePullToRefresh(wallet.refresh);
  const {
    firstYear,
    lastYear,
    year,
    setYear,
    types,
    currencies,
    currency,
    setCurrency,
    summary,
    month,
    setMonth,
    sections,
  } = useYearSchedule(filtered);
  const isFiltered = activeFilterCount > 0;

  return (
    <WalletGate>
      <ScheduleSectionList
        sections={sections}
        refreshControl={<RefreshControl {...pullToRefresh} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <StaleBondsNotice />
            <YearNav year={year} min={firstYear} max={lastYear} onChange={setYear} />
            {isFiltered && (
              // The filters in use, as the whole screen shows only what they let through.
              <Typography variant="footnote" tone="secondary" align="center">
                Фільтри: {describePaymentFilters(filters)}
              </Typography>
            )}
            {currency && currencies.length > 1 && (
              <SegmentedSelect
                options={currencies.map((value) => ({ label: value, value }))}
                value={currency}
                onChange={setCurrency}
              />
            )}
            {summary && (
              <ScheduleSummary
                summary={summary}
                types={types}
                year={year}
                month={month}
                onSelectMonth={setMonth}
              />
            )}
          </View>
        }
        emptyMessage={
          isFiltered
            ? `У ${year} році за цими фільтрами нічого немає.`
            : `У ${year} році виплат і купівель немає.`
        }
        ListFooterComponent={<NbuSourceNote />}
      />
    </WalletGate>
  );
}

const styles = StyleSheet.create((theme) => ({
  listHeader: { gap: theme.space.xl },
}));
