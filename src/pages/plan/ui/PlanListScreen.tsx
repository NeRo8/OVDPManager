import { Stack, router } from 'expo-router';
import { Fragment } from 'react';

import {
  setActivePlan,
  useActivePlan,
  useInvestmentPlans,
  usePurchases,
  type InvestmentPlan,
} from '@/entities/portfolio';
import { plural } from '@/shared/lib';
import { CheckRow, HeaderButton, ScreenScrollView, Section, Separator } from '@/shared/ui';

/** All plans; the checked one is what the app shows, now and on the next launch. */
export default function PlanListScreen() {
  const plans = useInvestmentPlans();
  const purchases = usePurchases();
  const activePlan = useActivePlan();

  function subtitle(plan: InvestmentPlan) {
    const owned = purchases.filter((purchase) => purchase.planId === plan.id).length;
    const planned = plan.items.length;
    return [
      owned
        ? `${owned} ${plural(owned, 'покупка', 'покупки', 'покупок')} у гаманці`
        : 'Гаманець порожній',
      planned > 0 && `${planned} ${plural(planned, 'запланована', 'заплановані', 'запланованих')}`,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon={{ ios: 'plus', android: 'add' }}
              accessibilityLabel="Створити план"
              onPress={() => router.push('/plan/name')}
            />
          ),
        }}
      />
      <Section footer="Виплати, гаманець і прогноз показують вибраний план. Він відкривається і при наступному запуску.">
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
