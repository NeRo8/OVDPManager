import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  SectionList,
  type SectionListData,
  type SectionListRenderItemInfo,
  View,
} from 'react-native';
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
  SectionTitle,
  Typography,
  screenContent,
} from '@/shared/ui';
import { useBondDetails } from '../model/useBondDetails.hook';
import { PositionSummary } from './PositionSummary';
import { PurchaseRow } from './PurchaseRow';

type BondRow = Purchase | PositionPayment;

/** The purchases, then the payments, each a card of list rows. */
type BondSection = { key: 'purchases' | 'payments'; title: string; data: BondRow[] };

const isPurchase = (row: BondRow): row is Purchase => 'purchaseDate' in row;
const keyOf = (row: BondRow) => (isPurchase(row) ? row.id : `${row.date}-${row.type}`);

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
    results,
    canTopUp,
    deletePurchase,
    deletePosition,
  } = useBondDetails(isin);

  if (!position || !currency)
    return <EmptyState icon="search-outline" message="У гаманці немає цієї ОВДП" />;

  const sections: BondSection[] = [
    { key: 'purchases', title: `Купівлі (${position.purchases.length})`, data: position.purchases },
    // Without the NBU data there is no schedule to list.
    ...(bond
      ? [{ key: 'payments' as const, title: `Виплати (${payments.length})`, data: payments }]
      : []),
  ];

  const topUp = () =>
    router.push({ pathname: '/add/[isin]', params: { isin: position.isin, topUp: '1' } });

  const renderSectionHeader = ({ section }: { section: SectionListData<BondRow, BondSection> }) => (
    <View style={styles.sectionHeader}>
      <SectionTitle title={section.title} />
    </View>
  );
  const renderSectionFooter = ({ section }: { section: SectionListData<BondRow, BondSection> }) => {
    if (section.key !== 'payments') return null;
    if (!section.data.length)
      return (
        <EmptyState
          layout="inline"
          icon="calendar-outline"
          title="Виплат немає"
          message="Усі виплати за графіком НБУ припадають на дати до купівлі, тож цій купівлі вони не належать."
        />
      );
    return hasTopUps ? (
      <Typography variant="caption1" tone="secondary" style={styles.sectionFooter}>
        Кожна виплата враховує лише облігації, куплені до її дати.
      </Typography>
    ) : null;
  };
  const renderItem = ({
    item,
    index,
    section,
  }: SectionListRenderItemInfo<BondRow, BondSection>) => (
    <SectionCell index={index} count={section.data.length}>
      {isPurchase(item) ? (
        <PurchaseRow purchase={item} bond={bond} today={today} onDelete={deletePurchase} />
      ) : (
        <ScheduleEventRow event={item} showQuantity={hasTopUps} />
      )}
    </SectionCell>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: position.isin }} />
      <SectionList
        sections={sections}
        style={styles.list}
        contentContainerStyle={[screenContent, styles.content, canTopUp && styles.withFab]}
        contentInsetAdjustmentBehavior="automatic"
        stickySectionHeadersEnabled={false}
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
            />
          </View>
        }
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        renderItem={renderItem}
        ListFooterComponent={
          <View style={styles.listFooter}>
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
  // The list has no gaps of its own: the section headers and the footer space themselves.
  content: { gap: 0 },
  withFab: { paddingBottom: FAB_CLEARANCE },
  listHeader: { gap: theme.space.xl },
  sectionHeader: { marginTop: theme.space.xl, marginBottom: theme.space.sm },
  sectionFooter: { lineHeight: 18, marginHorizontal: theme.space.lg, marginTop: theme.space.sm },
  listFooter: { marginTop: theme.space.xl },
}));
