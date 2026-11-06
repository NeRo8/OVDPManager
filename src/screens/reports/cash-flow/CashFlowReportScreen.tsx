import { Stack } from 'expo-router';

import { EmptyState } from '@/components/layout/EmptyState';
import { InfoRow } from '@/components/layout/InfoRow';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { StaleBondsNotice } from '@/components/portfolio/StaleBondsNotice';
import { Typography } from '@/components/typography/Typography';
import { useBonds } from '@/hooks/useBonds.hook';
import { useWallet } from '@/hooks/useWallet.hook';
import { FlowChart } from '@/screens/reports/shared/FlowChart';
import { FlowTable } from '@/screens/reports/shared/FlowTable';
import { flowTables } from '@/screens/reports/shared/flowTables';
import { monthsInSpan } from '@/screens/reports/shared/periodDates';
import { ReportHeaderActions } from '@/screens/reports/shared/ReportHeaderActions';
import { reportScopeLabel, scopedWallet } from '@/screens/reports/shared/reportScope';
import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { useReportParams } from '@/screens/reports/shared/useReportParams.hook';
import { useReportShare } from '@/screens/reports/shared/useReportShare.hook';
import { formatDate } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/format';
import { round2 } from '@/utils/number';

import { cashFlowCharts } from './cashFlowCharts';
import { cashFlowHighlights } from './cashFlowHighlights';
import { cashFlowReport, type CashFlow } from './cashFlowReport';

type Props = { mode: 'year' | 'period' | 'year-over-year' };
const TITLES = {
  year: 'Звіт за рік',
  period: 'Звіт за період',
  'year-over-year': 'Звіт від року до року',
};

function flowSection(flow: CashFlow, title: string, from: string, to: string): ReportSection {
  const money = (value: number) => formatMoney(value, flow.currency);
  return {
    title,
    rows: [
      { label: 'Купівлі', value: money(flow.purchases) },
      { label: 'З них заплановано', value: money(flow.plannedPurchases) },
      { label: 'Купони', value: money(flow.coupons) },
      {
        label: 'Купони в середньому за місяць',
        value: money(round2(flow.coupons / monthsInSpan(from, to))),
      },
      { label: 'Погашення', value: money(flow.redemptions) },
      { label: 'Продажі', value: money(flow.sales) },
      { label: 'Отримано', value: money(flow.received) },
      { label: 'Очікується', value: money(flow.expected) },
      { label: 'Сальдо', value: money(flow.balance) },
      { label: 'Дохід', value: flow.income === null ? '—' : money(flow.income) },
      {
        label: 'Річна дохідність',
        value: flow.annualYield === null ? '—' : formatPercent(flow.annualYield),
      },
    ],
    footer:
      flow.income === null
        ? 'Дохід невідомий: бракує даних хоча б однієї облігації.'
        : `Дохід — купони та прибуток від продажів і погашень за вирахуванням їхньої собівартості. Без розрахованої річної дохідності: ${flow.withoutYieldCount}.`,
  };
}

export default function CashFlowReportScreen({ mode }: Props) {
  const wallet = useWallet();
  const { bonds, error } = useBonds();
  const filters = useReportParams(mode);
  const scope = { currency: filters.currency, isins: filters.isins };
  const selectedWallet = scopedWallet(wallet, scope);
  const year = filters.year ?? wallet.today.slice(0, 4);
  const from = mode === 'year' ? `${year}-01-01` : filters.from;
  const to = filters.to;
  const bounds = [...selectedWallet.operationEvents, ...selectedWallet.payments]
    .map((event) => event.date)
    .sort();
  const firstYear = Number((bounds[0] ?? wallet.today).slice(0, 4));
  const lastYear = Number((bounds.at(-1) ?? wallet.today).slice(0, 4));
  const chartFrom = mode === 'year-over-year' ? `${firstYear}-01-01` : from;
  const selectedTo = mode === 'year' ? `${year}-12-31` : to;
  const chartTo = mode === 'year-over-year' ? `${lastYear}-12-31` : selectedTo;
  const charts = cashFlowCharts(selectedWallet, chartFrom, chartTo);
  const totals =
    mode === 'year-over-year' ? cashFlowReport(selectedWallet, chartFrom, chartTo) : [];
  const annualFlows =
    mode === 'year-over-year'
      ? Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
          const item = firstYear + index;
          const flows = cashFlowReport(selectedWallet, `${item}-01-01`, `${item}-12-31`);
          const withEmptyYears = totals.flatMap((total): CashFlow[] => {
            const dates = [...selectedWallet.operationEvents, ...selectedWallet.payments]
              .filter((event) => event.currency === total.currency)
              .map((event) => event.date)
              .sort();
            const first = dates[0];
            const last = dates.at(-1);
            if (
              !first ||
              !last ||
              String(item) < first.slice(0, 4) ||
              String(item) > last.slice(0, 4)
            )
              return [];
            return [
              flows.find((flow) => flow.currency === total.currency) ?? {
                currency: total.currency,
                purchases: 0,
                plannedPurchases: 0,
                sales: 0,
                coupons: 0,
                redemptions: 0,
                received: 0,
                expected: 0,
                balance: 0,
                income: 0,
                annualYield: null,
                withoutYieldCount: 0,
              },
            ];
          });
          return { year: item, flows: withEmptyYears };
        })
      : [];
  const summaries =
    mode === 'year-over-year'
      ? [
          ...totals.map((flow) =>
            flowSection(flow, `Усього · ${flow.currency}`, chartFrom, chartTo),
          ),
          ...annualFlows.flatMap(({ year: item, flows }, index) =>
            flows.map((flow) => {
              const section = flowSection(
                flow,
                `${item} · ${flow.currency}`,
                `${item}-01-01`,
                `${item}-12-31`,
              );
              const previous = annualFlows[index - 1]?.flows.find(
                (prior) => prior.currency === flow.currency,
              )?.income;
              const change =
                previous != null && previous > 0 && flow.income != null && flow.income >= 0
                  ? formatPercent(round2(((flow.income - previous) / previous) * 100))
                  : '—';
              return {
                ...section,
                rows: [...section.rows, { label: 'Зміна доходу за рік', value: change }],
              };
            }),
          ),
        ]
      : cashFlowReport(
          selectedWallet,
          mode === 'year' ? `${year}-01-01` : from,
          mode === 'year' ? `${year}-12-31` : to,
        ).map((flow) => flowSection(flow, `Підсумок · ${flow.currency}`, chartFrom, chartTo));
  const sections =
    mode === 'year-over-year'
      ? summaries
      : [
          ...summaries,
          ...cashFlowHighlights(selectedWallet, chartFrom, chartTo),
          ...charts.flatMap(({ currency, periods }) =>
            flowTables(currency, periods, mode === 'year'),
          ),
          ...selectedWallet.positions.flatMap((item): ReportSection[] => {
            const onlyBond = scopedWallet(selectedWallet, {
              currency: item.currency,
              isins: [item.position.isin],
            });
            const flow = cashFlowReport(onlyBond, chartFrom, chartTo)[0];
            if (!flow) return [];
            return [flowSection(flow, item.position.isin, chartFrom, chartTo)];
          }),
        ];
  const title = TITLES[mode];
  let status = `${formatDate(from)} – ${formatDate(to)}`;
  if (mode === 'year-over-year') status = 'Усі роки';
  if (mode === 'year') status = year;
  const stale = !!error && (!!bonds || wallet.operations.some((operation) => !!operation.ovdp));
  const { sharing, share } = useReportShare({
    planName: wallet.plan?.name,
    today: wallet.today,
    context: `${status} · ${reportScopeLabel(scope)}`,
    sections,
    stale,
    title,
  });
  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <ReportHeaderActions
              report={mode}
              selection={filters}
              sharing={sharing}
              hasData={sections.length > 0}
              share={() => void share()}
            />
          ),
        }}
      />
      <ScreenScrollView>
        <StaleBondsNotice />
        <Typography variant="subhead" tone="secondary">
          {status} · {reportScopeLabel(scope)}
        </Typography>
        {charts.map(({ currency, periods }) => (
          <FlowChart
            key={currency}
            currency={currency}
            periods={periods}
            showPlanned
            minimumColumnWidth={52}
          />
        ))}
        {!sections.length && (
          <EmptyState
            layout="inline"
            icon="bar-chart-outline"
            title="Даних немає"
            message="За обраний період немає операцій чи виплат."
          />
        )}
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
