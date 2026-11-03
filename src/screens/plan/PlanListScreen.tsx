import { FlatList, type ListRenderItemInfo } from 'react-native';

import { Stack, router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { HeaderButton } from '@/components/button/HeaderButton';
import { screenContent } from '@/components/layout/screenContent';
import { SectionCell } from '@/components/layout/SectionCell';
import { Typography } from '@/components/typography/Typography';
import { operationCount } from '@/lib/portfolio/counts';
import type { InvestmentPlan } from '@/lib/portfolio/plan';
import { isPlannedPurchase, type PlanOperation } from '@/lib/portfolio/portfolio';
import { useToday } from '@/stores/appSettings';
import { useOperations } from '@/stores/operations';
import { useActivePlan, setActivePlan, useInvestmentPlans } from '@/stores/plans';
import { plural } from '@/utils/format';

import { PlanRow } from './PlanRow';

const keyOf = (plan: InvestmentPlan) => plan.id;

/**
 * All plans; the checked one is what the app shows, now and on the next launch. Each row's ⋮ button
 * opens its plan's actions.
 */
export default function PlanListScreen() {
  const plans = useInvestmentPlans();
  const operations = useOperations();
  const activePlan = useActivePlan();
  const today = useToday();
  const createPlan = () => router.push('/plan/name');

  function subtitle(planPurchases: PlanOperation[]) {
    const planned = planPurchases.filter((purchase) => isPlannedPurchase(purchase, today)).length;
    return [
      planPurchases.length ? operationCount(planPurchases.length) : 'Операцій ще немає',
      planned > 0 &&
        `з них ${planned} ${plural(planned, 'запланована', 'заплановані', 'запланованих')}`,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  const renderItem = ({ item: plan, index }: ListRenderItemInfo<InvestmentPlan>) => {
    const choose = () => setActivePlan(plan.id);
    const planPurchases = operations.filter((purchase) => purchase.planId === plan.id);
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
