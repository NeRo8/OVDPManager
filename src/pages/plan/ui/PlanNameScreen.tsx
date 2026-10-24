import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Controller, useForm, useFormState } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';
import { z } from 'zod';

import {
  DEFAULT_PLAN_NAME,
  PLAN_NAME_MAX_LENGTH,
  createActivePlan,
  renameInvestmentPlan,
  useInvestmentPlans,
} from '@/entities/portfolio';
import {
  Button,
  EmptyState,
  FormScrollView,
  IconBadge,
  Input,
  Section,
  Typography,
} from '@/shared/ui';

const PlanNameFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Вкажіть назву плану' })
    .max(PLAN_NAME_MAX_LENGTH, { error: `Назва — до ${PLAN_NAME_MAX_LENGTH} символів` }),
});

/**
 * Names a new plan, or renames the one in `planId`. Without any plans it is the first screen of
 * the app: creating the plan (or restoring a backup) opens the rest, as the root layout guards it.
 */
export default function PlanNameScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const plans = useInvestmentPlans();
  const isFirst = plans.length === 0;
  const existing = plans.find((plan) => plan.id === planId);
  const form = useForm<
    z.input<typeof PlanNameFormSchema>,
    unknown,
    z.output<typeof PlanNameFormSchema>
  >({
    resolver: zodResolver(PlanNameFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: existing?.name ?? (isFirst ? DEFAULT_PLAN_NAME : `План ${plans.length + 1}`),
    },
  });
  // Read through the hook, not `form.formState`, which the React Compiler would cache.
  const { errors, isValid } = useFormState({ control: form.control });
  const nameError = errors.name?.message;
  const submit = form.handleSubmit(({ name }) => {
    if (existing) {
      renameInvestmentPlan(existing.id, name);
      router.back();
    } else {
      // The new plan opens in the plans tab; the first one needs no navigation, as the guard
      // swaps this screen for the app.
      createActivePlan(name);
      if (!isFirst) router.dismissTo('/plan');
    }
  });
  const save = () => void submit();
  const openBackupImport = () => router.push('/backup/import');
  const header = (
    <Stack.Screen
      options={{ title: planId ? 'Назва плану' : isFirst ? 'Перший план' : 'Новий план' }}
    />
  );

  if (planId && !existing)
    return (
      <>
        {header}
        <EmptyState
          icon="search-outline"
          title="План не знайдено"
          message="Поверніться до списку планів."
        />
      </>
    );

  return (
    <FormScrollView>
      {header}
      {isFirst && (
        <View style={styles.intro}>
          {/* The plans tab's chart, so the plan looks the same here and in the tab bar. */}
          <IconBadge icon="bar-chart-outline" size="lg" />
          <View style={styles.introText}>
            <Typography variant="title2" align="center">
              Почніть з плану
            </Typography>
            <Typography variant="subhead" tone="secondary" align="center">
              Купівлі ОВДП зберігаються в інвестиційних планах. Створіть перший план, а згодом
              додайте інші та перемикайтеся між ними.
            </Typography>
          </View>
        </View>
      )}
      <Section
        title="Назва"
        footer={
          nameError ? (
            <Typography variant="caption1" tone="danger" accessibilityLiveRegion="polite">
              {nameError}
            </Typography>
          ) : (
            `До ${PLAN_NAME_MAX_LENGTH} символів. Назву можна змінити пізніше.`
          )
        }
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field }) => (
            <Input
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Наприклад, ОВДП на освіту"
              maxLength={PLAN_NAME_MAX_LENGTH}
              autoFocus={!isFirst}
            />
          )}
        />
      </Section>
      <Button
        title={existing ? 'Зберегти назву' : 'Створити план'}
        disabled={!isValid}
        onPress={save}
      />
      {isFirst && (
        <Button title="Відновити з копії" variant="secondary" onPress={openBackupImport} />
      )}
    </FormScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  intro: {
    alignItems: 'center',
    gap: theme.space.xl,
    paddingTop: theme.space.lg,
    paddingHorizontal: theme.space.lg,
  },
  introText: { gap: theme.space.sm },
}));
