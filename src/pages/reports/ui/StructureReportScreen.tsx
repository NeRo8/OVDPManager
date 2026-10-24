import { Stack } from 'expo-router';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES, WalletGate } from '@/entities/portfolio';
import { formatDate } from '@/shared/lib';
import { SectionCell, Typography } from '@/shared/ui';
import {
  type CurrencyStructure,
  type StructureBond,
  structureReport,
} from '../model/structureReport';
import { useReport } from '../model/useReport.hook';
import { ReportFiltersButton } from './ReportFiltersButton';
import { ReportHeading } from './ReportHeading';
import { ReportList } from './ReportList';
import { ReportListHeader } from './ReportListHeader';
import { ReportSectionHeader } from './ReportSectionHeader';
import { StructureBondRow } from './StructureBondRow';
import { StructureCurrencies } from './StructureCurrencies';
import { StructureEmpty } from './StructureEmpty';
import { STRUCTURE_PURCHASES_TITLES } from './structureLabels';
import { StructureSummary } from './StructureSummary';
import { StructureTerms } from './StructureTerms';

/** A currency of the report: its split by term heads the section, its bonds are the rows. */
type CurrencySection = { report: CurrencyStructure; data: StructureBond[] };

const keyOf = (bond: StructureBond) => bond.isin;

/**
 * How the money in the active plan's bonds still in circulation splits up, with the purchases,
 * currency and bonds picked in its filters: by currency, then in each currency by time left to
 * maturity and by bond. Everything shows at once, with no taps, so it reads the same on paper.
 */
export default function StructureReportScreen() {
  const { wallet, narrowed, filters, activeFilterCount } = useReport('structure');
  const { currencies, unknownCount } = structureReport(narrowed, filters.purchases);
  const sections = currencies.map((report): CurrencySection => ({ report, data: report.bonds }));

  const renderSectionHeader = ({
    section: { report },
  }: {
    section: SectionListData<StructureBond, CurrencySection>;
  }) => (
    <ReportSectionHeader rowsTitle={`За ОВДП · ${CURRENCY_NAMES[report.currency]}`}>
      <StructureSummary report={report} today={wallet.today} />
      <StructureTerms report={report} />
    </ReportSectionHeader>
  );
  const renderItem = ({
    item,
    index,
    section,
  }: SectionListRenderItemInfo<StructureBond, CurrencySection>) => (
    <SectionCell index={index} count={section.data.length}>
      <StructureBondRow bond={item} currency={section.report.currency} today={wallet.today} />
    </SectionCell>
  );

  return (
    <WalletGate>
      <Stack.Screen
        options={{
          headerRight: () => (
            <ReportFiltersButton activeFilterCount={activeFilterCount} report="structure" />
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
              subtitle={STRUCTURE_PURCHASES_TITLES[filters.purchases]}
            />
            {currencies.length > 1 && <StructureCurrencies currencies={currencies} />}
            {unknownCount > 0 && currencies.length > 0 && (
              <Typography variant="caption1" tone="secondary" style={styles.note}>
                ОВДП, яких немає в даних НБУ ({unknownCount}), не враховано: їхні строки невідомі.
              </Typography>
            )}
          </ReportListHeader>
        }
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        ListEmptyComponent={<StructureEmpty wallet={narrowed} />}
      />
    </WalletGate>
  );
}

const styles = StyleSheet.create((theme) => ({
  note: { lineHeight: 18, marginHorizontal: theme.space.lg },
}));
