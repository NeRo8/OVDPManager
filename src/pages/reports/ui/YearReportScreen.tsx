import { Fragment } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NbuSourceNote, StaleBondsNotice, WalletGate } from '@/entities/portfolio';
import { usePullToRefresh } from '@/shared/lib';
import { ScreenScrollView, Typography, YearNav } from '@/shared/ui';
import { YEAR_TERMS } from '../model/reportTerms';
import { useYearReport } from '../model/useYearReport.hook';
import { ReportBondHighlights } from './ReportBondHighlights';
import { ReportBondsList } from './ReportBondsList';
import { ReportCaption } from './ReportCaption';
import { ReportMonthsTable } from './ReportMonthsTable';
import { ReportSummary } from './ReportSummary';

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
              <ReportSummary report={report} terms={YEAR_TERMS} />
              <ReportBondHighlights report={report} terms={YEAR_TERMS} />
              <ReportMonthsTable report={report} />
              <ReportBondsList report={report} terms={YEAR_TERMS} />
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
