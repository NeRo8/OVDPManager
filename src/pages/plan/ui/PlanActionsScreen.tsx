import { View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import {
  duplicateInvestmentPlan,
  removeInvestmentPlan,
  useInvestmentPlans,
  usePurchases,
} from '@/entities/portfolio';

import { confirmDestructive, plural, showToast } from '@/shared/lib';
import { ActionRow, Section, Typography } from '@/shared/ui';

/**
 * What can be done with a plan of «Мої плани», in a sheet over the list: a swipe down or a tap
 * outside it closes the sheet, so it has no cancel button.
 */
export default function PlanActionsScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const plan = useInvestmentPlans().find((item) => item.id === planId);
  const numberOfPurchases = usePurchases().filter((item) => item.planId === planId).length;

  // The plan is gone only while the sheet closes after deleting it.
  if (!plan) return null;

  // The sheet closes before the name screen opens, so that screen is pushed over the list.
  const renamePlan = () => {
    router.back();
    router.push({ pathname: '/plan/name', params: { planId: plan.id } });
  };

  const duplicatePlan = () => {
    const name = duplicateInvestmentPlan(plan.id);
    router.back();
    if (name) showToast({ tone: 'success', title: 'План дубльовано', message: name });
  };

  const removePlan = () => {
    router.back();
    removeInvestmentPlan(plan.id);
  };

  const confirmRemovePlan = () =>
    confirmDestructive(
      'Видалити план?',
      numberOfPurchases
        ? `План «${plan.name}» і ${numberOfPurchases} ${plural(numberOfPurchases, 'купівлю', 'купівлі', 'купівель')} в ньому буде видалено.`
        : `План «${plan.name}» буде видалено.`,
      'Видалити',
      removePlan,
    );

  return (
    <View style={styles.content}>
      <Typography variant="headline" align="center" numberOfLines={2}>
        {plan.name}
      </Typography>
      <Section>
        <ActionRow title="Перейменувати план" onPress={renamePlan} />
        <ActionRow title="Дублювати план" onPress={duplicatePlan} />
        <ActionRow title="Видалити план" tone="danger" onPress={confirmRemovePlan} />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { padding: theme.space.lg, paddingTop: theme.space.xl, gap: theme.space.lg },
}));
