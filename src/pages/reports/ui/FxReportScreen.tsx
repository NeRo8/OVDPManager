import { Stack } from 'expo-router';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';

import { WalletGate, useExchangeRates } from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';
import {
  Button,
  EmptyState,
  InfoRow,
  LoadingState,
  Section,
  SectionCell,
  Separator,
  Typography,
} from '@/shared/ui';
import { fxEventDates, fxReport, type FxBond, type FxEvent } from '../model/fxReport';
import { useReport } from '../model/useReport.hook';
import { FxEventRow } from './FxEventRow';
import { FxMonthsChart } from './FxMonthsChart';
import { ReportFiltersButton } from './ReportFiltersButton';
import { ReportHeading } from './ReportHeading';
import { ReportList } from './ReportList';
import { ReportListHeader } from './ReportListHeader';
import { ReportSectionHeader } from './ReportSectionHeader';

type FxSection = FxBond & { data: FxEvent[] };

/** A calendar year's past UAH bond cash flows, converted at each event's NBU exchange rate. */
export default function FxReportScreen() {
  const { wallet, narrowed, filters, activeFilterCount } = useReport('fx');
  const { year, targetCurrency } = filters;
  const dates = fxEventDates(narrowed, year);
  const { rateOn, loading, error, retry } = useExchangeRates(targetCurrency, dates);
  const report = fxReport(narrowed, year, rateOn);
  const sections: FxSection[] = report?.bonds.map((bond) => ({ ...bond, data: bond.events })) ?? [];
  const refresh = async () => {
    await Promise.all([wallet.refresh(), retry()]);
  };

  const renderSectionHeader = ({ section }: { section: SectionListData<FxEvent, FxSection> }) => (
    <ReportSectionHeader rowsTitle={`Події року · ${section.isin}`}>
      <Section
        title={section.isin}
        footer={
          section.result === null
            ? 'ОВДП ще не погашена або дані про погашення неповні. Остаточний валютний результат не визначено.'
            : undefined
        }
      >
        <InfoRow
          label="Вкладено від першої купівлі"
          value={formatMoney(section.invested, targetCurrency)}
        />
        <Separator />
        <InfoRow
          label="Отримано до кінця року"
          value={formatMoney(section.received, targetCurrency)}
        />
        {section.result !== null && (
          <>
            <Separator />
            <InfoRow
              label="Результат"
              value={formatMoney(section.result, targetCurrency)}
              signedValue={section.result}
            />
          </>
        )}
      </Section>
    </ReportSectionHeader>
  );
  const renderItem = ({ item, index, section }: SectionListRenderItemInfo<FxEvent, FxSection>) => (
    <SectionCell index={index} count={section.data.length}>
      <FxEventRow event={item} currency={targetCurrency} />
    </SectionCell>
  );

  return (
    <WalletGate>
      <Stack.Screen
        options={{
          headerRight: () => (
            <ReportFiltersButton activeFilterCount={activeFilterCount} report="fx" />
          ),
        }}
      />
      {report === null ? (
        loading ? (
          <LoadingState message="Завантажуємо курси НБУ…" />
        ) : (
          <EmptyState
            icon="cloud-offline-outline"
            title="Немає курсів НБУ"
            message={error ?? 'НБУ не повернув курс на всі дати купівель і виплат.'}
          >
            <Button title="Спробувати ще раз" onPress={() => void retry()} />
          </EmptyState>
        )
      ) : (
        <ReportList
          wallet={{ ...wallet, refresh }}
          sections={sections}
          keyExtractor={(event) => event.key}
          ListHeaderComponent={
            <ReportListHeader>
              <ReportHeading
                title={String(year)}
                subtitle={`Гривневі ОВДП · еквівалент у ${targetCurrency} · до ${formatDate(report.throughDate)}`}
              />
              <Typography variant="caption1" tone="secondary">
                Кожну купівлю й фактично минулу виплату перераховано за офіційним курсом НБУ на її
                дату. Це валютний еквівалент, фактичний курс обміну може відрізнятися.
              </Typography>
              {report.bonds.length > 0 && (
                <>
                  <Section
                    title="Рух грошей за рік"
                    footer="Сальдо — отримані виплати мінус купівлі цього року. Воно не є прибутком для ОВДП, що ще не погашені."
                  >
                    <InfoRow
                      label="Купівлі"
                      value={formatMoney(report.purchases, targetCurrency)}
                    />
                    <Separator />
                    <InfoRow label="Купони" value={formatMoney(report.coupons, targetCurrency)} />
                    <Separator />
                    <InfoRow
                      label="Погашення"
                      value={formatMoney(report.redemptions, targetCurrency)}
                    />
                    <Separator />
                    <InfoRow
                      label="Сальдо подій року"
                      value={formatMoney(report.yearBalance, targetCurrency)}
                      signedValue={report.yearBalance}
                    />
                  </Section>
                  <FxMonthsChart report={report} currency={targetCurrency} />
                  <Section
                    title="Завершені ОВДП"
                    footer={
                      report.openCount > 0
                        ? `${report.openCount} ОВДП ще не погашено або їхні дані неповні. Їх не включено в результат.`
                        : undefined
                    }
                  >
                    <InfoRow label="Кількість" value={String(report.completedCount)} />
                    <Separator />
                    <InfoRow
                      label="Результат у валюті"
                      value={
                        report.completedCount > 0
                          ? formatMoney(report.completedResult, targetCurrency)
                          : '—'
                      }
                      signedValue={report.completedCount > 0 ? report.completedResult : undefined}
                    />
                  </Section>
                </>
              )}
            </ReportListHeader>
          }
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              layout="inline"
              icon={filters.isins.length > 0 ? 'funnel-outline' : 'calendar-outline'}
              title="Купівель і виплат немає"
              message={`У ${year} році за обраними гривневими ОВДП немає купівель і вже отриманих виплат. Оберіть інший рік або ОВДП у фільтрах.`}
            />
          }
        />
      )}
    </WalletGate>
  );
}
