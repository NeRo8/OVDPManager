import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { Button, SectionCell, SectionTitle, Typography, screenContent } from '@/shared/ui';
import {
  daysBetween,
  formatDate,
  formatDaysLeft,
  formatMoney,
  formatTotals,
  plural,
} from '@/shared/lib';
import type { PositionPayment } from '@/entities/portfolio';
import { usePortfolio } from '../model/usePortfolio.hook';
import { themeStyles } from '@/shared/theme';

export default function PortfolioScreen() {
  const theme = themeStyles;
  const { holdingsCount, bonds, isFetching, error, refresh, today, rows, nextDate, nextGroup } =
    usePortfolio();

  if (!bonds && holdingsCount > 0) {
    return (
      <View style={[styles.center, theme.background]}>
        {error ? (
          <>
            <Typography variant="title2" align="center">
              Немає зв’язку з НБУ
            </Typography>
            <Typography variant="subhead" align="center" tone="secondary" style={styles.emptyText}>
              {error}
            </Typography>
            <Button title="Спробувати ще раз" onPress={refresh} style={styles.emptyButton} />
          </>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  }

  if (holdingsCount === 0) {
    return (
      <View style={[styles.center, theme.background]}>
        <Typography variant="title2" align="center">
          Гаманець порожній
        </Typography>
        <Typography variant="subhead" align="center" tone="secondary" style={styles.emptyText}>
          Додайте ОВДП за її номером (ISIN), датою купівлі та сумою — і побачите графік виплат
          купонів.
        </Typography>
        <Button
          title="Додати ОВДП"
          onPress={() => router.push('/add')}
          style={styles.emptyButton}
        />
        <Button
          title="Відновити з резервної копії"
          variant="secondary"
          onPress={() => router.push('/backup')}
          style={styles.emptyRestore}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={theme.background}
      contentContainerStyle={[screenContent, styles.listContent]}
      contentInsetAdjustmentBehavior="automatic"
      data={rows}
      keyExtractor={({ position }) => position.isin}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          {error && (
            <Typography variant="caption1" align="center" tone="danger">
              Не вдалося оновити дані НБУ — показано збережені.
            </Typography>
          )}

          <View style={[styles.summary, theme.card]}>
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
          </View>

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
      ListFooterComponent={
        <Typography variant="caption2" align="center" tone="secondary" style={styles.source}>
          Графіки виплат — з депозитарію НБУ. Потягніть донизу, щоб оновити.
        </Typography>
      }
    />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyText: { lineHeight: 21, maxWidth: 400 },
  emptyButton: { marginTop: 16, alignSelf: 'center', width: '100%', maxWidth: 400 },
  emptyRestore: { alignSelf: 'center', width: '100%', maxWidth: 400 },
  listContent: { gap: 0 },
  listHeader: { gap: 24, marginBottom: 6 },
  summary: { borderRadius: 12, borderCurve: 'continuous', padding: 16, gap: 4 },
  summaryFoot: { marginTop: 8 },
  holding: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  holdingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  nextLine: { marginTop: 2 },
  source: { marginTop: 24 },
});
