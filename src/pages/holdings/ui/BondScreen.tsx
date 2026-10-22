import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BondTerms, ScheduleEventRow, purchaseCurrency } from '@/entities/portfolio';
import { formatDate, formatMoney, round2 } from '@/shared/lib';
import {
  Button,
  Card,
  EmptyState,
  FAB_CLEARANCE,
  FloatingActionButton,
  InfoRow,
  ScreenScrollView,
  Section,
  Separator,
  Typography,
} from '@/shared/ui';
import { useBondDetails } from '../model/useBondDetails.hook';

/** A bond in the wallet: the issue's terms, what the position has cost and earned, its purchases and payments. */
export default function BondScreen() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const {
    today,
    position,
    bond,
    payments,
    currency,
    hasTopUps,
    received,
    expected,
    profit,
    canTopUp,
    deletePurchase,
    deletePosition,
  } = useBondDetails(isin);

  if (!position) return <EmptyState message="У гаманці немає цієї ОВДП" />;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: position.isin }} />
      <ScreenScrollView contentContainerStyle={canTopUp && styles.withFab}>
        <Card>
          {bond ? (
            <BondTerms bond={bond} />
          ) : (
            <Typography variant="footnote" tone="danger">
              Цієї ОВДП немає в даних НБУ — параметри випуску й графік виплат недоступні.
            </Typography>
          )}
        </Card>

        <Section title="Підсумок">
          <InfoRow label="Кількість" value={`${position.quantity} шт`} />
          <Separator />
          <InfoRow label="Вкладено" value={formatMoney(position.investedAmount, currency)} />
          {hasTopUps && (
            <>
              <Separator />
              <InfoRow
                label="Середня ціна 1 шт"
                value={formatMoney(round2(position.investedAmount / position.quantity), currency)}
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

        <Section title={`Покупки (${position.purchases.length})`}>
          {position.purchases.map((purchase, index) => (
            <Fragment key={purchase.id}>
              {index > 0 && <Separator />}
              <View style={styles.purchase}>
                <View style={styles.purchaseInfo}>
                  <Typography variant="callout" tabular>
                    {formatDate(purchase.purchaseDate)} · {purchase.quantity} шт
                  </Typography>
                  {purchase.purchaseDate > today && (
                    <Typography variant="caption1" tone="accent">
                      Заплановано — виплати після цієї дати
                    </Typography>
                  )}
                  <Typography variant="caption1" tone="secondary">
                    {formatMoney(purchase.amount, purchaseCurrency(purchase, bond))} · по{' '}
                    {formatMoney(
                      round2(purchase.amount / purchase.quantity),
                      purchaseCurrency(purchase, bond),
                    )}
                  </Typography>
                </View>
                <Pressable
                  onPress={() => deletePurchase(purchase)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Видалити покупку від ${formatDate(purchase.purchaseDate)}`}
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
          <Section
            title={`Виплати (${payments.length})`}
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
                  <ScheduleEventRow event={payment} showQuantity={hasTopUps} />
                </Fragment>
              ))
            )}
          </Section>
        )}

        <Button title="Видалити з гаманця" variant="destructive" onPress={deletePosition} />
      </ScreenScrollView>
      {canTopUp && (
        <FloatingActionButton
          accessibilityLabel={`Докупити ${position.isin}`}
          onPress={() =>
            router.push({
              pathname: '/add/[isin]',
              params: { isin: position.isin, topUp: '1' },
            })
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  withFab: { paddingBottom: FAB_CLEARANCE },
  purchase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  purchaseInfo: { flex: 1, gap: theme.space.xxs },
  pressed: { opacity: 0.5 },
  empty: { padding: theme.space.lg },
}));
