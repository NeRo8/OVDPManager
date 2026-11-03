import { View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { ActionRow } from '@/components/layout/ActionRow';
import { Section } from '@/components/layout/Section';
import { Typography } from '@/components/typography/Typography';
import { getActivePlan } from '@/stores/activePlan';
import { duplicateInvestmentPlan, removeInvestmentPlan, useInvestmentPlans } from '@/stores/plans';
import { usePurchases } from '@/stores/purchases';
import { showToast } from '@/stores/toast';
import { confirmDestructive } from '@/utils/confirm';
import { plural } from '@/utils/format';

/**
 * What can be done with a plan of «Мої плани», in a sheet over the list: a swipe down or a tap
 * outside it closes the sheet, so it has no cancel button.
 */
export default function PlanActionsScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const plans = useInvestmentPlans();
  const plan = plans.find((item) => item.id === planId);
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
    const wasActive = getActivePlan()?.id === plan.id;
    router.back();
    removeInvestmentPlan(plan.id);
    const active = getActivePlan();
    showToast({
      tone: 'success',
      title: 'План видалено',
      message: wasActive && active ? `Активний план: ${active.name}` : plan.name,
    });
  };

  const confirmRemovePlan = () =>
    confirmDestructive(
      'Видалити план?',
      (numberOfPurchases
        ? `План «${plan.name}» і ${numberOfPurchases} ${plural(numberOfPurchases, 'купівлю', 'купівлі', 'купівель')} в ньому буде видалено.`
        : `План «${plan.name}» буде видалено.`) +
        (plans.length === 1
          ? ' Це останній план: після видалення можна створити новий або відновити копію.'
          : ''),
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
