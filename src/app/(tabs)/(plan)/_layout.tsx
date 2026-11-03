import { NativeStack } from '@/components/navigation/NativeStack';
import { PlanListButton } from '@/screens/plan/PlanListButton';

export default function PlanStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen
        name="plan"
        options={{ title: 'План', headerRight: () => <PlanListButton /> }}
      />
    </NativeStack>
  );
}
