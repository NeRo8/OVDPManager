import { Stack } from 'expo-router';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';

import { CURRENCY_NAMES, WalletGate } from '@/entities/portfolio';
import { formatDate } from '@/shared/lib';
import { SectionCell } from '@/shared/ui';
import {
  type CurrencyPortfolio,
  type PortfolioBond,
  portfolioReport,
} from '../model/portfolioReport';
import { useReport } from '../model/useReport.hook';
import { BondStatusEmpty } from './BondStatusEmpty';
import { PORTFOLIO_STATUS_TITLES } from './portfolioLabels';
import { PortfolioBondRow } from './PortfolioBondRow';
import { PortfolioSummary } from './PortfolioSummary';
import { ReportFiltersButton } from './ReportFiltersButton';
import { ReportHeading } from './ReportHeading';
import { ReportList } from './ReportList';
import { ReportListHeader } from './ReportListHeader';
import { ReportSectionHeader } from './ReportSectionHeader';

/** A currency of the report: its sums head the section, its bonds are the rows. */
type CurrencySection = { report: CurrencyPortfolio; data: PortfolioBond[] };

const keyOf = (bond: PortfolioBond) => bond.isin;

/**
 * Every bond of the active plan's wallet held to maturity, with the status, currency and bonds
 * picked in its filters, every currency apart: the sums, then each bond's cost, payments and net
 * income. Everything shows at once, with no taps, so it reads the same on paper.
 */
export default function PortfolioReportScreen() {
  const { wallet, narrowed, filters, activeFilterCount } = useReport('portfolio');
  const currencies = portfolioReport(narrowed, filters.status);
  const sections = currencies.map((report): CurrencySection => ({ report, data: report.bonds }));

  const renderSectionHeader = ({
    section: { report },
  }: {
    section: SectionListData<PortfolioBond, CurrencySection>;
  }) => (
    <ReportSectionHeader rowsTitle={`По ОВДП · ${CURRENCY_NAMES[report.currency]}`}>
      <PortfolioSummary report={report} />
    </ReportSectionHeader>
  );
  const renderItem = ({
    item,
    index,
    section,
  }: SectionListRenderItemInfo<PortfolioBond, CurrencySection>) => (
    <SectionCell index={index} count={section.data.length}>
      <PortfolioBondRow bond={item} currency={section.report.currency} />
    </SectionCell>
  );

  return (
    <WalletGate>
      <Stack.Screen
        options={{
          headerRight: () => (
            <ReportFiltersButton activeFilterCount={activeFilterCount} report="portfolio" />
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
