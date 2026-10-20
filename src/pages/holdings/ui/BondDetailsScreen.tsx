import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, InfoRow, Section, Separator, Typography, screenContent } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/lib';
import { PaymentRow } from '@/entities/portfolio';
import { round2 } from '@/shared/lib/number';
import { useBondDetails } from '../model/useBondDetails.hook';
import { themeStyles } from '@/shared/theme';

export default function PositionScreen() {
  const theme = themeStyles;
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const {
    position,
    bond,
    payments,
    currency,
    hasTopUps,
    received,
    expected,
    profit,
    canTopUp,
    deleteLot,
    deletePosition,
  } = useBondDetails(isin);

  if (!position) {
    return (
      <View style={[styles.center, theme.background]}>
        <Typography variant="subhead" tone="secondary">
          У гаманці немає цієї ОВДП
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView
      style={theme.background}
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
                <Typography
                  variant="subhead"
                  weight="semibold"
                  tone={profit >= 0 ? 'positive' : 'danger'}
                >
                  {formatMoney(profit, currency)}
                </Typography>
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
            <Typography variant="subhead" align="center" tone="secondary" style={styles.empty}>
              Після дати купівлі виплат немає
            </Typography>
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
        <Typography variant="subhead" align="center" tone="danger" style={styles.empty}>
          Цієї ОВДП немає в даних НБУ — графік виплат недоступний.
        </Typography>
      )}

      <View style={styles.group}>
        <Section title={hasTopUps ? `Покупки (${position.lots.length})` : 'Покупка'}>
          {position.lots.map((lot, index) => (
            <Fragment key={lot.id}>
              {index > 0 && <Separator />}
              <View style={styles.lot}>
                <View style={styles.lotInfo}>
                  <Typography variant="callout" tabular>
                    {formatDate(lot.purchaseDate)} · {lot.quantity} шт
                  </Typography>
                  <Typography variant="caption1" tone="secondary">
                    {formatMoney(lot.amount, currency)} · по{' '}
                    {formatMoney(round2(lot.amount / lot.quantity), currency)}
                  </Typography>
                </View>
                <Pressable
                  onPress={() => deleteLot(lot)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Видалити покупку від ${formatDate(lot.purchaseDate)}`}
                  style={({ pressed }) => pressed && { opacity: 0.5 }}
                >
                  <Typography variant="subhead" tone="danger">
                    Видалити
                  </Typography>
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
  empty: { padding: 16 },
  lot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lotInfo: { flex: 1, gap: 2 },
});
