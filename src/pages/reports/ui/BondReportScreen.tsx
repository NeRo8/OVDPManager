import { Stack } from 'expo-router';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  BondTerms,
  CURRENCY_NAMES,
  type Currency,
  type PositionPayment,
  type Purchase,
  ScheduleEventRow,
  WalletGate,
} from '@/entities/portfolio';
import { Card, EmptyState, SectionCell, Typography } from '@/shared/ui';
import { bondReport } from '../model/bondReport';
import { useBondReport } from '../model/useBondReport.hook';
import { BondReportPurchaseRow } from './BondReportPurchaseRow';
import { BondReportSummary } from './BondReportSummary';
import { bondStateLabel } from './portfolioLabels';
import { ReportFiltersButton } from './ReportFiltersButton';
import { ReportHeading } from './ReportHeading';
import { ReportList } from './ReportList';
import { ReportListHeader } from './ReportListHeader';
import { ReportSectionHeader } from './ReportSectionHeader';
import { YearsMoneyChart } from './YearsMoneyChart';

type BondRow = Purchase | PositionPayment;

/** The purchases, then the payments, each a card of list rows. */
type BondSection = {
  key: 'purchases' | 'payments';
  title: string;
  currency: Currency;
  data: BondRow[];
};

const isPurchase = (row: BondRow): row is Purchase => 'purchaseDate' in row;
const keyOf = (row: BondRow) => (isPurchase(row) ? row.id : `${row.date}-${row.type}`);

/**
 * One bond of the active plan's wallet, picked in the report's filters: the issue's terms, what it
 * cost, pays and earns, its money by year, then every purchase and payment. Everything shows at
 * once, with no taps, so it reads the same on paper.
 */
export default function BondReportScreen() {
  const { wallet, item, keyRateOn, activeFilterCount } = useBondReport();
  const report = item && bondReport(wallet, item, keyRateOn);
  const hasTopUps = (item?.position.purchases.length ?? 0) > 1;
  const sections: BondSection[] = item
    ? [
        {
          key: 'purchases',
          title: `Купівлі (${item.position.purchases.length})`,
          currency: item.currency,
          data: item.position.purchases,
        },
        {
          key: 'payments',
          title: `Виплати (${item.payments.length})`,
          currency: item.currency,
          data: item.payments,
        },
      ]
    : [];

  const renderSectionHeader = ({ section }: { section: SectionListData<BondRow, BondSection> }) => (
    <ReportSectionHeader rowsTitle={section.title} />
  );
  const renderSectionFooter = ({ section }: { section: SectionListData<BondRow, BondSection> }) => {
    if (section.key !== 'payments' || section.data.length) return null;
    return item?.bond ? (
      <EmptyState
        layout="inline"
        icon="calendar-outline"
        title="Виплат немає"
        message="Усі виплати за графіком НБУ припадають на дати до купівлі, тож цій купівлі вони не належать."
      />
    ) : (
      <EmptyState
        layout="inline"
        icon="cloud-offline-outline"
        title="Немає даних НБУ"
        message="Цієї ОВДП немає в даних НБУ, тож графіка виплат немає. Він з’явиться, щойно дані оновляться."
      />
    );
  };
  const renderItem = ({
    item: row,
    index,
    section,
  }: SectionListRenderItemInfo<BondRow, BondSection>) => (
    <SectionCell index={index} count={section.data.length}>
      {isPurchase(row) ? (
        <BondReportPurchaseRow purchase={row} currency={section.currency} today={wallet.today} />
      ) : (
        <ScheduleEventRow event={row} showQuantity={hasTopUps} />
      )}
    </SectionCell>
  );

  return (
    <WalletGate>
      <Stack.Screen
        options={{
          headerRight: () => (
            <ReportFiltersButton activeFilterCount={activeFilterCount} report="bond" />
          ),
        }}
      />
      <ReportList
        wallet={wallet}
        sections={sections}
        keyExtractor={keyOf}
        ListHeaderComponent={
          report && (
            <ReportListHeader>
              <ReportHeading
                title={report.item.position.isin}
                subtitle={`${CURRENCY_NAMES[report.item.currency]} · ${bondStateLabel(report.item.state, report.item.bond?.maturityDate)}`}
              />
              <Card>
                {report.item.bond ? (
                  <BondTerms bond={report.item.bond} />
                ) : (
                  <Typography variant="footnote" tone="warning" style={styles.warning}>
                    Цієї ОВДП немає в даних НБУ — параметри випуску й графік виплат недоступні.
                  </Typography>
                )}
              </Card>
              <BondReportSummary report={report} />
              {report.money && report.money.years.length > 0 && (
                <YearsMoneyChart report={report.money} />
              )}
            </ReportListHeader>
          )
        }
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        renderItem={renderItem}
      />
    </WalletGate>
  );
}

const styles = StyleSheet.create({
  warning: { lineHeight: 18 },
});
