import { NativeStack } from '@/components/navigation/NativeStack';

export default function ReportsStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen name="reports" options={{ title: 'Звіти' }} />
    </NativeStack>
  );
}
