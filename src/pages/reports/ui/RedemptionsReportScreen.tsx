import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice, WalletGate } from '@/entities/portfolio';
import { filterWallet } from '@/features/report-filters';
import { usePullToRefresh } from '@/shared/lib';
import { ScreenScrollView, Typography } from '@/shared/ui';
import { redemptionsReport } from '../model/redemptionsReport';
import { useRedemptionsReport } from '../model/useRedemptionsReport.hook';
import { NO_REDEMPTIONS, REDEMPTION_TIME_LABELS } from './redemptionLabels';
import { RedemptionsChart } from './RedemptionsChart';
import { RedemptionsList } from './RedemptionsList';
import { RedemptionsSummary } from './RedemptionsSummary';
import { RedemptionsTable } from './RedemptionsTable';
import { ReportCaption } from './ReportCaption';
import { ReportFiltersButton } from './ReportFiltersButton';
import { ReportHeading } from './ReportHeading';

/**
 * When and how much the active plan's redemptions bring, with the time, currency and bonds picked
 * in its filters, every currency apart: the sums, a chart and a table by year and quarter, then
 * every redemption. Everything shows at once, with no taps, so it reads the same on paper.
 */
export default function RedemptionsReportScreen() {
  const { wallet, filters, activeFilterCount } = useRedemptionsReport();
  const currencies = redemptionsReport(filterWallet(wallet, filters), filters.time);
  const years = currencies.flatMap((report) => report.years.map(({ year }) => year));
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  const pullToRefresh = usePullToRefresh(wallet.refresh);

  return (
    <WalletGate>
      <ScreenScrollView refreshControl={<RefreshControl {...pullToRefresh} />}>
        <Stack.Screen
          options={{
            headerRight: () => (
              <ReportFiltersButton
                activeFilterCount={activeFilterCount}
                href="/redemptions-report-filters"
              />
            ),
          }}
        />
        <StaleBondsNotice />
        {currencies.length > 0 ? (
          <>
            <ReportHeading
              title={firstYear === lastYear ? String(firstYear) : `${firstYear} – ${lastYear}`}
              subtitle={`${REDEMPTION_TIME_LABELS[filters.time]} погашення`}
            />
            {currencies.map((report) => (
              <Fragment key={report.currency}>
                <RedemptionsSummary report={report} />
                <RedemptionsChart report={report} />
                <RedemptionsTable report={report} />
                <RedemptionsList report={report} />
              </Fragment>
            ))}
          </>
        ) : (
          <Typography variant="subhead" tone="secondary" align="center">
            {NO_REDEMPTIONS[filters.time]}
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
