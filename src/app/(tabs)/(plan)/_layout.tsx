import { PlanListButton } from '@/pages/plan';

import { NativeStack } from '@/shared/ui';

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
