import { Stack, router } from 'expo-router';
import { Fragment } from 'react';

import {
  isPlannedPurchase,
  purchaseCount,
  setActivePlan,
  useActivePlan,
  useInvestmentPlans,
  usePurchases,
  type InvestmentPlan,
} from '@/entities/portfolio';
import { plural, todayISO } from '@/shared/lib';
import { CheckRow, HeaderButton, ScreenScrollView, Section, Separator } from '@/shared/ui';

/** All plans; the checked one is what the app shows, now and on the next launch. */
export default function PlanListScreen() {
  const plans = useInvestmentPlans();
  const purchases = usePurchases();
  const activePlan = useActivePlan();
  const today = todayISO();
  const createPlan = () => router.push('/plan/name');

  function subtitle(plan: InvestmentPlan) {
    const planPurchases = purchases.filter((purchase) => purchase.planId === plan.id);
    const planned = planPurchases.filter((purchase) => isPlannedPurchase(purchase, today)).length;
    return [
      planPurchases.length ? purchaseCount(planPurchases.length) : 'Купівель ще немає',
      planned > 0 &&
        `з них ${planned} ${plural(planned, 'запланована', 'заплановані', 'запланованих')}`,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton icon="add" accessibilityLabel="Створити план" onPress={createPlan} />
          ),
        }}
      />
      <Section footer="Виплати й гаманець показують вибраний план. Він відкривається і при наступному запуску.">
        {plans.map((plan, index) => (
          <Fragment key={plan.id}>
            {index > 0 && <Separator />}
            <CheckRow
              title={plan.name}
              subtitle={subtitle(plan)}
              checked={plan.id === activePlan?.id}
              onPress={() => setActivePlan(plan.id)}
            />
          </Fragment>
        ))}
      </Section>
    </ScreenScrollView>
  );
}
