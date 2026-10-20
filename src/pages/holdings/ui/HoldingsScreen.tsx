import { router } from 'expo-router';
import { Fragment } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Section, Separator, screenContent } from '@/shared/ui';
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
            <Text style={[styles.emptyTitle, theme.text]}>Немає зв’язку з НБУ</Text>
            <Text style={[styles.emptyText, theme.secondaryText]}>{error}</Text>
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
        <Text style={[styles.emptyTitle, theme.text]}>Гаманець порожній</Text>
        <Text style={[styles.emptyText, theme.secondaryText]}>
          Додайте ОВДП за її номером (ISIN), датою купівлі та сумою — і побачите графік виплат
          купонів.
        </Text>
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
    <ScrollView
      style={theme.background}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
    >
      {error && (
        <Text style={[styles.inlineError, theme.dangerText]}>
          Не вдалося оновити дані НБУ — показано збережені.
        </Text>
      )}

      <View style={[styles.summary, theme.card]}>
        <Text style={[styles.summaryLabel, theme.secondaryText]}>Наступна виплата</Text>
        {nextDate ? (
          <>
            <Text style={[styles.summaryValue, theme.positiveText]}>
              {formatTotals(nextGroup.map((p) => ({ currency: p.currency, value: p.total })))}
            </Text>
            <Text style={[styles.summaryDate, theme.text]}>
              {formatDate(nextDate)} · {formatDaysLeft(daysBetween(today, nextDate))}
            </Text>
          </>
        ) : (
          <Text style={[styles.summaryDate, theme.text]}>Усі виплати отримано</Text>
        )}
        <Text style={[styles.summaryFoot, theme.secondaryText]}>
          Вкладено:{' '}
          {formatTotals(
            rows.map((r) => ({ currency: r.bond?.currency ?? 'UAH', value: r.position.amount })),
          )}
        </Text>
      </View>

      <Section title="Мої ОВДП">
        {rows.map(({ position, bond, next }, index) => (
          <Fragment key={position.isin}>
            {index > 0 && <Separator />}
            <Pressable
              onPress={() =>
                router.push({ pathname: '/bond/[isin]', params: { isin: position.isin } })
              }
              accessibilityRole="link"
              style={({ pressed }) => [styles.holding, pressed && theme.muted]}
            >
              <View style={styles.holdingTop}>
                <Text style={[styles.isin, theme.text]}>{position.isin}</Text>
                {bond && (
                  <Text style={[styles.rate, theme.secondaryText]}>
                    {bond.rate}% · до {formatDate(bond.maturityDate)}
                  </Text>
                )}
              </View>
              <Text style={[styles.caption, theme.secondaryText]}>
                {position.quantity} шт · {formatMoney(position.amount, bond?.currency ?? 'UAH')} ·{' '}
                {position.lots.length === 1
                  ? `куплено ${formatDate(position.lots[0].purchaseDate)}`
                  : `${position.lots.length} ${plural(position.lots.length, 'покупка', 'покупки', 'покупок')}`}
              </Text>
              <NextPaymentLine next={next} hasBond={!!bond} />
            </Pressable>
          </Fragment>
        ))}
      </Section>

      <Text style={[styles.source, theme.secondaryText]}>
        Графіки виплат — з депозитарію НБУ. Потягніть донизу, щоб оновити.
      </Text>
    </ScrollView>
  );
}

function NextPaymentLine({ next, hasBond }: { next?: PositionPayment; hasBond: boolean }) {
  const theme = themeStyles;
  if (!hasBond) {
    return <Text style={[styles.caption, theme.dangerText]}>Не знайдено в реєстрі НБУ</Text>;
  }
  if (!next) {
    return <Text style={[styles.caption, theme.secondaryText]}>Погашено</Text>;
  }
  return (
    <Text style={[styles.nextLine, theme.text]}>
      Далі: {formatDate(next.date)} —{' '}
      <Text style={theme.positiveText}>{formatMoney(next.total, next.currency)}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 21, maxWidth: 400 },
  emptyButton: { marginTop: 16, alignSelf: 'center', width: '100%', maxWidth: 400 },
  emptyRestore: { alignSelf: 'center', width: '100%', maxWidth: 400 },
  inlineError: { fontSize: 13, textAlign: 'center' },
  summary: { borderRadius: 12, borderCurve: 'continuous', padding: 16, gap: 4 },
  summaryLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryValue: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  summaryDate: { fontSize: 17, fontWeight: '500' },
  summaryFoot: { fontSize: 13, marginTop: 8 },
  holding: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  holdingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  isin: { fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  rate: { fontSize: 13 },
  caption: { fontSize: 13 },
  nextLine: { fontSize: 15, marginTop: 2 },
  source: { fontSize: 12, textAlign: 'center' },
});
