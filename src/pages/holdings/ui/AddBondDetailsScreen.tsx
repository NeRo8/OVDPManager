import { Stack, router, useLocalSearchParams } from 'expo-router';
import { FlatList, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BondParameters, BondsGate, type BondPayment, useWallet } from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';
import {
  EmptyState,
  FAB_CLEARANCE,
  FloatingActionButton,
  InfoRow,
  Section,
  SectionCell,
  SectionTitle,
  Typography,
  screenContent,
} from '@/shared/ui';

/** The chosen issue's terms and NBU payments before a purchase is entered. */
export default function AddBondDetailsScreen() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const { byIsin, positions } = useWallet();
  const bond = byIsin.get(isin);
  const ownedQuantity =
    positions.find(({ position }) => position.isin === isin)?.position.quantity ?? 0;
  const addPurchase = () => router.push({ pathname: '/add/[isin]/purchase', params: { isin } });
  const header = <Stack.Screen options={{ title: isin }} />;

  if (!bond)
    return (
      <>
        {header}
        <BondsGate>
          <EmptyState icon="search-outline" title={isin} message="Цієї ОВДП немає в даних НБУ." />
        </BondsGate>
      </>
    );

  const renderPayment = ({ item, index }: { item: BondPayment; index: number }) => (
    <SectionCell index={index} count={bond.payments.length}>
      <InfoRow
        label={`${item.type === 'coupon' ? 'Купон' : 'Погашення'} · ${formatDate(item.date)}`}
        value={formatMoney(item.amount, bond.currency)}
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
                <Section
                  title="ОВДП"
                  footer={
                    ownedQuantity > 0 ? `У гаманці вже є ${ownedQuantity} шт цієї ОВДП.` : undefined
                  }
                >
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
                message="НБУ ще не опублікував виплати для цієї ОВДП."
              />
            }
          />
          <FloatingActionButton
            accessibilityLabel={ownedQuantity > 0 ? `Докупити ${isin}` : `Додати купівлю ${isin}`}
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
