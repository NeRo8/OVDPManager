import { NativeStack } from '@/components/navigation/NativeStack';

export default function HoldingsStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen name="holdings" options={{ title: 'Гаманець' }} />
    </NativeStack>
  );
}
