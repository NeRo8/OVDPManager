import { Stack, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { EmptyState, FloatingActionButton, TopTabs } from '@/shared/ui';
import { useBondDetails } from '../model/useBondDetails.hook';

/** A bond in the wallet: overview, payments and purchases as swipeable tabs. */
export function BondTabsLayout() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const { position, bond, payments, canTopUp } = useBondDetails(isin);

  if (!position) return <EmptyState message="У гаманці немає цієї ОВДП" />;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: position.isin }} />
      <TopTabs>
        <TopTabs.Screen name="index" options={{ title: 'Огляд' }} />
        <TopTabs.Screen
          name="payments"
          options={{ title: bond ? `Виплати (${payments.length})` : 'Виплати' }}
        />
        <TopTabs.Screen name="purchases" options={{ title: `Покупки (${position.lots.length})` }} />
      </TopTabs>
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
