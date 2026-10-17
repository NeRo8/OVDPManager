import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Fragment, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, InfoRow, PaymentRow, Section, Separator, screenContent } from '@/components/ui';
import { confirmDestructive } from '@/lib/confirm';
import { formatDate, formatMoney, toISODate } from '@/lib/format';
import { removeHolding, removePosition, useHoldings } from '@/lib/holdings';
import { goBackOrHome } from '@/lib/navigation';
import { type Holding, groupPositions, positionPayments, round2 } from '@/lib/ovdp';
import { useBonds } from '@/lib/use-bonds';
import { useColors } from '@/theme/colors';

export default function PositionScreen() {
  const colors = useColors();
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const holdings = useHoldings();
  const { byIsin } = useBonds();
  const today = toISODate(new Date());
  const bond = byIsin.get(isin);

  const position = useMemo(
    () => groupPositions(holdings.filter((h) => h.isin === isin))[0],
    [holdings, isin],
  );
  const payments = useMemo(
    () => (position && bond ? positionPayments(position.lots, bond, today) : []),
    [position, bond, today],
  );

  if (!position) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.secondaryText }}>У гаманці немає цієї ОВДП</Text>
      </View>
    );
  }

  const currency = bond?.currency ?? 'UAH';
  const hasTopUps = position.lots.length > 1;
  const received = round2(payments.filter((p) => p.isPaid).reduce((s, p) => s + p.total, 0));
  const expected = round2(payments.filter((p) => !p.isPaid).reduce((s, p) => s + p.total, 0));
  const profit = round2(received + expected - position.amount);
  const canTopUp = !bond || bond.maturityDate > today;

  function deleteLot(lot: Holding) {
    confirmDestructive(
      'Видалити покупку?',
      `${formatDate(lot.purchaseDate)} · ${lot.quantity} шт · ${formatMoney(lot.amount, currency)}`,
      'Видалити',
      () => {
        // The screen has nothing to show once the last purchase is gone.
        if (position.lots.length === 1) goBackOrHome();
        removeHolding(lot.id);
      },
    );
  }

  function deletePosition() {
    confirmDestructive(
      'Видалити ОВДП?',
      `${position.isin} і всі покупки (${position.lots.length}) буде видалено з гаманця.`,
      'Видалити',
      () => {
        goBackOrHome();
        removePosition(position.isin);
      },
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Stack.Screen options={{ title: position.isin }} />

      <Section title="Підсумок">
        <InfoRow label="Кількість" value={`${position.quantity} шт`} />
        <Separator />
        <InfoRow label="Вкладено" value={formatMoney(position.amount, currency)} />
        {hasTopUps && (
          <>
            <Separator />
            <InfoRow
              label="Середня ціна 1 шт"
              value={formatMoney(round2(position.amount / position.quantity), currency)}
            />
          </>
        )}
        {bond && (
          <>
            <Separator />
            <InfoRow label="Отримано" value={formatMoney(received, currency)} />
            <Separator />
            <InfoRow label="Очікується" value={formatMoney(expected, currency)} />
            <Separator />
            <InfoRow
              label="Чистий дохід"
              value={
                <Text
                  style={[styles.profit, { color: profit >= 0 ? colors.positive : colors.danger }]}
                >
                  {formatMoney(profit, currency)}
                </Text>
              }
            />
          </>
        )}
      </Section>

      {bond ? (
        <Section
          title="Графік виплат"
          footer={
            hasTopUps ? 'Кожна виплата враховує лише облігації, куплені до її дати.' : undefined
          }
        >
          {payments.length === 0 ? (
            <Text style={[styles.empty, { color: colors.secondaryText }]}>
              Після дати купівлі виплат немає
            </Text>
          ) : (
            payments.map((payment, index) => (
              <Fragment key={`${payment.date}-${payment.type}`}>
                {index > 0 && <Separator />}
                <PaymentRow payment={payment} showQuantity={hasTopUps} />
              </Fragment>
            ))
          )}
        </Section>
      ) : (
        <Text style={[styles.empty, { color: colors.danger }]}>
          Цієї ОВДП немає в даних НБУ — графік виплат недоступний.
        </Text>
      )}

      <View style={styles.group}>
        <Section title={hasTopUps ? `Покупки (${position.lots.length})` : 'Покупка'}>
          {position.lots.map((lot, index) => (
            <Fragment key={lot.id}>
              {index > 0 && <Separator />}
              <View style={styles.lot}>
                <View style={styles.lotInfo}>
                  <Text style={[styles.lotDate, { color: colors.text }]}>
                    {formatDate(lot.purchaseDate)} · {lot.quantity} шт
                  </Text>
                  <Text style={[styles.caption, { color: colors.secondaryText }]}>
                    {formatMoney(lot.amount, currency)} · по{' '}
                    {formatMoney(round2(lot.amount / lot.quantity), currency)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => deleteLot(lot)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Видалити покупку від ${formatDate(lot.purchaseDate)}`}
                  style={({ pressed }) => pressed && { opacity: 0.5 }}
                >
                  <Text style={[styles.lotDelete, { color: colors.danger }]}>Видалити</Text>
                </Pressable>
              </View>
            </Fragment>
          ))}
        </Section>
        {canTopUp && (
          <Button
            title="Докупити"
            onPress={() => router.push({ pathname: '/add', params: { isin: position.isin } })}
          />
        )}
      </View>

      {bond && (
        <Section title="Параметри випуску">
          <InfoRow label="Ставка купону" value={`${bond.rate}% річних`} />
          <Separator />
          <InfoRow label="Номінал" value={formatMoney(bond.nominal, bond.currency)} />
          <Separator />
          <InfoRow label="Розміщення" value={formatDate(bond.issueDate)} />
          <Separator />
          <InfoRow label="Погашення" value={formatDate(bond.maturityDate)} />
          <Separator />
          <InfoRow label="Тип" value={bond.description} />
        </Section>
      )}

      <Button title="Видалити з гаманця" variant="destructive" onPress={deletePosition} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  group: { gap: 12 },
  profit: { fontSize: 15, fontWeight: '600' },
  empty: { fontSize: 15, padding: 16, textAlign: 'center' },
  lot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lotInfo: { flex: 1, gap: 2 },
  lotDate: { fontSize: 16, fontWeight: '500', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 13 },
  lotDelete: { fontSize: 15 },
});
