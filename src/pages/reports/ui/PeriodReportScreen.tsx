import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice, WalletGate } from '@/entities/portfolio';
import { filterWallet } from '@/features/report-filters';
import { usePullToRefresh } from '@/shared/lib';
import { ScreenScrollView, Typography } from '@/shared/ui';
import { periodReport } from '../model/periodReport';
import { PERIOD_TERMS } from '../model/reportTerms';
import { useReportPeriod } from '../model/useReportPeriod.hook';
import { PERIOD_LABELS, formatPeriod } from './periodLabels';
import { ReportBondHighlights } from './ReportBondHighlights';
import { ReportBondsList } from './ReportBondsList';
import { ReportCaption } from './ReportCaption';
import { ReportFiltersButton } from './ReportFiltersButton';
import { ReportHeading } from './ReportHeading';
import { ReportMonthsTable } from './ReportMonthsTable';
import { ReportSummary } from './ReportSummary';

/**
 * The active plan over the period and the currency and bonds picked in its filters, every currency
 * apart, laid out as the year report: the sums, the bonds that stand out, a table by month and
 * what each bond brought.
 */
export default function PeriodReportScreen() {
  const { wallet, filters, period, activeFilterCount } = useReportPeriod();
  const currencies = periodReport(filterWallet(wallet, filters), period.from, period.to);
  const pullToRefresh = usePullToRefresh(wallet.refresh);

  return (
    <WalletGate>
      <ScreenScrollView refreshControl={<RefreshControl {...pullToRefresh} />}>
        <Stack.Screen
          options={{
            headerRight: () => (
              <ReportFiltersButton
                activeFilterCount={activeFilterCount}
                href="/period-report-filters"
              />
            ),
          }}
        />
        <StaleBondsNotice />
        <ReportHeading
          title={formatPeriod(period)}
          subtitle={filters.period === 'custom' ? undefined : PERIOD_LABELS[filters.period]}
        />
        {currencies.length > 0 ? (
          currencies.map((report) => (
            <Fragment key={report.currency}>
              <ReportSummary report={report} terms={PERIOD_TERMS} />
              <ReportBondHighlights report={report} terms={PERIOD_TERMS} />
              <ReportMonthsTable report={report} />
              <ReportBondsList report={report} terms={PERIOD_TERMS} />
            </Fragment>
          ))
        ) : (
          <Typography variant="subhead" tone="secondary" align="center">
            За цей період купівель і виплат немає.
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
