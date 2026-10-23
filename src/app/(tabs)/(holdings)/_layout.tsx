import { NativeStack } from '@/shared/ui';

export default function HoldingsStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen name="holdings" options={{ title: 'Гаманець' }} />
    </NativeStack>
  );
}
