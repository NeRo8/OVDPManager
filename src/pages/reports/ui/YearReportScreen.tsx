import { Stack } from 'expo-router';

import { WalletGate } from '@/entities/portfolio';
import { countScopeFilters, filterWallet } from '@/features/report-filters';
import { EmptyState } from '@/shared/ui';
import { YEAR_TERMS } from '../model/reportTerms';
import { useYearReport } from '../model/useYearReport.hook';
import { yearReport } from '../model/yearReport';
import { CurrencyReportList } from './CurrencyReportList';
import { ReportFiltersButton } from './ReportFiltersButton';
import { ReportHeading } from './ReportHeading';

/**
 * One year of the active plan, with the currency and bonds picked in its filters, every currency
 * apart: the sums, the bonds that stand out, a table by month and what each bond brought.
 * Everything shows at once, with no taps, so it reads the same on paper.
 */
export default function YearReportScreen() {
  const { wallet, filters, year, activeFilterCount } = useYearReport();
  const currencies = yearReport(filterWallet(wallet, filters), year);
  const isCurrentYear = year === Number(wallet.today.slice(0, 4));

  return (
    <WalletGate>
      <Stack.Screen
        options={{
          headerRight: () => (
            <ReportFiltersButton
              activeFilterCount={activeFilterCount}
              href="/year-report-filters"
            />
          ),
        }}
      />
      <CurrencyReportList
        wallet={wallet}
        reports={currencies}
        terms={YEAR_TERMS}
        heading={
          <ReportHeading title={String(year)} subtitle={isCurrentYear ? 'Цей рік' : undefined} />
        }
        empty={
          countScopeFilters(filters) > 0 ? (
            <EmptyState
              layout="inline"
              icon="funnel-outline"
              title="Купівель і виплат немає"
              message={`Обрані у фільтрах валюта чи ОВДП не мали у ${year} році ні купівель, ні виплат. Змініть їх або оберіть інший рік у фільтрах.`}
            />
          ) : (
            <EmptyState
              layout="inline"
              icon="calendar-outline"
              title="Купівель і виплат немає"
              message={`У ${year} році за планом немає ні купівель, ні виплат купонів і погашень. Оберіть інший рік у фільтрах.`}
            />
          )
        }
      />
    </WalletGate>
  );
}
