import type { ReactElement } from 'react';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';

import { type ActiveWallet, CURRENCY_NAMES } from '@/entities/portfolio';

import { SectionCell } from '@/shared/ui';

import type { BondReport, CurrencyReport } from '../model/periodReport';
import type { ReportTerms } from '../model/reportTerms';

import { PeriodFlowsChart } from './PeriodFlowsChart';
import { PeriodSummary } from './PeriodSummary';
import { PeriodYield } from './PeriodYield';
import { ReportBondRow } from './ReportBondRow';
import { ReportList } from './ReportList';
import { ReportListHeader } from './ReportListHeader';
import { ReportMonthsTable } from './ReportMonthsTable';
import { ReportSectionHeader } from './ReportSectionHeader';

/** A currency of the report: its sums head the section, its bonds are the rows. */
type CurrencySection = { report: CurrencyReport; data: BondReport[] };

type Props = {
  wallet: ActiveWallet;
  reports: CurrencyReport[];
  terms: ReportTerms;
  /** What the report covers, above the currencies or the reason there are none */
  heading: ReactElement;
  /** Why there is nothing, in place of the currencies */
  empty: ReactElement;
};

const keyOf = (bond: BondReport) => bond.isin;

/**
 * The year or the period report, every currency apart: its cash flows by month, its sums, its
 * bonds' yield and a table by month head the section, then a row for each bond.
 */
export function CurrencyReportList({ wallet, reports, terms, heading, empty }: Props) {
  const sections = reports.map((report): CurrencySection => ({ report, data: report.bonds }));

  const renderSectionHeader = ({
    section: { report },
  }: {
    section: SectionListData<BondReport, CurrencySection>;
  }) => (
    <ReportSectionHeader rowsTitle={`По ОВДП · ${CURRENCY_NAMES[report.currency]}`}>
      <PeriodFlowsChart report={report} />
      <PeriodSummary report={report} terms={terms} />
      <PeriodYield report={report} terms={terms} />
      <ReportMonthsTable report={report} />
    </ReportSectionHeader>
  );
  const renderItem = ({
    item,
    index,
    section,
  }: SectionListRenderItemInfo<BondReport, CurrencySection>) => (
    <SectionCell index={index} count={section.data.length}>
      <ReportBondRow bond={item} currency={section.report.currency} terms={terms} />
    </SectionCell>
  );

  return (
    <ReportList
      wallet={wallet}
      sections={sections}
      keyExtractor={keyOf}
      ListHeaderComponent={<ReportListHeader>{heading}</ReportListHeader>}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      ListEmptyComponent={empty}
    />
  );
}
