import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice } from '@/entities/portfolio';
import { usePullToRefresh } from '@/shared/lib';
import { SegmentedSelect, YearNav } from '@/shared/ui';
import { useFilteredWallet } from '../model/useFilteredWallet.hook';
import { useYearSchedule } from '../model/useYearSchedule.hook';
import { ScheduleSectionList } from './ScheduleSectionList';
import { ScheduleSummary } from './ScheduleSummary';

/** One year: the monthly chart, the year's totals, then every payment and purchase. */
export default function YearScheduleScreen() {
  const filtered = useFilteredWallet();
  const { wallet } = filtered;
  const pullToRefresh = usePullToRefresh(wallet.refresh);
  const {
    firstYear,
    lastYear,
    year,
    setYear,
    currencies,
    currency,
    setCurrency,
    summary,
    month,
    setMonth,
    sections,
  } = useYearSchedule(filtered);

  return (
    <ScheduleSectionList
      sections={sections}
      refreshControl={<RefreshControl {...pullToRefresh} />}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <StaleBondsNotice />
          <YearNav year={year} min={firstYear} max={lastYear} onChange={setYear} />
          {currency && currencies.length > 1 && (
            <SegmentedSelect
              options={currencies.map((value) => ({ label: value, value }))}
              value={currency}
              onChange={setCurrency}
            />
          )}
          {summary && (
            <ScheduleSummary summary={summary} year={year} month={month} onSelectMonth={setMonth} />
          )}
        </View>
      }
      emptyMessage={`У ${year} році виплат і купівель немає.`}
      ListFooterComponent={<NbuSourceNote />}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  listHeader: { gap: theme.space.xl },
}));
