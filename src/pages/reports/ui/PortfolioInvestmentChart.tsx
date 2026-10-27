import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { Card, ColumnChart, SectionTitle, Typography } from '@/shared/ui';
import type { CurrencyPortfolio } from '../model/portfolioReport';

type Props = { report: CurrencyPortfolio };

/** The largest bond positions by purchase cost, within one currency. */
export function PortfolioInvestmentChart({ report }: Props) {
  const bonds = [...report.bonds].sort((a, b) => b.invested - a.invested).slice(0, 5);

  return (
    <View style={styles.section}>
      <SectionTitle title={`Вкладення за ОВДП · ${CURRENCY_NAMES[report.currency]}`} />
      <Card>
        <ColumnChart
          orientation="horizontal"
          columns={bonds.map(({ isin }) => ({ label: isin, name: `ОВДП ${isin}` }))}
          series={[
            { label: 'вкладено', color: 'purchase', values: bonds.map(({ invested }) => invested) },
          ]}
          currency={report.currency}
        />
      </Card>
      {report.bonds.length > bonds.length && (
        <Typography variant="caption1" tone="secondary" style={styles.note}>
          Показано 5 найбільших вкладень; усі ОВДП наведено нижче.
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  note: { marginHorizontal: theme.space.lg },
}));
