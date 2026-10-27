import { Stack } from 'expo-router';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';

import { type PositionPayment, ScheduleEventRow, WalletGate } from '@/entities/portfolio';
import { isScopeOn } from '@/features/report-filters';
import { SectionCell } from '@/shared/ui';
import { type CurrencyRedemptions, redemptionsReport } from '../model/redemptionsReport';
import { redemptionsPdf } from '../model/reportPdf';
import { useReport } from '../model/useReport.hook';
import { REDEMPTION_TIME_LABELS } from './redemptionLabels';
import { RedemptionsCurrencyHeader } from './RedemptionsCurrencyHeader';
import { RedemptionsEmpty } from './RedemptionsEmpty';
import { ReportHeaderActions } from './ReportHeaderActions';
import { ReportHeading } from './ReportHeading';
import { ReportList } from './ReportList';
import { ReportListHeader } from './ReportListHeader';

/** A currency of the report: its sums head the section, its redemptions are the rows. */
type CurrencySection = { report: CurrencyRedemptions; data: PositionPayment[] };

const keyOf = (payment: PositionPayment) => `${payment.isin}-${payment.date}`;

/**
 * When and how much the active plan's redemptions bring, with the time, currency and bonds picked
 * in its filters, every currency apart: the sums, a chart and a table by year and quarter, then
 * every redemption. Everything shows at once, with no taps, so it reads the same on paper.
 */
export default function RedemptionsReportScreen() {
  const { wallet, narrowed, filters, activeFilterCount } = useReport('redemptions');
  const currencies = redemptionsReport(narrowed, filters.time);
  const sections = currencies.map((report): CurrencySection => ({ report, data: report.payments }));
  const years = currencies.flatMap((report) => report.years.map(({ year }) => year));
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  const renderSectionHeader = ({
    section,
  }: {
    section: SectionListData<PositionPayment, CurrencySection>;
  }) => <RedemptionsCurrencyHeader report={section.report} />;
  const renderItem = ({
    item,
    index,
    section,
  }: SectionListRenderItemInfo<PositionPayment, CurrencySection>) => (
    <SectionCell index={index} count={section.data.length}>
      <ScheduleEventRow event={item} showIsin />
    </SectionCell>
  );

  return (
    <WalletGate>
      <Stack.Screen
        options={{
          headerRight: () => (
            <ReportHeaderActions
              activeFilterCount={activeFilterCount}
              report="redemptions"
              createDocument={() =>
                redemptionsPdf(wallet, REDEMPTION_TIME_LABELS[filters.time], currencies)
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
            {currencies.length > 0 && (
              <ReportHeading
                title={firstYear === lastYear ? String(firstYear) : `${firstYear} – ${lastYear}`}
                subtitle={`${REDEMPTION_TIME_LABELS[filters.time]} погашення`}
              />
            )}
          </ReportListHeader>
        }
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        ListEmptyComponent={
          <RedemptionsEmpty wallet={narrowed} time={filters.time} isScoped={isScopeOn(filters)} />
        }
      />
    </WalletGate>
  );
}
