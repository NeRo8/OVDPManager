import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  FAB_CLEARANCE,
  FloatingActionButton,
  SectionCell,
  SectionTitle,
  Typography,
  screenContent,
} from '@/shared/ui';
import {
  daysBetween,
  formatDate,
  formatDaysLeft,
  formatMoney,
  formatTotals,
  plural,
} from '@/shared/lib';
import {
  BondsUnavailable,
  NbuSourceNote,
  StaleBondsNotice,
  type PositionPayment,
} from '@/entities/portfolio';
import { usePortfolio } from '../model/usePortfolio.hook';
import { themeStyles } from '@/shared/theme';

export default function PortfolioScreen() {
  const theme = themeStyles;
  const { holdingsCount, bonds, isFetching, error, refresh, today, rows, nextDate, nextGroup } =
    usePortfolio();

  if (!bonds && holdingsCount > 0) return <BondsUnavailable error={error} onRetry={refresh} />;

  if (holdingsCount === 0) {
    return (
      <EmptyState
        title="Гаманець порожній"
        message="Додайте ОВДП за її номером (ISIN), датою купівлі та сумою — і побачите графік виплат купонів."
      >
        <Button title="Додати ОВДП" onPress={() => router.push('/add')} />
        <Button
          title="Відновити з резервної копії"
          variant="secondary"
          onPress={() => router.navigate('/backup')}
        />
      </EmptyState>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        style={theme.background}
        contentContainerStyle={[screenContent, styles.listContent]}
        contentInsetAdjustmentBehavior="automatic"
        data={rows}
        keyExtractor={({ position }) => position.isin}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <StaleBondsNotice error={error} />

            <Card>
              <Typography variant="overline" tone="secondary">
                Наступна виплата
              </Typography>
              {nextDate ? (
                <>
                  <Typography variant="display" tabular tone="positive">
                    {formatTotals(nextGroup.map((p) => ({ currency: p.currency, value: p.total })))}
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {formatDate(nextDate)} · {formatDaysLeft(daysBetween(today, nextDate))}
                  </Typography>
                </>
              ) : (
                <Typography variant="body" weight="medium">
                  Усі виплати отримано
                </Typography>
              )}
              <Typography variant="caption1" tone="secondary" style={styles.summaryFoot}>
                Вкладено:{' '}
                {formatTotals(
                  rows.map((r) => ({
                    currency: r.bond?.currency ?? 'UAH',
                    value: r.position.amount,
                  })),
                )}
              </Typography>
            </Card>

            <SectionTitle title="Мої ОВДП" />
          </View>
        }
        renderItem={({ item: { position, bond, next }, index }) => (
          <SectionCell index={index} count={rows.length}>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/bond/[isin]', params: { isin: position.isin } })
              }
              accessibilityRole="link"
              style={({ pressed }) => [styles.holding, pressed && theme.muted]}
            >
              <View style={styles.holdingTop}>
                <Typography variant="headline" tabular>
                  {position.isin}
                </Typography>
                {bond && (
                  <Typography variant="caption1" tone="secondary">
                    {bond.rate}% · до {formatDate(bond.maturityDate)}
                  </Typography>
                )}
              </View>
              <Typography variant="caption1" tone="secondary">
                {position.quantity} шт · {formatMoney(position.amount, bond?.currency ?? 'UAH')} ·{' '}
                {position.lots.length === 1
                  ? `куплено ${formatDate(position.lots[0].purchaseDate)}`
                  : `${position.lots.length} ${plural(position.lots.length, 'покупка', 'покупки', 'покупок')}`}
              </Typography>
              <NextPaymentLine next={next} hasBond={!!bond} />
            </Pressable>
          </SectionCell>
        )}
        ListFooterComponent={<NbuSourceNote />}
      />
      <FloatingActionButton accessibilityLabel="Додати ОВДП" onPress={() => router.push('/add')} />
    </View>
  );
}

function NextPaymentLine({ next, hasBond }: { next?: PositionPayment; hasBond: boolean }) {
  if (!hasBond) {
    return (
      <Typography variant="caption1" tone="danger">
        Не знайдено в реєстрі НБУ
      </Typography>
    );
  }
  if (!next) {
    return (
      <Typography variant="caption1" tone="secondary">
        Погашено
      </Typography>
    );
  }
  return (
    <Typography variant="subhead" style={styles.nextLine}>
      Далі: {formatDate(next.date)} —{' '}
      <Typography variant="subhead" tone="positive">
        {formatMoney(next.total, next.currency)}
      </Typography>
    </Typography>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { gap: 0, paddingBottom: FAB_CLEARANCE },
  listHeader: { gap: 24, marginBottom: 6 },
  summaryFoot: { marginTop: 8 },
  holding: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  holdingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  nextLine: { marginTop: 2 },
});
