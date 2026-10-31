import { FlatList, type ListRenderItemInfo } from 'react-native';

import { Stack, router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import {
  isPlannedPurchase,
  purchaseCount,
  setActivePlan,
  useActivePlan,
  useInvestmentPlans,
  usePurchases,
  type InvestmentPlan,
  type PlanPurchase,
} from '@/entities/portfolio';

import { plural, todayISO } from '@/shared/lib';
import { HeaderButton, SectionCell, Typography, screenContent } from '@/shared/ui';

import { PlanRow } from './PlanRow';

const keyOf = (plan: InvestmentPlan) => plan.id;

/**
 * All plans; the checked one is what the app shows, now and on the next launch. Each row's ⋮ button
 * opens its plan's actions.
 */
export default function PlanListScreen() {
  const plans = useInvestmentPlans();
  const purchases = usePurchases();
  const activePlan = useActivePlan();
  const today = todayISO();
  const createPlan = () => router.push('/plan/name');

  function subtitle(planPurchases: PlanPurchase[]) {
    const planned = planPurchases.filter((purchase) => isPlannedPurchase(purchase, today)).length;
    return [
      planPurchases.length ? purchaseCount(planPurchases.length) : 'Купівель ще немає',
      planned > 0 &&
        `з них ${planned} ${plural(planned, 'запланована', 'заплановані', 'запланованих')}`,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  const renderItem = ({ item: plan, index }: ListRenderItemInfo<InvestmentPlan>) => {
    const choose = () => setActivePlan(plan.id);
    const planPurchases = purchases.filter((purchase) => purchase.planId === plan.id);
    return (
      <SectionCell index={index} count={plans.length}>
        <PlanRow
          plan={plan}
          subtitle={subtitle(planPurchases)}
          checked={plan.id === activePlan?.id}
          onPress={choose}
        />
      </SectionCell>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton icon="add" accessibilityLabel="Створити план" onPress={createPlan} />
          ),
        }}
      />
      <FlatList
        data={plans}
        style={styles.list}
        contentContainerStyle={[screenContent, styles.content]}
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={keyOf}
        renderItem={renderItem}
        ListFooterComponent={
          <Typography variant="caption1" tone="secondary" style={styles.footer}>
            Виплати й гаманець показують вибраний план. Він відкривається і при наступному запуску.
          </Typography>
        }
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { backgroundColor: theme.background },
  // The plans sit together as one card.
  content: { gap: 0 },
  footer: { lineHeight: 18, marginHorizontal: theme.space.lg, marginTop: theme.space.sm },
}));
