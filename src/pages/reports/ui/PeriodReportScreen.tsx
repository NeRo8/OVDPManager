import { Stack } from 'expo-router';

import { WalletGate } from '@/entities/portfolio';
import { isScopeOn } from '@/features/report-filters';
import { EmptyState } from '@/shared/ui';
import { periodReport } from '../model/periodReport';
import { periodPdf } from '../model/reportPdf';
import { PERIOD_TERMS } from '../model/reportTerms';
import { useReport } from '../model/useReport.hook';
import { CurrencyReportList } from './CurrencyReportList';
import { PERIOD_LABELS, formatPeriod } from './periodLabels';
import { ReportHeaderActions } from './ReportHeaderActions';
import { ReportHeading } from './ReportHeading';

/**
 * The active plan over the period and the currency and bonds picked in its filters, every currency
 * apart, laid out as the year report: the sums, the bonds that stand out, a table by month and
 * what each bond brought.
 */
export default function PeriodReportScreen() {
  const { wallet, narrowed, filters, activeFilterCount } = useReport('period');
  const { dates: period } = filters;
  const currencies = periodReport(narrowed, period.from, period.to);

  return (
    <WalletGate>
      <Stack.Screen
        options={{
          headerRight: () => (
            <ReportHeaderActions
              activeFilterCount={activeFilterCount}
              report="period"
              createDocument={() =>
                periodPdf(
                  'Звіт за період',
                  formatPeriod(period),
                  'period',
                  wallet,
                  currencies,
                  PERIOD_TERMS,
                )
              }
            />
          ),
        }}
      />
      <CurrencyReportList
        wallet={wallet}
        reports={currencies}
        terms={PERIOD_TERMS}
        heading={
          <ReportHeading
            title={formatPeriod(period)}
            subtitle={filters.period === 'custom' ? undefined : PERIOD_LABELS[filters.period]}
          />
        }
        empty={
          isScopeOn(filters) ? (
            <EmptyState
              layout="inline"
              icon="funnel-outline"
              title="Купівель і виплат немає"
              message="Обрані у фільтрах валюта чи ОВДП не мали за цей період ні купівель, ні виплат. Змініть їх або оберіть довший період у фільтрах."
            />
          ) : (
            <EmptyState
              layout="inline"
              icon="calendar-outline"
              title="Купівель і виплат немає"
              message="За цей період за планом немає ні купівель, ні виплат купонів і погашень. Оберіть інший період у фільтрах."
            />
          )
        }
      />
    </WalletGate>
  );
}
