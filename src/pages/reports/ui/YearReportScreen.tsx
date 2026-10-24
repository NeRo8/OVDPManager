import { Fragment } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice, WalletGate } from '@/entities/portfolio';
import { usePullToRefresh } from '@/shared/lib';
import { ScreenScrollView, Typography, YearNav } from '@/shared/ui';
import { useYearReport } from '../model/useYearReport.hook';
import { ReportCaption } from './ReportCaption';
import { YearBondHighlights } from './YearBondHighlights';
import { YearBondsList } from './YearBondsList';
import { YearMonthsTable } from './YearMonthsTable';
import { YearSummary } from './YearSummary';

/**
 * One year of the active plan, every currency apart: the sums, the bonds that stand out, a table
 * by month and what each bond brought. Everything shows at once, with no taps or filters, so it reads the same on paper.
 */
export default function YearReportScreen() {
  const { wallet, firstYear, lastYear, year, setYear, currencies } = useYearReport();
  const pullToRefresh = usePullToRefresh(wallet.refresh);

  return (
    <WalletGate>
      <ScreenScrollView refreshControl={<RefreshControl {...pullToRefresh} />}>
        <StaleBondsNotice />
        <YearNav year={year} min={firstYear} max={lastYear} onChange={setYear} />
        {currencies.length > 0 ? (
          currencies.map((report) => (
            <Fragment key={report.currency}>
              <YearSummary report={report} />
              <YearBondHighlights report={report} />
              <YearMonthsTable report={report} />
              <YearBondsList report={report} />
            </Fragment>
          ))
        ) : (
          <Typography variant="subhead" tone="secondary" align="center">
            У {year} році купівель і виплат немає.
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
