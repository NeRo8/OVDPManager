import { useState } from 'react';
import { FlatList, type ListRenderItemInfo, View } from 'react-native';

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '@/components/button/Button';
import { FAB_CLEARANCE, FloatingActionButton } from '@/components/button/FloatingActionButton';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { Card } from '@/components/layout/Card';
import { EmptyState } from '@/components/layout/EmptyState';
import { screenContent } from '@/components/layout/screenContent';
import { SectionCell } from '@/components/layout/SectionCell';
import { BondTerms } from '@/components/portfolio/BondTerms';
import { ScheduleEventRow } from '@/components/portfolio/ScheduleEventRow';
import { Typography } from '@/components/typography/Typography';
import {
  type PositionPayment,
  type Operation,
  canBuyOn,
  isPlannedPurchase,
} from '@/lib/portfolio/portfolio';

import { HintsSection } from './HintsSection';
import { PositionSummary } from './PositionSummary';
import { PurchaseRow } from './PurchaseRow';
import { SaleButton } from './SaleButton';
import { useBondDetails } from './useBondDetails.hook';
import { useHoldOrSell } from './useHoldOrSell.hook';

type BondRow = Operation | PositionPayment;
type BondTab = 'operations' | 'payments';

const isPurchase = (row: BondRow): row is Operation => 'id' in row;
const keyOf = (row: BondRow) => (isPurchase(row) ? row.id : `${row.date}-${row.type}`);

function assessmentMessage(
  hasBond: boolean,
  sold: boolean,
  onlyPlannedPurchases: boolean,
  matured: boolean,
) {
  if (!hasBond) return 'Оцінка недоступна без даних НБУ.';
  if (sold) return 'Усі ОВДП цього випуску продано, тож тримати чи продавати вже нічого.';
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
 * A bond in the wallet: its terms, result and whether to keep or sell it, with operations and
 * payments on separate tabs.
 */
export default function BondScreen() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const [tab, setTab] = useState<BondTab>('payments');
  const {
    today,
    item,
    position,
    bond,
    payments,
    hasTopUps,
    canTopUp,
    deletePurchase,
    deletePosition,
  } = useBondDetails(isin);
  const { assessment } = useHoldOrSell(isin, null);

  if (!item || !position)
    return <EmptyState icon="search-outline" message="У гаманці немає цієї ОВДП" />;

  const tabs: { label: string; value: BondTab }[] = [
    { label: `Виплати (${payments.length})`, value: 'payments' },
    { label: `Операції (${position.operations.length})`, value: 'operations' },
  ];
  const rows: BondRow[] = tab === 'operations' ? position.operations : payments;
  const onlyPlanned = position.operations.every((purchase) => isPlannedPurchase(purchase, today));

  const topUp = () =>
    router.push({ pathname: '/add/[isin]/purchase', params: { isin: position.isin } });
  const openPurchase = (purchase: Operation) =>
    purchase.type === 'sale'
      ? router.push({ pathname: '/bond/[isin]/sale', params: { isin, operationId: purchase.id } })
      : router.push({
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
          headerRight: bond ? () => <SaleButton isin={position.isin} /> : undefined,
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
                  Для цієї старої купівлі не збережено умови ОВДП та графік виплат.
                </Typography>
              )}
            </Card>
            <PositionSummary item={item} hasTopUps={hasTopUps} />
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
                        item.state === 'sold',
                        onlyPlanned,
                        bond ? !canBuyOn(bond, today) : false,
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
