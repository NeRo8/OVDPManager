import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  PLAN_NAME_MAX_LENGTH,
  PlanNameSchema,
  createInvestmentPlan,
  renameInvestmentPlan,
  useInvestmentPlans,
} from '@/entities/portfolio';
import { Button, EmptyState, Input, ScreenScrollView, Section } from '@/shared/ui';

export default function PlanNameScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const plans = useInvestmentPlans();
  const existing = plans.find((plan) => plan.id === planId);
  const [name, setName] = useState(existing?.name ?? `План ${plans.length + 1}`);
  const trimmed = name.trim();
  const canSave = PlanNameSchema.safeParse(name).success;
  const header = <Stack.Screen options={{ title: planId ? 'Назва плану' : 'Новий план' }} />;

  if (planId && !existing)
    return (
      <>
        {header}
        <EmptyState title="План не знайдено" message="Поверніться до списку планів." />
      </>
    );

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      {header}
      <Section
        title="Назва"
        footer={`До ${PLAN_NAME_MAX_LENGTH} символів. Назву можна змінити пізніше.`}
      >
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Наприклад, ОВДП на освіту"
          maxLength={PLAN_NAME_MAX_LENGTH}
          autoFocus
        />
      </Section>
      <Button
        title={existing ? 'Зберегти назву' : 'Створити план'}
        disabled={!canSave}
        onPress={() => {
          if (!canSave) return;
          if (existing) {
            renameInvestmentPlan(existing.id, trimmed);
            router.back();
          } else {
            const id = createInvestmentPlan(trimmed);
            router.replace({ pathname: '/plan/detail/[planId]', params: { planId: id } });
          }
        }}
      />
    </ScreenScrollView>
  );
}
