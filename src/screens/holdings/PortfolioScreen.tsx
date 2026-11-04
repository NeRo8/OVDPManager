import { useState } from 'react';
import { FlatList, type ListRenderItemInfo, RefreshControl, View } from 'react-native';

import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { FAB_CLEARANCE, FloatingActionButton } from '@/components/button/FloatingActionButton';
import { SegmentedSection } from '@/components/form/SegmentedSection';
import { EmptyState } from '@/components/layout/EmptyState';
import { screenContent } from '@/components/layout/screenContent';
import { SectionCell } from '@/components/layout/SectionCell';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BondsUnavailableCard } from '@/components/portfolio/BondsUnavailableCard';
import { NbuSourceNote } from '@/components/portfolio/NbuSourceNote';
import { StaleBondsNotice } from '@/components/portfolio/StaleBondsNotice';
import { WalletGate } from '@/components/portfolio/WalletGate';
import { usePullToRefresh } from '@/hooks/usePullToRefresh.hook';
import { useWallet } from '@/hooks/useWallet.hook';
import type { WalletPosition } from '@/lib/portfolio/position';
import type { BondKind, Currency } from '@/lib/portfolio/portfolio';

import { PositionRow } from './PositionRow';
import { sortWalletPositions } from './walletOrder';

export default function PortfolioScreen() {
  const [kind, setKind] = useState<BondKind | 'unknown' | 'all'>('all');
  const [currency, setCurrency] = useState<Currency | 'all'>('all');
  const { refresh, positions: unsorted } = useWallet();
  const positions = sortWalletPositions(unsorted).filter(
    (item) =>
      (kind === 'all' || (item.bond?.kind ?? 'unknown') === kind) &&
      (currency === 'all' || item.currency === currency),
  );
  const pullToRefresh = usePullToRefresh(refresh);
  const openBond = (isin: string) => router.push({ pathname: '/bond/[isin]', params: { isin } });
  const addBond = () => router.push('/add');

  const renderPosition = ({ item, index }: ListRenderItemInfo<WalletPosition>) => (
    <SectionCell index={index} count={positions.length}>
      <PositionRow item={item} onPress={() => openBond(item.position.isin)} />
    </SectionCell>
  );

  return (
    <WalletGate allowMissingBonds>
      <View style={styles.screen}>
        <FlatList
          style={styles.list}
          contentContainerStyle={[screenContent, styles.listContent]}
          contentInsetAdjustmentBehavior="automatic"
          data={positions}
          keyExtractor={({ position }) => position.isin}
          refreshControl={<RefreshControl {...pullToRefresh} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <StaleBondsNotice />
              <BondsUnavailableCard />
              <SegmentedSection
                title="Вид облігації"
                value={kind}
                onChange={setKind}
                options={[
                  { value: 'all', label: 'Усі' },
                  { value: 'ovdp', label: 'ОВДП' },
                  { value: 'ozdp', label: 'ОЗДП' },
                  { value: 'unknown', label: 'Невідомо' },
                ]}
              />
              <SegmentedSection
                title="Валюта"
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: 'all', label: 'Усі' },
                  { value: 'UAH', label: 'UAH' },
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                ]}
              />
              <SectionTitle title="Мої облігації" />
            </View>
          }
          renderItem={renderPosition}
          ListEmptyComponent={
            <EmptyState
              layout="inline"
              title="Облігацій не знайдено"
              message="Змініть фільтри виду або валюти."
            />
          }
          ListFooterComponent={<NbuSourceNote />}
        />
        <FloatingActionButton accessibilityLabel="Додати облігацію" onPress={addBond} />
      </View>
    </WalletGate>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  list: { backgroundColor: theme.background },
  listContent: { gap: 0, paddingBottom: FAB_CLEARANCE },
  listHeader: { gap: theme.space.xl, marginBottom: theme.space.sm },
}));
