import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  Card,
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
  NbuSourceNote,
  StaleBondsNotice,
  WalletGate,
  type PositionPayment,
} from '@/entities/portfolio';
import { usePortfolio } from '../model/usePortfolio.hook';

export default function PortfolioScreen() {
  const portfolio = usePortfolio();
  const { isFetching, error, refresh, today, positions, nextDate, nextGroup } = portfolio;

  return (
    <WalletGate wallet={portfolio}>
      <View style={styles.screen}>
        <FlatList
          style={styles.list}
          contentContainerStyle={[screenContent, styles.listContent]}
          contentInsetAdjustmentBehavior="automatic"
          data={positions}
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
                      {formatTotals(
                        nextGroup.map((p) => ({ currency: p.currency, value: p.total })),
                      )}
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
                    positions.map((r) => ({
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
            <SectionCell index={index} count={positions.length}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/bond/[isin]', params: { isin: position.isin } })
                }
                accessibilityRole="link"
                style={({ pressed }) => [styles.holding, pressed && styles.pressed]}
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
        <FloatingActionButton
          accessibilityLabel="Додати ОВДП"
          onPress={() => router.push('/add')}
        />
      </View>
    </WalletGate>
  );
}

type NextPaymentLineProps = {
  next?: PositionPayment;
  hasBond: boolean;
};

function NextPaymentLine({ next, hasBond }: NextPaymentLineProps) {
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

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  list: { backgroundColor: theme.background },
  listContent: { gap: 0, paddingBottom: FAB_CLEARANCE },
  listHeader: { gap: 24, marginBottom: 6 },
  summaryFoot: { marginTop: 8 },
  holding: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  pressed: { backgroundColor: theme.muted },
  holdingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  nextLine: { marginTop: 2 },
}));
