import { FlatList, View } from 'react-native';

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { FAB_CLEARANCE, FloatingActionButton } from '@/components/button/FloatingActionButton';
import { EmptyState } from '@/components/layout/EmptyState';
import { InfoRow } from '@/components/layout/InfoRow';
import { screenContent } from '@/components/layout/screenContent';
import { Section } from '@/components/layout/Section';
import { SectionCell } from '@/components/layout/SectionCell';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BondParameters } from '@/components/portfolio/BondParameters';
import { BondsGate } from '@/components/portfolio/BondsGate';
import { Money } from '@/components/typography/Money';
import { Typography } from '@/components/typography/Typography';
import { useWallet } from '@/hooks/useWallet.hook';
import { type BondPayment, canBuyOn, isRedeemed } from '@/lib/portfolio/portfolio';
import { hasRedemption } from '@/lib/portfolio/position';
import { formatDate } from '@/utils/date';

import { hasMadePurchase } from './purchaseScreenTitle';

/** The chosen issue's terms and NBU payments before a purchase is entered. */
export default function AddBondDetailsScreen() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const { byIsin, positions, today } = useWallet();
  const bond = byIsin.get(isin);
  const owned = positions.find(({ position }) => position.isin === isin);
  const ownedQuantity = owned?.position.quantity ?? 0;
  const plannedQuantity = owned?.planned.quantity ?? 0;
  const isTopUp = hasMadePurchase(owned?.position.operations ?? []);
  const addPurchase = () => router.push({ pathname: '/add/[isin]/purchase', params: { isin } });
  const header = <Stack.Screen options={{ title: isin }} />;

  if (!bond)
    return (
      <>
        {header}
        <BondsGate>
          <EmptyState
            icon="search-outline"
            title={isin}
            message="Цієї облігації немає в даних НБУ."
          />
        </BondsGate>
      </>
    );

  const notes = [
    ownedQuantity > 0 &&
      `У гаманці вже є ${ownedQuantity} шт цієї облігації${plannedQuantity > 0 ? `, з них ${plannedQuantity} — заплановані купівлі` : ''}.`,
    !canBuyOn(bond, today) &&
      (isRedeemed(bond, today)
        ? 'Облігація вже погашена; можна додати купівлю з минулою датою.'
        : 'Облігація погашається сьогодні; можна додати купівлю з минулою датою.'),
    !hasRedemption(bond) && 'НБУ ще не опублікував погашення: розрахунки виплат неповні.',
    'Дохідність залежить від ціни купівлі: її буде розраховано після введення суми й кількості.',
  ]
    .filter(Boolean)
    .join(' ');

  const renderPayment = ({ item, index }: { item: BondPayment; index: number }) => (
    <SectionCell index={index} count={bond.payments.length}>
      <InfoRow
        label={`${item.type === 'coupon' ? 'Купон' : 'Погашення'} · ${formatDate(item.date)}`}
        value={<Money value={item.amount} currency={bond.currency} />}
      />
    </SectionCell>
  );

  return (
    <>
      {header}
      <BondsGate>
        <View style={styles.screen}>
          <FlatList
            data={bond.payments}
            keyExtractor={(payment) => `${payment.date}-${payment.type}`}
            renderItem={renderPayment}
            style={styles.list}
            contentContainerStyle={[screenContent, styles.content]}
            contentInsetAdjustmentBehavior="automatic"
            ListHeaderComponent={
              <View style={styles.header}>
                <Section title="Облігація" footer={notes || undefined}>
                  <InfoRow label="ISIN" value={bond.isin} />
                </Section>
                <BondParameters bond={bond} />
                <View style={styles.paymentsHeading}>
                  <SectionTitle title="Виплати на 1 шт" />
                  <Typography variant="caption1" tone="secondary">
                    Виплати за даними НБУ. Які з них належатимуть вам, залежить від дати купівлі.
                  </Typography>
                </View>
              </View>
            }
            ListEmptyComponent={
              <EmptyState
                layout="inline"
                icon="calendar-outline"
                title="Даних про виплати немає"
                message="НБУ ще не опублікував виплати для цієї облігації."
              />
            }
          />
          <FloatingActionButton
            accessibilityLabel={isTopUp ? `Докупити ${isin}` : `Додати купівлю ${isin}`}
            onPress={addPurchase}
          />
        </View>
      </BondsGate>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  list: { backgroundColor: theme.background },
  content: { gap: 0, paddingBottom: FAB_CLEARANCE },
  header: { gap: theme.space.xl, marginBottom: theme.space.sm },
  paymentsHeading: { gap: theme.space.sm },
}));
