import { NativeStack } from '@/shared/ui';

export default function ReportsStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen name="reports" options={{ title: 'Звіти' }} />
    </NativeStack>
  );
}
