import { router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { plannedAmount, useInvestmentPlans } from '@/entities/portfolio';
import { formatTotals, plural } from '@/shared/lib';
import {
  Card,
  FAB_CLEARANCE,
  FloatingActionButton,
  SectionCell,
  SectionTitle,
  ThemedSymbolView,
  Typography,
  screenContent,
} from '@/shared/ui';

export default function PlanScreen() {
  const plans = useInvestmentPlans();

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[screenContent, styles.content]}
        contentInsetAdjustmentBehavior="automatic"
        data={plans}
        keyExtractor={(plan) => plan.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Typography variant="subhead" tone="secondary" style={styles.intro}>
              Створюйте окремі інвестиційні плани та додавайте до кожного кілька ОВДП.
            </Typography>
            {plans.length > 0 && <SectionTitle title="Мої плани" />}
          </View>
        }
        renderItem={({ item: plan, index }) => {
          const bondCount = new Set(plan.items.map((item) => item.isin)).size;
          const invested = formatTotals(
            plan.items.map((item) => ({ currency: item.currency, value: plannedAmount(item) })),
          );
          return (
            <SectionCell index={index} count={plans.length}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/plan/detail/[planId]', params: { planId: plan.id } })
                }
                accessibilityRole="link"
                accessibilityLabel={`${plan.name}, ${bondCount} ОВДП, ${plan.items.length} ${plural(plan.items.length, 'запланована покупка', 'заплановані покупки', 'запланованих покупок')}`}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.details}>
                  <Typography variant="headline">{plan.name}</Typography>
                  <Typography variant="caption1" tone="secondary">
                    {plan.items.length === 0
                      ? 'Покупок ще немає'
                      : `${bondCount} ОВДП · ${plan.items.length} ${plural(plan.items.length, 'покупка', 'покупки', 'покупок')}`}
                  </Typography>
                  {invested && (
                    <Typography variant="subhead" tabular>
                      Заплановано: {invested}
                    </Typography>
                  )}
                </View>
                <ThemedSymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right' }}
                  size={14}
                  uniProps={(theme) => ({ tintColor: theme.secondaryText })}
                />
              </Pressable>
            </SectionCell>
          );
        }}
        ListEmptyComponent={
          <Card>
            <Typography variant="headline">Планів ще немає</Typography>
            <Typography variant="subhead" tone="secondary">
              Створіть перший план, дайте йому назву та додайте майбутні покупки ОВДП.
            </Typography>
          </Card>
        }
      />
      <FloatingActionButton
        accessibilityLabel="Створити інвестиційний план"
        onPress={() => router.push('/plan/name')}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  list: { backgroundColor: theme.background },
  content: { gap: 0, paddingBottom: FAB_CLEARANCE },
  header: { gap: 24, marginBottom: 8 },
  intro: { marginHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  details: { flex: 1, gap: 4 },
  pressed: { backgroundColor: theme.muted },
}));
