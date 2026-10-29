import type { SectionListData, SectionListRenderItemInfo } from 'react-native';

import { Stack } from 'expo-router';

import { CURRENCY_NAMES, WalletGate } from '@/entities/portfolio';

import { formatDate } from '@/shared/lib';
import { SectionCell } from '@/shared/ui';

import { yieldPdf } from '../model/reportPdf';
import { useYieldReport } from '../model/useYieldReport.hook';
import { type CurrencyYield, type YieldBond, yieldReport } from '../model/yieldReport';

import { BondStatusEmpty } from './BondStatusEmpty';
import { PORTFOLIO_STATUS_TITLES } from './portfolioLabels';
import { ReportHeaderActions } from './ReportHeaderActions';
import { ReportHeading } from './ReportHeading';
import { ReportList } from './ReportList';
import { ReportListHeader } from './ReportListHeader';
import { ReportSectionHeader } from './ReportSectionHeader';
import { YieldBondChart } from './YieldBondChart';
import { YieldBondRow } from './YieldBondRow';
import { YieldComparison } from './YieldComparison';
import { YieldSummary } from './YieldSummary';

/** A currency of the report: its average yield heads the section, its bonds are the rows. */
type CurrencySection = { report: CurrencyYield; data: YieldBond[]; highestYield: number };

const keyOf = (bond: YieldBond) => bond.isin;

/**
 * The yield of the active plan's bonds held to maturity next to the NBU key rate, with the status,
 * currency and bonds picked in its filters, every currency apart: the average, then each bond's,
 * the highest first. Everything shows at once, with no taps, so it reads the same on paper.
 */
export default function YieldReportScreen() {
  const { wallet, narrowed, filters, keyRateOn, activeFilterCount } = useYieldReport();
  const currencies = yieldReport(narrowed, filters.status, keyRateOn);
  const sections = currencies.map((report): CurrencySection => ({
    report,
    data: report.bonds,
    highestYield: Math.max(0, ...report.bonds.map(({ annualYield }) => annualYield ?? 0)),
  }));

  const renderSectionHeader = ({
    section: { report },
  }: {
    section: SectionListData<YieldBond, CurrencySection>;
  }) => (
    <ReportSectionHeader rowsTitle={`По ОВДП · ${CURRENCY_NAMES[report.currency]}`}>
      <YieldSummary report={report} />
      {report.averageYield !== null && report.keyRate !== null && (
        <YieldComparison
          currency={report.currency}
          averageYield={report.averageYield}
          keyRate={report.keyRate}
        />
      )}
      <YieldBondChart report={report} />
    </ReportSectionHeader>
  );
  const renderItem = ({
    item,
    index,
    section,
  }: SectionListRenderItemInfo<YieldBond, CurrencySection>) => (
    <SectionCell index={index} count={section.data.length}>
      <YieldBondRow
        bond={item}
        currency={section.report.currency}
        highestYield={section.highestYield}
      />
    </SectionCell>
  );

  return (
    <WalletGate>
      <Stack.Screen
        options={{
          headerRight: () => (
            <ReportHeaderActions
              activeFilterCount={activeFilterCount}
              report="yield"
              createDocument={() =>
                yieldPdf(wallet, PORTFOLIO_STATUS_TITLES[filters.status], currencies)
              }
            />
          ),
        }}
      />
      <ReportList
        wallet={wallet}
        sections={sections}
        keyExtractor={keyOf}
        ListHeaderComponent={
          <ReportListHeader>
            <ReportHeading
              title={`Станом на ${formatDate(wallet.today)}`}
              subtitle={PORTFOLIO_STATUS_TITLES[filters.status]}
            />
          </ReportListHeader>
        }
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        ListEmptyComponent={<BondStatusEmpty wallet={narrowed} status={filters.status} />}
      />
    </WalletGate>
  );
}
