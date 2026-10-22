import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import {
  LEGACY_PLAN_NAME,
  PLAN_NAME_MAX_LENGTH,
  PlanNameSchema,
  createInvestmentPlan,
  renameInvestmentPlan,
  setActivePlan,
  useInvestmentPlans,
} from '@/entities/portfolio';
import { showToast } from '@/shared/lib';
import { Button, EmptyState, Input, ScreenScrollView, Section, Typography } from '@/shared/ui';

/**
 * Names a new plan, or renames the one in `planId`. Without any plans it is the first screen of
 * the app: creating the plan (or restoring a backup) opens the rest, as the root layout guards it.
 */
export default function PlanNameScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const plans = useInvestmentPlans();
  const isFirst = plans.length === 0;
  const existing = plans.find((plan) => plan.id === planId);
  const [name, setName] = useState(
    existing?.name ?? (isFirst ? LEGACY_PLAN_NAME : `План ${plans.length + 1}`),
  );
  const trimmed = name.trim();
  const canSave = PlanNameSchema.safeParse(name).success;
  const header = (
    <Stack.Screen
      options={{ title: planId ? 'Назва плану' : isFirst ? 'Перший план' : 'Новий план' }}
    />
  );

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
      {isFirst && (
        <Typography variant="subhead" tone="secondary" style={styles.intro}>
          Покупки ОВДП зберігаються в інвестиційних планах. Створіть перший план, а згодом додайте
          інші та перемикайтеся між ними.
        </Typography>
      )}
      <Section
        title="Назва"
        footer={`До ${PLAN_NAME_MAX_LENGTH} символів. Назву можна змінити пізніше.`}
      >
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Наприклад, ОВДП на освіту"
          maxLength={PLAN_NAME_MAX_LENGTH}
          autoFocus={!isFirst}
        />
      </Section>
      <Button
        title={existing ? 'Зберегти назву' : 'Створити план'}
        onPress={() => {
          if (!canSave) {
            showToast({
              tone: 'error',
              title: 'План не збережено',
              message: 'Вкажіть назву плану',
            });
            return;
          }
          if (existing) {
            renameInvestmentPlan(existing.id, trimmed);
            router.back();
          } else {
            // A new plan becomes active and opens in the plans tab, ready for its first purchases.
            // The first one needs no navigation: the guard swaps this screen for the app.
            setActivePlan(createInvestmentPlan(trimmed));
            if (!isFirst) router.dismissTo('/plan');
          }
        }}
      />
      {isFirst && (
        <Button
          title="Відновити з копії"
          variant="secondary"
          onPress={() => router.push('/backup/import')}
        />
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  intro: { marginHorizontal: theme.space.lg },
}));
