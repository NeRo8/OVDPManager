import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  Avatar,
  FAB_CLEARANCE,
  FloatingActionButton,
  SectionCell,
  SectionTitle,
  Typography,
  screenContent,
} from '@/shared/ui';
import { currencySign, formatDate, formatMoney, usePullToRefresh } from '@/shared/lib';
import { currencyColor } from '@/shared/theme';
import {
  NbuSourceNote,
  StaleBondsNotice,
  WalletGate,
  isPlannedPurchase,
  useWallet,
} from '@/entities/portfolio';

export default function PortfolioScreen() {
  const wallet = useWallet();
  const { refresh, positions, today } = wallet;
  const pullToRefresh = usePullToRefresh(refresh);
  const openBond = (isin: string) => router.push({ pathname: '/bond/[isin]', params: { isin } });
  const addBond = () => router.push('/add');

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
          renderItem={({ item: { position, bond, currency, nextPayment }, index }) => {
            // Nothing bought yet: every purchase of the position is still ahead.
            const isPlanned = position.purchases.every((purchase) =>
              isPlannedPurchase(purchase, today),
            );
            const tone = isPlanned ? 'accent' : 'secondary';
            return (
              <SectionCell index={index} count={positions.length}>
                <Pressable
                  onPress={() => openBond(position.isin)}
                  accessibilityRole="link"
                  style={({ pressed }) => [styles.position, pressed && styles.pressed]}
                >
                  {/* Each currency in its own color, so mixed holdings sort out at a glance. */}
                  <Avatar label={currencySign(currency)} color={currencyColor(currency)} />
                  <View style={styles.positionInfo}>
                    <Typography variant="headline" tabular>
                      {position.isin}
                    </Typography>
                    {bond ? (
                      <Typography variant="caption1" tone="secondary">
                        {bond.rate}% ·{' '}
                        {nextPayment ? `до ${formatDate(bond.maturityDate)}` : 'погашено'}
                      </Typography>
                    ) : (
                      <Typography variant="caption1" tone="warning">
                        Немає в даних НБУ
                      </Typography>
                    )}
                  </View>
                  <View style={styles.positionAmount}>
                    <Typography variant="callout" weight="semibold" tabular align="right">
                      {formatMoney(position.investedAmount, currency)}
                    </Typography>
                    <Typography variant="caption1" tone={tone} tabular align="right">
                      {position.quantity} шт{isPlanned && ' · заплановано'}
                    </Typography>
                  </View>
                </Pressable>
              </SectionCell>
            );
          }}
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
  position: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  positionInfo: { flex: 1, gap: theme.space.xxs },
  positionAmount: { flexShrink: 0, gap: theme.space.xxs },
  pressed: { backgroundColor: theme.muted },
}));
