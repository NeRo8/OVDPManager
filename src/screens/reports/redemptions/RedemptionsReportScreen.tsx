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
import { ScrollableChart } from '@/screens/reports/shared/ScrollableChart';
import { useReportParams } from '@/screens/reports/shared/useReportParams.hook';
import { useReportShare } from '@/screens/reports/shared/useReportShare.hook';

import { redemptionsReport, type RedemptionTime } from './redemptionsReport';
import { redemptionsReportSections } from './redemptionsReportRows';

const OPTIONS: { label: string; value: RedemptionTime }[] = [
  { label: 'Очікуються', value: 'upcoming' },
  { label: 'Отримані', value: 'past' },
  { label: 'Усі', value: 'all' },
];

export default function RedemptionsReportScreen() {
  const wallet = useWallet();
  const { error, bonds } = useBonds();
  const filters = useReportParams('redemptions');
  const time = filters.time;
  const scope = { currency: filters.currency, isins: filters.isins };
  const reports = redemptionsReport(scopedWallet(wallet, scope), time);
  const sections = redemptionsReportSections(reports);
  const status = OPTIONS.find((option) => option.value === time)?.label ?? 'Усі';
  const stale = !!error && (!!bonds || wallet.operations.some((operation) => !!operation.ovdp));

  const { sharing, share } = useReportShare({
    planName: wallet.plan?.name,
    today: wallet.today,
    context: `${status} · ${reportScopeLabel(scope)}`,
    sections,
    stale,
    title: 'Графік погашень',
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Графік погашень',
          headerRight: () => (
            <ReportHeaderActions
              report={'redemptions'}
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
          {status} · {reportScopeLabel(scope)}. Погашення за збереженим графіком, включно із
          запланованими купівлями.
        </Typography>
        {!sections.length && (
          <EmptyState
            layout="inline"
            icon="calendar-outline"
            title="Погашень немає"
            message="Для обраного стану немає погашень у цьому плані."
          />
        )}
        {reports.map((report) => (
          <Card key={report.currency} title={`Погашення по роках · ${report.currency}`}>
            <ScrollableChart count={report.years.length} columnWidth={52}>
              <ColumnChart
                currency={report.currency}
                columns={report.years.map(({ year }) => ({
                  label: String(year),
                  name: String(year),
                }))}
                series={[
                  {
                    label: 'Погашення',
                    color: 'redemption',
                    values: report.years.map(({ total }) => total),
                  },
                ]}
              />
            </ScrollableChart>
          </Card>
        ))}
        {sections.map((section, index) => (
          <Section key={`${section.title}-${index}`} title={section.title} footer={section.footer}>
            {section.rows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} prioritizeValue />
            ))}
          </Section>
        ))}
      </ScreenScrollView>
    </>
  );
}
