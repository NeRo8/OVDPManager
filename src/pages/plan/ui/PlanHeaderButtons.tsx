import { View } from 'react-native';

import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { HeaderButton } from '@/shared/ui';

import { PlanListButton } from './PlanListButton';

/** Header actions of the plans tab: the coupon goal, then all plans. */
export function PlanHeaderButtons() {
  const openGoal = () => router.push('/plan/goal');

  return (
    <View style={styles.row}>
      <HeaderButton
        icon="flag-outline"
        accessibilityLabel="Ціль: купони на місяць"
        onPress={openGoal}
      />
      <PlanListButton />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.space.sm },
}));
