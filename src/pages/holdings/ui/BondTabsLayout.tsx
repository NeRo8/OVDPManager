import { Stack, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BondTerms } from '@/entities/portfolio';
import { EmptyState, FloatingActionButton, TopTabBar, TopTabs, Typography } from '@/shared/ui';
import { useBondDetails } from '../model/useBondDetails.hook';

/**
 * A bond in the wallet. The head under the title holds the issue's terms and the tab switch;
 * overview, payments and purchases are swipeable tab routes below it.
 */
export function BondTabsLayout() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const { position, bond, payments, canTopUp } = useBondDetails(isin);

  if (!position) return <EmptyState message="У гаманці немає цієї ОВДП" />;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: position.isin }} />
      <TopTabs
        tabBar={(props) => (
          <View style={styles.head}>
            <View style={styles.terms}>
              {bond ? (
                <BondTerms bond={bond} />
              ) : (
                <Typography variant="footnote" tone="danger">
                  Цієї ОВДП немає в даних НБУ — параметри випуску й графік виплат недоступні.
                </Typography>
              )}
            </View>
            <TopTabBar {...props} />
          </View>
        )}
      >
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

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  head: { backgroundColor: theme.card },
  terms: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
}));
