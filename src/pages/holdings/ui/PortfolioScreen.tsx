import { FlatList, type ListRenderItemInfo, RefreshControl, View } from 'react-native';

import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import {
  NbuSourceNote,
  StaleBondsNotice,
  WalletGate,
  type WalletPosition,
  useWallet,
} from '@/entities/portfolio';

import { usePullToRefresh } from '@/shared/lib';
import {
  FAB_CLEARANCE,
  FloatingActionButton,
  SectionCell,
  SectionTitle,
  screenContent,
} from '@/shared/ui';

import { PositionRow } from './PositionRow';

export default function PortfolioScreen() {
  const wallet = useWallet();
  const { refresh, positions } = wallet;
  const pullToRefresh = usePullToRefresh(refresh);
  const openBond = (isin: string) => router.push({ pathname: '/bond/[isin]', params: { isin } });
  const addBond = () => router.push('/add');

  const renderPosition = ({ item, index }: ListRenderItemInfo<WalletPosition>) => (
    <SectionCell index={index} count={positions.length}>
      <PositionRow item={item} onPress={() => openBond(item.position.isin)} />
    </SectionCell>
  );

  return (
    <WalletGate>
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
              <SectionTitle title="Мої ОВДП" />
            </View>
          }
          renderItem={renderPosition}
          ListFooterComponent={<NbuSourceNote />}
        />
        <FloatingActionButton accessibilityLabel="Додати ОВДП" onPress={addBond} />
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
