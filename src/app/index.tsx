import { Stack, router } from 'expo-router';
import { Fragment, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Button,
  HeaderButton,
  PaymentRow,
  Section,
  Separator,
  screenContent,
} from '@/components/ui';
import {
  daysBetween,
  formatDate,
  formatDaysLeft,
  formatMoney,
  formatTotals,
  plural,
  toISODate,
} from '@/lib/format';
import { useHoldings } from '@/lib/holdings';
import { type PositionPayment, groupPositions, nextPayment, positionPayments } from '@/lib/ovdp';
import { useBonds } from '@/lib/use-bonds';
import { useColors } from '@/theme/colors';

const UPCOMING_LIMIT = 8;

export default function PortfolioScreen() {
  const colors = useColors();
  const holdings = useHoldings();
  const { bonds, byIsin, isFetching, error, refresh } = useBonds();
  const today = toISODate(new Date());

  const rows = useMemo(
    () =>
      groupPositions(holdings).map((position) => {
        const bond = byIsin.get(position.isin);
        const payments = bond ? positionPayments(position.lots, bond, today) : [];
        return { position, bond, payments, next: nextPayment(payments) };
      }),
    [holdings, byIsin, today],
  );

  const upcoming = useMemo(
    () =>
      rows
        .flatMap((r) => r.payments.filter((p) => !p.isPaid))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [rows],
  );

  const addButton = <HeaderButton title="Додати" onPress={() => router.push('/add')} />;

  const backupButton = <HeaderButton title="Копія" onPress={() => router.push('/backup')} />;

  const header = (
    <Stack.Screen options={{ headerLeft: () => backupButton, headerRight: () => addButton }} />
  );

  if (!bonds && holdings.length > 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {header}
        {error ? (
          <>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Немає зв’язку з НБУ</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>{error}</Text>
            <Button title="Спробувати ще раз" onPress={refresh} style={styles.emptyButton} />
          </>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  }

  if (holdings.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {header}
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Гаманець порожній</Text>
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
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

  const nextDate = upcoming[0]?.date;
  const nextGroup = nextDate ? upcoming.filter((p) => p.date === nextDate) : [];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
    >
      {header}

      {error && (
        <Text style={[styles.inlineError, { color: colors.danger }]}>
          Не вдалося оновити дані НБУ — показано збережені.
        </Text>
      )}

      <View style={[styles.summary, { backgroundColor: colors.card }]}>
        <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Наступна виплата</Text>
        {nextDate ? (
          <>
            <Text style={[styles.summaryValue, { color: colors.positive }]}>
              {formatTotals(nextGroup.map((p) => ({ currency: p.currency, value: p.total })))}
            </Text>
            <Text style={[styles.summaryDate, { color: colors.text }]}>
              {formatDate(nextDate)} · {formatDaysLeft(daysBetween(today, nextDate))}
            </Text>
          </>
        ) : (
          <Text style={[styles.summaryDate, { color: colors.text }]}>Усі виплати отримано</Text>
        )}
        <Text style={[styles.summaryFoot, { color: colors.secondaryText }]}>
          Вкладено:{' '}
          {formatTotals(
            rows.map((r) => ({ currency: r.bond?.currency ?? 'UAH', value: r.position.amount })),
          )}
        </Text>
      </View>

      {upcoming.length > 0 && (
        <Section title="Найближчі виплати">
          {upcoming.slice(0, UPCOMING_LIMIT).map((payment, index) => (
            <Fragment key={`${payment.isin}-${payment.date}-${payment.type}`}>
              {index > 0 && <Separator />}
              <PaymentRow payment={payment} showIsin />
            </Fragment>
          ))}
          <Separator />
          <Pressable
            onPress={() => router.push('/schedule')}
            accessibilityRole="link"
            style={({ pressed }) => [styles.linkRow, pressed && { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.linkText, { color: colors.accent }]}>
              Графік виплат по місяцях
            </Text>
            <Text style={[styles.linkText, { color: colors.secondaryText }]}>›</Text>
          </Pressable>
        </Section>
      )}

      <Section title="Мої ОВДП">
        {rows.map(({ position, bond, next }, index) => (
          <Fragment key={position.isin}>
            {index > 0 && <Separator />}
            <Pressable
              onPress={() =>
                router.push({ pathname: '/bond/[isin]', params: { isin: position.isin } })
              }
              accessibilityRole="link"
              style={({ pressed }) => [
                styles.holding,
                pressed && { backgroundColor: colors.muted },
              ]}
            >
              <View style={styles.holdingTop}>
                <Text style={[styles.isin, { color: colors.text }]}>{position.isin}</Text>
                {bond && (
                  <Text style={[styles.rate, { color: colors.secondaryText }]}>
                    {bond.rate}% · до {formatDate(bond.maturityDate)}
                  </Text>
                )}
              </View>
              <Text style={[styles.caption, { color: colors.secondaryText }]}>
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

      <Text style={[styles.source, { color: colors.secondaryText }]}>
        Графіки виплат — з депозитарію НБУ.{' '}
        {Platform.OS === 'web' ? (
          <Text style={{ color: colors.accent }} onPress={refresh} accessibilityRole="button">
            {isFetching ? 'Оновлюємо…' : 'Оновити'}
          </Text>
        ) : (
          'Потягніть донизу, щоб оновити.'
        )}
      </Text>
    </ScrollView>
  );
}

function NextPaymentLine({ next, hasBond }: { next?: PositionPayment; hasBond: boolean }) {
  const colors = useColors();
  if (!hasBond) {
    return (
      <Text style={[styles.caption, { color: colors.danger }]}>Не знайдено в реєстрі НБУ</Text>
    );
  }
  if (!next) {
    return <Text style={[styles.caption, { color: colors.secondaryText }]}>Погашено</Text>;
  }
  return (
    <Text style={[styles.nextLine, { color: colors.text }]}>
      Далі: {formatDate(next.date)} —{' '}
      <Text style={{ color: colors.positive }}>{formatMoney(next.total, next.currency)}</Text>
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
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkText: { fontSize: 16 },
});
