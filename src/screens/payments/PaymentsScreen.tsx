import { RefreshControl, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote } from '@/components/portfolio/NbuSourceNote';
import { StaleBondsNotice } from '@/components/portfolio/StaleBondsNotice';
import { WalletGate } from '@/components/portfolio/WalletGate';
import { YearNav } from '@/components/YearNav';
import { usePullToRefresh } from '@/hooks/usePullToRefresh.hook';
import { MONTHS } from '@/utils/format';

import { MonthBreakdown } from './MonthBreakdown';
import { ScheduleSectionList } from './ScheduleSectionList';
import { useFilteredWallet } from './useFilteredWallet.hook';
import { useYearSchedule } from './useYearSchedule.hook';
import { yearSeries } from './yearSeries';
import { YearTotals } from './YearTotals';

/**
 * The payments tab, one year at a time: the year's totals, the monthly chart, then the payments
 * and purchases of the month picked on the chart. The header button narrows all of it.
 */
export default function PaymentsScreen() {
  const filtered = useFilteredWallet();
  const { wallet, activeFilterCount } = filtered;
  const pullToRefresh = usePullToRefresh(wallet.refresh);
  const { firstYear, lastYear, year, setYear, types, summary, month, setMonth, sections } =
    useYearSchedule(filtered);
  const isFiltered = activeFilterCount > 0;
  const series = summary ? yearSeries(summary, types) : [];
  const period =
    month === null ? `За ${year} рік` : `За ${MONTHS[month].toLowerCase()} ${year} року`;
  const other = month === null ? 'інший рік' : 'інший місяць на графіку';

  return (
    <WalletGate>
      <ScheduleSectionList
        sections={sections}
        refreshControl={<RefreshControl {...pullToRefresh} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <StaleBondsNotice />
            <YearNav year={year} min={firstYear} max={lastYear} onChange={setYear} />
            {summary && (
              <>
                <YearTotals summary={summary} series={series} />
                {/* Next to the list it controls: a tap on a month lists that month's events. */}
                <MonthBreakdown
                  series={series}
                  currency={summary.currency}
                  year={year}
                  month={month}
                  onSelectMonth={setMonth}
                />
              </>
            )}
          </View>
        }
        empty={
          isFiltered
            ? {
                icon: 'funnel-outline',
                title: 'Нічого не знайдено',
                message: `${period} немає подій, що підходять під фільтри. Змініть фільтри або оберіть ${other}.`,
              }
            : {
                icon: 'calendar-outline',
                title: 'Виплат і купівель немає',
                message: `${period} за планом немає ні виплат купонів і погашень, ні купівель. Оберіть ${other}.`,
              }
        }
        ListFooterComponent={<NbuSourceNote />}
      />
    </WalletGate>
  );
}

const styles = StyleSheet.create((theme) => ({
  listHeader: { gap: theme.space.xl },
}));
