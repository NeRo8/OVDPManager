import { useQueries } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { exchangeRateQuery } from '@/api/nbu/exchangeRateQuery';
import { InfoRow } from '@/components/layout/InfoRow';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { Typography } from '@/components/typography/Typography';
import { useWallet } from '@/hooks/useWallet.hook';
import { buildWallet } from '@/lib/portfolio/wallet';
import { FlowChart } from '@/screens/reports/shared/FlowChart';
import { FlowTable } from '@/screens/reports/shared/FlowTable';
import { flowTables } from '@/screens/reports/shared/flowTables';
import { ReportHeaderActions } from '@/screens/reports/shared/ReportHeaderActions';
import { scopedWallet } from '@/screens/reports/shared/reportScope';
import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { useReportParams } from '@/screens/reports/shared/useReportParams.hook';
import { useReportShare } from '@/screens/reports/shared/useReportShare.hook';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/format';
import { round2 } from '@/utils/number';

import { fxBondSections } from './fxBondSections';
import { convertFxEvents, fxEvents, fxRemainingCost, fxTrend } from './fxReport';
import { FxStatus } from './FxStatus';
import { FxTrendChart } from './FxTrendChart';

const LABELS = { purchase: 'Купівля', sale: 'Продаж', coupon: 'Купон', redemption: 'Погашення' };

export default function FxReportScreen() {
  const wallet = useWallet();
  const filters = useReportParams('fx');
  const currency = filters.targetCurrency;
  const period = filters.year == null ? 'all' : 'year';
  const date =
    filters.year == null
      ? wallet.today
      : `${String(Math.min(Number(filters.year), Number(wallet.today.slice(0, 4)))).padStart(4, '0')}-01-01`;
  const hryvniaWallet = buildWallet(
    wallet.operations.filter((operation) => operation.currency === 'UAH'),
    wallet.byIsin,
    wallet.today,
  );
  const scope = { currency: null, isins: filters.isins };
  const selectedWallet = scopedWallet(hryvniaWallet, scope);
  const yearEnd = `${date.slice(0, 4)}-12-31`;
  const through = period === 'all' || yearEnd > wallet.today ? wallet.today : yearEnd;
  const history = fxEvents(selectedWallet).filter((event) => event.date <= through);
  const events = history.filter(
    (event) => period === 'all' || event.date.startsWith(date.slice(0, 4)),
  );
  const firstYear = Number((history[0]?.date ?? through).slice(0, 4));
  const lastYear = Number(through.slice(0, 4));
  const years = history.length
    ? Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index)
    : [];
  const queries = useQueries({
    queries: years.map((year) => exchangeRateQuery(currency, year, wallet.today)),
  });
  const loading = queries.some((query) => query.isLoading);
  const failed = queries.some((query) => query.isError);
  const ready = queries.every((query) => !!query.data);
  const rates = Object.assign({}, ...queries.map((query) => query.data ?? {})) as Record<
    string,
    number
  >;
  const converted = ready ? convertFxEvents(events, rates) : [];
  const historyConverted = ready ? convertFxEvents(history, rates) : [];
  const trend = fxTrend(selectedWallet, historyConverted, rates, through, period);
  const remainingUah = fxRemainingCost(selectedWallet, through);
  const remainingFx =
    remainingUah === null || !rates[through] ? null : round2(remainingUah / rates[through]);
  const investedFx = round2(
    historyConverted
      .filter((event) => event.type === 'purchase')
      .reduce((sum, event) => sum + event.equivalent, 0),
  );
  const receivedFx = round2(
    historyConverted
      .filter((event) => event.type !== 'purchase')
      .reduce((sum, event) => sum + event.equivalent, 0),
  );
  const sum = (type: keyof typeof LABELS) =>
    round2(
      converted
        .filter((event) => event.type === type)
        .reduce((total, event) => total + event.equivalent, 0),
    );
  const periodKeys = [
    ...new Set(converted.map((event) => event.date.slice(0, period === 'all' ? 4 : 7))),
  ];
  const periodTotals = periodKeys.map((label) => {
    const byType = (type: keyof typeof LABELS) =>
      round2(
        converted
          .filter((event) => event.date.startsWith(label) && event.type === type)
          .reduce((sum, event) => sum + event.equivalent, 0),
      );
    return {
      label,
      purchases: byType('purchase'),
      coupons: byType('coupon'),
      redemptions: byType('redemption'),
      sales: byType('sale'),
    };
  });
  const sections: ReportSection[] = historyConverted.length
    ? [
        {
          title: `Станом на ${formatDate(through)} · ${currency}`,
          rows: [
            { label: 'Усього вкладено', value: formatMoney(investedFx, currency) },
            { label: 'Отримано виплат і продажів', value: formatMoney(receivedFx, currency) },
            {
              label: 'Собівартість залишку',
              value: remainingFx === null ? '—' : formatMoney(remainingFx, currency),
            },
            {
              label: 'Надходження та залишок',
              value:
                remainingFx === null
                  ? '—'
                  : formatMoney(round2(receivedFx + remainingFx), currency),
            },
            {
              label: 'Різниця з вкладеним',
              value:
                remainingFx === null
                  ? '—'
                  : formatMoney(round2(receivedFx + remainingFx - investedFx), currency),
            },
          ],
          footer:
            'Залишок — собівартість, перерахована за курсом НБУ на цю дату, а не ринкова ціна. Надходження включають суми, які могли бути повторно інвестовані.' +
            (remainingFx === null
              ? ' Для частини облігацій бракує даних, тому залишок не визначено.'
              : ''),
        },
        {
          title: `Підсумок · ${currency}`,
          rows: [
            { label: 'Купівлі', value: formatMoney(sum('purchase'), currency) },
            { label: 'Купони', value: formatMoney(sum('coupon'), currency) },
            { label: 'Погашення', value: formatMoney(sum('redemption'), currency) },
            { label: 'Продажі', value: formatMoney(sum('sale'), currency) },
            {
              label: 'Сальдо',
              value: formatMoney(
                round2(sum('coupon') + sum('redemption') + sum('sale') - sum('purchase')),
                currency,
              ),
            },
          ],
          footer:
            'Суми перераховано за офіційним курсом НБУ на дату операції. Сальдо не є прибутком за облігаціями, які ще утримуються.',
        },
        ...(periodTotals.length ? flowTables(currency, periodTotals, period === 'year') : []),
        ...(trend.length
          ? [
              {
                title: `Динаміка · ${currency}`,
                lineChart: trend.some((item) => item.value === null)
                  ? undefined
                  : {
                      labels: trend.map((item) => item.date),
                      series:
                        period === 'all'
                          ? [
                              {
                                label: 'Різниця з вкладеним',
                                values: trend.map((item) => (item.value ?? 0) - item.invested),
                              },
                            ]
                          : [
                              { label: 'Вкладено', values: trend.map((item) => item.invested) },
                              {
                                label: 'Залишок і надходження',
                                values: trend.map((item) => item.value ?? 0),
                              },
                            ],
                    },
                rows: trend
                  .filter(
                    (item, index) =>
                      period === 'year' ||
                      item.date.slice(5, 7) === '12' ||
                      index === trend.length - 1,
                  )
                  .flatMap((item) => [
                    {
                      label: `${formatDate(item.date)} · Вкладено`,
                      value: formatMoney(item.invested, currency),
                    },
                    {
                      label: `${formatDate(item.date)} · Надходження та залишок`,
                      value: item.value === null ? '—' : formatMoney(item.value, currency),
                    },
                  ]),
                footer:
                  'Залишок оцінено за собівартістю і курсом НБУ на кінець періоду; це не ринкова ціна.',
              },
            ]
          : []),
        ...fxBondSections(selectedWallet, historyConverted, through, currency),
        ...converted.map((event, index): ReportSection => ({
          title: `${formatDate(event.date)} · ${event.isin} · ${index + 1}`,
          rows: [
            { label: 'Подія', value: LABELS[event.type] },
            { label: 'Сума', value: formatMoney(event.amount, 'UAH') },
            { label: `Курс ${currency}`, value: formatMoney(event.rate, 'UAH') },
            { label: 'Еквівалент', value: formatMoney(event.equivalent, currency) },
          ],
        })),
      ]
    : [];
  const { sharing, share } = useReportShare({
    planName: wallet.plan?.name,
    today: wallet.today,
    context: `${currency} · ${period === 'all' ? 'Увесь час' : date.slice(0, 4)} · ${scope.isins.length ? scope.isins.join(', ') : 'Усі облігації'}`,
    sections,
    stale: failed,
    title: 'Валютний еквівалент',
  });
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Валютний еквівалент',
          headerRight: () => (
            <ReportHeaderActions
              report={'fx'}
              selection={filters}
              sharing={sharing}
              hasData={sections.length > 0}
              share={() => void share()}
            />
          ),
        }}
      />
      <ScreenScrollView>
        <Typography variant="subhead" tone="secondary">
          {currency} · {period === 'all' ? 'Увесь час' : date.slice(0, 4)} ·{' '}
          {scope.isins.length ? scope.isins.join(', ') : 'Усі облігації'}
        </Typography>
        <FxTrendChart points={trend} currency={currency} period={period} />
        {periodTotals.length > 0 && (
          <FlowChart currency={currency} periods={periodTotals} minimumColumnWidth={52} />
        )}
        <FxStatus loading={loading} failed={failed} empty={!history.length} />
        {sections.map((section) =>
          section.table ? (
            <FlowTable key={section.title} title={section.title} table={section.table} />
          ) : (
            <Section key={section.title} title={section.title} footer={section.footer}>
              {section.rows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} prioritizeValue />
              ))}
            </Section>
          ),
        )}
      </ScreenScrollView>
    </>
  );
}
