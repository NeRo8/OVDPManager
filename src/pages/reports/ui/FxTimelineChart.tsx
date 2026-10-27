import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ExchangeCurrency } from '@/entities/portfolio';
import { MONTHS, MONTHS_SHORT, formatMoney } from '@/shared/lib';
import {
  Card,
  LegendRow,
  LineChart,
  type LineChartSeries,
  SectionTitle,
  Separator,
  SignedValue,
  Swatch,
  Typography,
} from '@/shared/ui';
import type { FxReport } from '../model/fxReport';

type Props = { report: FxReport; currency: ExchangeCurrency };

/** Annual comparison or all-time difference, both on the same chart component. */
export function FxTimelineChart({ report, currency }: Props) {
  const { points } = report;
  if (points.length === 0) return null;

  const allTime = report.year === null;
  const difference = points.map(({ investedFx, currentFx }) => currentFx - investedFx);
  const highest = Math.max(0, ...difference);
  const lowest = Math.min(0, ...difference);
  const min = allTime ? lowest : 0;
  const maxValue = Math.max(
    0,
    ...points.flatMap(({ investedFx, currentFx }) => [investedFx, currentFx]),
  );
  const max = allTime ? highest : maxValue;
  const series: LineChartSeries[] = allTime
    ? [
        {
          label: 'різниця',
          color: 'redemption',
          values: difference,
          dotIndices: points.flatMap(({ period }, index) =>
            index === 0 || index === points.length - 1 || period.endsWith('-01') ? [index] : [],
          ),
        },
      ]
    : [
        {
          label: 'вкладено',
          color: 'purchase',
          values: points.map(({ investedFx }) => investedFx),
          strokeWidth: 4,
          dotSize: 9,
        },
        {
          label: 'залишок + виплати',
          color: 'redemption',
          values: points.map(({ currentFx }) => currentFx),
        },
      ];
  const lastPoint = points[points.length - 1];
  const lastDifference = difference[difference.length - 1];
  const signedMoney = (value: number) => `${value > 0 ? '+' : ''}${formatMoney(value, currency)}`;
  const monthName = (period: string) => MONTHS[Number(period.slice(5)) - 1];
  const labels = points.map(({ period }) =>
    allTime
      ? `${MONTHS_SHORT[Number(period.slice(5)) - 1]} ${period.slice(2, 4)}`
      : MONTHS_SHORT[Number(period.slice(5)) - 1],
  );
  const names = points.map(({ period }) => `${monthName(period)} ${period.slice(0, 4)}`);
  const accessibilityLabel = allTime
    ? `Помісячний графік різниці з вкладеним від ${points[0].period} до ${lastPoint.period}. Найменше ${signedMoney(lowest)}, найбільше ${signedMoney(highest)}, на останню дату ${signedMoney(lastDifference)}. Нульова лінія відділяє приріст від зменшення.`
    : `Лінійний графік за ${report.year} рік. ${points.map(({ period, investedFx, currentFx }) => `${monthName(period)}: вкладено ${formatMoney(investedFx, currency)}, залишок з виплатами ${formatMoney(currentFx, currency)}`).join('; ')}`;

  return (
    <View style={styles.section}>
      <SectionTitle
        title={
          allTime
            ? `Різниця з вкладеним · ${currency}`
            : `Вкладення у валютному еквіваленті · ${currency}`
        }
      />
      <Card>
        <LineChart
          key={`${currency}-${report.year ?? 'all'}-${points[0].period}-${lastPoint.period}`}
          labels={labels}
          names={names}
          series={series}
          currency={currency}
          min={min}
          max={max}
          sparseLabels={allTime}
          accessibilityLabel={accessibilityLabel}
        />
        <View style={styles.separator}>
          <Separator />
        </View>
        {allTime ? (
          <View style={styles.resultRow}>
            <Swatch color="redemption" />
            <Typography variant="footnote" tone="secondary" style={styles.resultLabel}>
              Різниця на останню дату
            </Typography>
            <SignedValue value={lastDifference} variant="footnote" weight="semibold" tabular>
              {signedMoney(lastDifference)}
            </SignedValue>
          </View>
        ) : (
          <View style={styles.legend}>
            <LegendRow
              color="purchase"
              label="Вкладено"
              value={formatMoney(lastPoint.investedFx, currency)}
            />
            <LegendRow
              color="redemption"
              label="Залишок + виплати"
              value={formatMoney(lastPoint.currentFx, currency)}
            />
          </View>
        )}
      </Card>
      <Typography variant="caption1" tone="secondary" style={styles.footer}>
        {allTime
          ? 'Кожна точка — кінець місяця, для поточного — сьогодні. Різниця = отримані виплати + залишок ОВДП за собівартістю − усі купівлі у валютному еквіваленті. Реінвестовані виплати й нові купівлі враховано окремо. Для непогашених ОВДП це оцінка, а не остаточний дохід.'
          : '«Вкладено» — накопичені купівлі за курсом їхніх дат. Друга лінія — залишок гривневих вкладень за курсом на кінець місяця та отримані виплати за курсом їхніх дат. Ринкову ціну ОВДП не враховано. Реінвестовані виплати залишаються у сумі виплат, тому друга лінія не є сумою грошей, доступних зараз.'}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  separator: { marginLeft: -theme.space.lg, marginVertical: theme.space.md },
  legend: { gap: theme.space.sm },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  resultLabel: { flex: 1 },
  footer: { lineHeight: 18, marginHorizontal: theme.space.lg },
}));
