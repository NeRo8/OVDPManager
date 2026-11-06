import { Stack } from 'expo-router';

import { ColumnChart } from '@/components/chart/ColumnChart';
import { Card } from '@/components/layout/Card';
import { EmptyState } from '@/components/layout/EmptyState';
import { InfoRow } from '@/components/layout/InfoRow';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { StaleBondsNotice } from '@/components/portfolio/StaleBondsNotice';
import { Typography } from '@/components/typography/Typography';
import { useBonds } from '@/hooks/useBonds.hook';
import { useWallet } from '@/hooks/useWallet.hook';
import { ReportHeaderActions } from '@/screens/reports/shared/ReportHeaderActions';
import { reportScopeLabel, scopedWallet } from '@/screens/reports/shared/reportScope';
import { useReportParams } from '@/screens/reports/shared/useReportParams.hook';
import { useReportShare } from '@/screens/reports/shared/useReportShare.hook';
import { formatDate } from '@/utils/date';

import { portfolioReport, type PortfolioStatus } from './portfolioReport';
import { portfolioReportSections } from './portfolioReportRows';

const OPTIONS: { label: string; value: PortfolioStatus }[] = [
  { label: 'Усі', value: 'all' },
  { label: 'В обігу', value: 'inCirculation' },
  { label: 'Погашені', value: 'redeemed' },
];

export default function PortfolioReportScreen() {
  const wallet = useWallet();
  const { error, bonds } = useBonds();
  const filters = useReportParams('portfolio');
  const status = filters.status;
  const scope = { currency: filters.currency, isins: filters.isins };
  const reports = portfolioReport(scopedWallet(wallet, scope), status);
  const sections = portfolioReportSections(reports);
  const statusLabel = OPTIONS.find((option) => option.value === status)?.label ?? 'Усі';
  const stale = !!error && (!!bonds || wallet.operations.some((operation) => !!operation.ovdp));

  const { sharing, share } = useReportShare({
    planName: wallet.plan?.name,
    today: wallet.today,
    context: `${statusLabel} · ${reportScopeLabel(scope)}`,
    sections,
    stale,
    title: 'Звіт по портфелю',
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Звіт по портфелю',
          headerRight: () => (
            <ReportHeaderActions
              report={'portfolio'}
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
          Станом на {formatDate(wallet.today)} · {statusLabel} · {reportScopeLabel(scope)}.
          Розрахунок включає заплановані операції.
        </Typography>
        {reports.map((report) => {
          const largest = [...report.bonds].sort((a, b) => b.invested - a.invested).slice(0, 5);
          return (
            <Card
              key={report.currency}
              title={`Найбільші вкладення · ${report.currency}`}
              footer={
                report.bonds.length > 5
                  ? 'Показано п’ять найбільших вкладень; усі облігації наведено нижче.'
                  : undefined
              }
            >
              <ColumnChart
                currency={report.currency}
                columns={largest.map((bond) => ({ label: bond.isin.slice(-4), name: bond.isin }))}
                series={[
                  {
                    label: 'Вкладено',
                    color: 'purchase',
                    values: largest.map((bond) => bond.invested),
                  },
                ]}
              />
            </Card>
          );
        })}
        {!sections.length && (
          <EmptyState
            layout="inline"
            icon="bar-chart-outline"
            title="Облігацій немає"
            message="Для обраного стану немає облігацій у цьому плані."
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
