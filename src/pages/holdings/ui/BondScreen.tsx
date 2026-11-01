import { useState } from 'react';
import { FlatList, type ListRenderItemInfo, View } from 'react-native';

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import {
  BondTerms,
  type PositionPayment,
  type Purchase,
  ScheduleEventRow,
} from '@/entities/portfolio';

import {
  Button,
  Card,
  EmptyState,
  FAB_CLEARANCE,
  FloatingActionButton,
  SectionCell,
  SegmentedSelect,
  Typography,
  screenContent,
} from '@/shared/ui';

import { useBondDetails } from '../model/useBondDetails.hook';
import { useHoldOrSell } from '../model/useHoldOrSell.hook';

import { HintsSection } from './HintsSection';
import { PositionSummary } from './PositionSummary';
import { PurchaseRow } from './PurchaseRow';
import { SaleButton } from './SaleButton';

type BondRow = Purchase | PositionPayment;
type BondTab = 'purchases' | 'payments';

const isPurchase = (row: BondRow): row is Purchase => 'purchaseDate' in row;
const keyOf = (row: BondRow) => (isPurchase(row) ? row.id : `${row.date}-${row.type}`);

function assessmentMessage(hasBond: boolean, onlyPlannedPurchases: boolean, matured: boolean) {
  if (!hasBond) return 'Оцінка недоступна без даних НБУ.';
  if (onlyPlannedPurchases) return 'Оцінка з’явиться для зроблених купівель.';
  if (matured) return 'Оцінка недоступна від дня погашення ОВДП.';
  return 'Оцінка недоступна без опублікованого погашення.';
}

function emptyPaymentsMessage(hasBond: boolean, paymentCount: number) {
  if (!hasBond)
    return 'Цієї ОВДП немає в даних НБУ, тож графіка виплат немає. Він з’явиться, щойно дані оновляться.';
  if (paymentCount > 0)
    return 'Усі виплати за графіком НБУ припадають на дати до купівлі, тож цій купівлі вони не належать.';
  return 'НБУ ще не опублікував графік виплат цієї ОВДП.';
}

/**
 * A bond in the wallet: its terms, result and whether to keep or sell it, with purchases and
 * payments on separate tabs.
 */
export default function BondScreen() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const [tab, setTab] = useState<BondTab>('payments');
  const {
    today,
    position,
    bond,
    payments,
    currency,
    hasTopUps,
    results,
    planned,
    canTopUp,
    deletePurchase,
    deletePosition,
  } = useBondDetails(isin);
  const { assessment } = useHoldOrSell(isin, null);

  if (!position || !currency)
    return <EmptyState icon="search-outline" message="У гаманці немає цієї ОВДП" />;

  const tabs: { label: string; value: BondTab }[] = [
    { label: `Виплати (${payments.length})`, value: 'payments' },
    { label: `Купівлі (${position.purchases.length})`, value: 'purchases' },
  ];
  const rows: BondRow[] = tab === 'purchases' ? position.purchases : payments;

  const topUp = () =>
    router.push({ pathname: '/add/[isin]/purchase', params: { isin: position.isin } });
  const openPurchase = (purchase: Purchase) =>
    router.push({
      pathname: '/add/[isin]/purchase',
      params: { isin: position.isin, purchaseId: purchase.id },
    });

  const renderItem = ({ item, index }: ListRenderItemInfo<BondRow>) => (
    <SectionCell index={index} count={rows.length}>
      {isPurchase(item) ? (
        <PurchaseRow
          purchase={item}
          bond={bond}
          today={today}
          onEdit={openPurchase}
          onDelete={deletePurchase}
        />
      ) : (
        <ScheduleEventRow event={item} showQuantity={hasTopUps} />
      )}
    </SectionCell>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: position.isin,
          headerRight: assessment ? () => <SaleButton isin={position.isin} /> : undefined,
        }}
      />
      <FlatList
        data={rows}
        style={styles.list}
        contentContainerStyle={[screenContent, styles.content, canTopUp && styles.withFab]}
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={keyOf}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Card>
              {bond ? (
                <BondTerms bond={bond} />
              ) : (
                <Typography variant="footnote" tone="warning">
                  Цієї ОВДП немає в даних НБУ — параметри випуску й графік виплат недоступні.
                </Typography>
              )}
            </Card>
            <PositionSummary
              position={position}
              currency={currency}
              hasTopUps={hasTopUps}
              results={results}
              planned={planned}
            />
            {assessment && assessment.hints.length > 0 ? (
              <HintsSection
                title="Тримати чи продати"
                footer="Порівняння з новими ОВДП тієї ж валюти й строку, розміщеними за останні 12 місяців; без них — з обліковою ставкою НБУ сьогодні. Ціни, за яких продаж вигідний, — на екрані продажу, кнопкою вгорі."
                hints={assessment.hints}
                verdict={assessment.verdict}
              />
            ) : (
              <Card title="Тримати чи продати">
                <Typography variant="footnote" tone="secondary">
                  {assessment
                    ? 'Немає достатньо даних для порівняння дохідності з ринковими орієнтирами.'
                    : assessmentMessage(
                        !!bond,
                        position.purchases.every((purchase) => purchase.purchaseDate > today),
                        bond ? bond.maturityDate <= today : false,
                      )}
                </Typography>
              </Card>
            )}
            <SegmentedSelect options={tabs} value={tab} onChange={setTab} />
          </View>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            layout="inline"
            icon={bond ? 'calendar-outline' : 'cloud-offline-outline'}
            title={bond ? 'Виплат немає' : 'Немає даних НБУ'}
            message={emptyPaymentsMessage(!!bond, bond?.payments.length ?? 0)}
          />
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            {tab === 'payments' && hasTopUps && payments.length > 0 && (
              <Typography variant="caption1" tone="secondary" style={styles.sectionFooter}>
                Кожна виплата враховує лише ОВДП, куплені до її дати.
              </Typography>
            )}
            <Button title="Видалити з гаманця" variant="destructive" onPress={deletePosition} />
          </View>
        }
      />
      {canTopUp && (
        <FloatingActionButton accessibilityLabel={`Докупити ${position.isin}`} onPress={topUp} />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  list: { backgroundColor: theme.background },
  content: { gap: 0 },
  withFab: { paddingBottom: FAB_CLEARANCE },
  listHeader: { gap: theme.space.xl, marginBottom: theme.space.md },
  sectionFooter: { lineHeight: 18, marginHorizontal: theme.space.lg, marginTop: theme.space.sm },
  listFooter: { marginTop: theme.space.xl },
}));
