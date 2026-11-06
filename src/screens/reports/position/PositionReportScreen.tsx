import { useQueries } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { keyRateDate, keyRateQuery, keyRateYear } from '@/api/nbu/keyRateQuery';
import { ColumnChart } from '@/components/chart/ColumnChart';
import { Card } from '@/components/layout/Card';
import { EmptyState } from '@/components/layout/EmptyState';
import { InfoRow } from '@/components/layout/InfoRow';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { StaleBondsNotice } from '@/components/portfolio/StaleBondsNotice';
import { Typography } from '@/components/typography/Typography';
import { useBonds } from '@/hooks/useBonds.hook';
import { useKeyRate } from '@/hooks/useKeyRate.hook';
import { useWallet } from '@/hooks/useWallet.hook';
import { passesStatus, type PortfolioStatus } from '@/screens/reports/portfolio/portfolioReport';
import { ReportHeaderActions } from '@/screens/reports/shared/ReportHeaderActions';
import { reportScopeLabel, scopedWallet } from '@/screens/reports/shared/reportScope';
import { useReportParams } from '@/screens/reports/shared/useReportParams.hook';
import { useReportShare } from '@/screens/reports/shared/useReportShare.hook';
import { keyRateOn, useCachedKeyRateYears } from '@/stores/keyRate/selectors';

import { positionReportSections, type PositionReportMode } from './positionReportRows';
import { YieldChart } from './YieldChart';

type Props = { mode: PositionReportMode };
const TITLES = {
  structure: 'Структура портфеля',
  yield: 'Річна дохідність',
  bond: 'Звіт по облігації',
};
const STATUSES: { label: string; value: PortfolioStatus }[] = [
  { label: 'Усі', value: 'all' },
  { label: 'В обігу', value: 'inCirculation' },
  { label: 'Погашені', value: 'redeemed' },
];
const PURCHASES: { label: string; value: 'all' | 'made' }[] = [
  { label: 'Усі купівлі', value: 'all' },
  { label: 'Зроблені', value: 'made' },
];

export default function PositionReportScreen({ mode }: Props) {
  const wallet = useWallet();
  const { bonds, error } = useBonds();
  const keyRate = useKeyRate(wallet.today);
  const keyRateYears = useCachedKeyRateYears();
  const rateYears =
    mode === 'structure'
      ? []
      : [
          ...new Set(
            wallet.operations
              .filter((operation) => operation.type === 'purchase' && operation.currency === 'UAH')
              .map((operation) => keyRateYear(operation.date, wallet.today)),
          ),
        ];
  const historicalRates = useQueries({
    queries: rateYears.map((year) => keyRateQuery(year, wallet.today)),
  });
  const filters = useReportParams(mode);
  const scope = { currency: filters.currency, isins: filters.isins };
  const status = filters.status;
  const purchases = filters.purchases;
  const isin = filters.isin ?? wallet.positions[0]?.position.isin ?? null;
  const title = TITLES[mode];
  const scoped = mode === 'bond' ? wallet : scopedWallet(wallet, scope);
  const selected =
    mode === 'yield'
      ? {
          ...scoped,
          positions: scoped.positions.filter((item) => passesStatus(item.state, status)),
        }
      : scoped;
  const sections = positionReportSections(selected, mode, isin, keyRate.rate, purchases, (date) =>
    keyRateOn(keyRateYears, keyRateDate(date, wallet.today)),
  );
  const stale = !!error && (!!bonds || wallet.operations.some((operation) => !!operation.ovdp));
  const context =
    mode === 'bond'
      ? (isin ?? '')
      : `${reportScopeLabel(scope)} · ${mode === 'yield' ? STATUSES.find((item) => item.value === status)?.label : PURCHASES.find((item) => item.value === purchases)?.label}`;
  const { sharing, share } = useReportShare({
    planName: wallet.plan?.name,
    today: wallet.today,
    context,
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
              selection={{ ...filters, isin }}
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
          {context}
        </Typography>
        {(mode === 'yield' || mode === 'bond') &&
          (keyRate.failed || historicalRates.some((query) => query.isError)) && (
            <Typography variant="caption1" tone="warning">
              Не вдалося завантажити частину облікових ставок НБУ.
            </Typography>
          )}
        {mode === 'structure' &&
          sections.flatMap((section) =>
            section.chart
              ? [
                  <Card key={section.title} title={`Розподіл вкладень · ${section.chart.currency}`}>
                    <ColumnChart
                      currency={section.chart.currency}
                      columns={section.chart.bars.map((bar) => ({
                        label: bar.label.slice(-4),
                        name: bar.label,
                      }))}
                      series={[
                        {
                          label: 'Вкладено',
                          color: 'purchase',
                          values: section.chart.bars.map((bar) => bar.value),
                        },
                      ]}
                    />
                  </Card>,
                ]
              : [],
          )}
        {mode === 'yield' &&
          sections.flatMap((section) =>
            section.chart ? [<YieldChart key={section.title} chart={section.chart} />] : [],
          )}
        {!sections.length && (
          <EmptyState
            layout="inline"
            icon="bar-chart-outline"
            title="Даних немає"
            message="У плані немає відповідних облігацій."
          />
        )}
        {sections.map((section) => (
          <Section key={section.title} title={section.title} footer={section.footer}>
            {section.rows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} prioritizeValue />
            ))}
          </Section>
        ))}
      </ScreenScrollView>
    </>
  );
}
