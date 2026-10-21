import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  Button,
  EmptyState,
  FAB_CLEARANCE,
  FloatingActionButton,
  InfoRow,
  Section,
  SegmentedSelect,
  Separator,
  Typography,
  ScreenScrollView,
} from '@/shared/ui';
import { formatDate, formatMoney, round2 } from '@/shared/lib';
import {
  BondParameters,
  PaymentRow,
  type Currency,
  type Holding,
  type PositionPayment,
} from '@/entities/portfolio';
import { useBondDetails } from '../model/useBondDetails.hook';

type DetailsTab = 'payments' | 'purchases';

/** A bond in the wallet: the issue's terms, what it has earned, then its payments or purchases. */
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
  const [tab, setTab] = useState<DetailsTab>('payments');

  if (!position) return <EmptyState message="У гаманці немає цієї ОВДП" />;

  const tabOptions: { label: string; value: DetailsTab }[] = [
    { label: bond ? `Виплати (${payments.length})` : 'Виплати', value: 'payments' },
    { label: `Покупки (${position.lots.length})`, value: 'purchases' },
  ];

  return (
    <View style={styles.screen}>
      <ScreenScrollView contentContainerStyle={canTopUp && styles.withFab}>
        <Stack.Screen options={{ title: position.isin }} />

        {bond ? (
          <BondParameters bond={bond} />
        ) : (
          <Typography variant="subhead" align="center" tone="danger">
            Цієї ОВДП немає в даних НБУ — параметри випуску й графік виплат недоступні.
          </Typography>
        )}

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

        <View style={styles.tabs}>
          <SegmentedSelect options={tabOptions} value={tab} onChange={setTab} />
          {tab === 'payments' ? (
            <PaymentsTab payments={bond ? payments : null} hasTopUps={hasTopUps} />
          ) : (
            <PurchasesTab lots={position.lots} currency={currency} onDelete={deleteLot} />
          )}
        </View>

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

type PaymentsTabProps = {
  /** Null when the NBU data has no such bond */
  payments: PositionPayment[] | null;
  hasTopUps: boolean;
};

function PaymentsTab({ payments, hasTopUps }: PaymentsTabProps) {
  if (!payments) {
    return (
      <Typography variant="subhead" align="center" tone="secondary" style={styles.empty}>
        Графік виплат недоступний без даних НБУ.
      </Typography>
    );
  }
  return (
    <Section
      footer={hasTopUps ? 'Кожна виплата враховує лише облігації, куплені до її дати.' : undefined}
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
  );
}

type PurchasesTabProps = {
  lots: Holding[];
  currency: Currency;
  onDelete: (lot: Holding) => void;
};

function PurchasesTab({ lots, currency, onDelete }: PurchasesTabProps) {
  return (
    <Section>
      {lots.map((lot, index) => (
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
              onPress={() => onDelete(lot)}
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  withFab: { paddingBottom: FAB_CLEARANCE },
  tabs: { gap: 12 },
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
