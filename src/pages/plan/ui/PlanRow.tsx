import { Pressable, View } from 'react-native';

import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import type { InvestmentPlan } from '@/entities/portfolio';

import { ListRow, ThemedIcon } from '@/shared/ui';

type Props = {
  plan: InvestmentPlan;
  subtitle: string;
  checked: boolean;
  onPress: () => void;
};

/** A plan in «Мої плани»: a tap makes it active, the ⋮ button opens its actions in a sheet. */
export function PlanRow({ plan, subtitle, checked, onPress }: Props) {
  const openActions = () => router.push({ pathname: '/plan/actions', params: { planId: plan.id } });

  return (
    <ListRow
      title={plan.name}
      subtitle={subtitle}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      trailing={
        <View style={styles.trailing}>
          {checked && (
            <ThemedIcon
              name="checkmark"
              size={20}
              uniProps={(theme) => ({ color: theme.accent })}
            />
          )}
          <Pressable
            onPress={openActions}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Дії з планом «${plan.name}»`}
            style={({ pressed }) => [styles.more, pressed && styles.pressed]}
          >
            <ThemedIcon
              name="ellipsis-vertical"
              size={20}
              uniProps={(theme) => ({ color: theme.secondaryText })}
            />
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  trailing: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  more: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
}));
