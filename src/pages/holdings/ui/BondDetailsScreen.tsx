import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  Button,
  EmptyState,
  FAB_CLEARANCE,
  FloatingActionButton,
  InfoRow,
  Section,
  Separator,
  Typography,
  ScreenScrollView,
} from '@/shared/ui';
import { formatDate, formatMoney, round2 } from '@/shared/lib';
import { PaymentRow } from '@/entities/portfolio';
import { useBondDetails } from '../model/useBondDetails.hook';

export default function PositionScreen() {
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

  if (!position) return <EmptyState message="У гаманці немає цієї ОВДП" />;

  return (
    <View style={styles.screen}>
      <ScreenScrollView contentContainerStyle={canTopUp && styles.withFab}>
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
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Typography variant="subhead" tone="danger">
                    Видалити
                  </Typography>
                </Pressable>
              </View>
            </Fragment>
          ))}
        </Section>

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
      </ScreenScrollView>
      {canTopUp && (
        <FloatingActionButton
          accessibilityLabel={`Докупити ${position.isin}`}
          onPress={() => router.push({ pathname: '/add', params: { isin: position.isin } })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  withFab: { paddingBottom: FAB_CLEARANCE },
  empty: { padding: 16 },
  lot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lotInfo: { flex: 1, gap: 2 },
  pressed: { opacity: 0.5 },
});
