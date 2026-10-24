import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice, WalletGate } from '@/entities/portfolio';
import { filterWallet, reportYears } from '@/features/report-filters';
import { usePullToRefresh } from '@/shared/lib';
import { ScreenScrollView, Typography } from '@/shared/ui';
import { ALL_YEARS_TERMS } from '../model/reportTerms';
import { useYearOverYearReport } from '../model/useYearOverYearReport.hook';
import { yearOverYearReport } from '../model/yearOverYearReport';
import { ReportCaption } from './ReportCaption';
import { ReportFiltersButton } from './ReportFiltersButton';
import { ReportHeading } from './ReportHeading';
import { ReportSummary } from './ReportSummary';
import { YearHighlights } from './YearHighlights';
import { YearsIncomeBars } from './YearsIncomeBars';
import { YearsMoneyChart } from './YearsMoneyChart';
import { YearsFlowsTable } from './YearsFlowsTable';
import { YearsResultsTable } from './YearsResultsTable';

/**
 * Every year of the active plan side by side, with the currency and bonds picked in its filters,
 * every currency apart: all the years summed up, the years that stand out, charts of the money
 * and the income by year (drawn with views, as the report goes to paper), then the money and the
 * results of each year. Everything shows at once, with no taps, so it reads the same on paper.
 */
export default function YearOverYearReportScreen() {
  const { wallet, filters, activeFilterCount } = useYearOverYearReport();
  const filtered = filterWallet(wallet, filters);
  const { firstYear, lastYear } = reportYears(filtered);
  const currencies = yearOverYearReport(filtered);
  const pullToRefresh = usePullToRefresh(wallet.refresh);

  return (
    <WalletGate>
      <ScreenScrollView refreshControl={<RefreshControl {...pullToRefresh} />}>
        <Stack.Screen
          options={{
            headerRight: () => (
              <ReportFiltersButton
                activeFilterCount={activeFilterCount}
                href="/year-over-year-report-filters"
              />
            ),
          }}
        />
        <StaleBondsNotice />
        <ReportHeading
          title={firstYear === lastYear ? String(firstYear) : `${firstYear} – ${lastYear}`}
          subtitle="Від першої купівлі до останньої виплати"
        />
        {currencies.length > 0 ? (
          currencies.map((report) => (
            <Fragment key={report.currency}>
              <ReportSummary report={report.total} terms={ALL_YEARS_TERMS} />
              <YearHighlights report={report} />
              {report.years.length > 1 && (
                <>
                  <YearsMoneyChart report={report} />
                  <YearsIncomeBars report={report} />
                </>
              )}
              <YearsFlowsTable report={report} />
              <YearsResultsTable report={report} />
            </Fragment>
          ))
        ) : (
          <Typography variant="subhead" tone="secondary" align="center">
            Купівель і виплат немає.
          </Typography>
        )}
        <View style={styles.footer}>
          <NbuSourceNote />
          <ReportCaption planName={wallet.plan?.name} date={wallet.today} />
        </View>
      </ScreenScrollView>
    </WalletGate>
  );
}

const styles = StyleSheet.create((theme) => ({
  footer: { gap: theme.space.xxs },
}));
