import { Stack } from 'expo-router';

import { isScopeOn } from '@/features/report-filters';

import { WalletGate } from '@/entities/portfolio';

import { EmptyState } from '@/shared/ui';

import { periodPdf } from '../model/reportPdf';
import { YEAR_TERMS } from '../model/reportTerms';
import { useReport } from '../model/useReport.hook';
import { yearReport } from '../model/yearReport';

import { CurrencyReportList } from './CurrencyReportList';
import { ReportHeaderActions } from './ReportHeaderActions';
import { ReportHeading } from './ReportHeading';

/**
 * One year of the active plan, with the currency and bonds picked in its filters, every currency
 * apart: the sums, the bonds that stand out, a table by month and what each bond brought.
 * Everything shows at once, with no taps, so it reads the same on paper.
 */
export default function YearReportScreen() {
  const { wallet, narrowed, filters, activeFilterCount } = useReport('year');
  const { year } = filters;
  const currencies = yearReport(narrowed, year);
  const isCurrentYear = year === Number(wallet.today.slice(0, 4));

  return (
    <WalletGate>
      <Stack.Screen
        options={{
          headerRight: () => (
            <ReportHeaderActions
              activeFilterCount={activeFilterCount}
              report="year"
              createDocument={() =>
                periodPdf(
                  'Звіт за рік',
                  String(year),
                  `year-${year}`,
                  wallet,
                  currencies,
                  YEAR_TERMS,
                )
              }
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
          isScopeOn(filters) ? (
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
