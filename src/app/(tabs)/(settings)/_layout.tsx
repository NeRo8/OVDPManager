import { NativeStack } from '@/components/navigation/NativeStack';

export default function SettingsStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen name="settings" options={{ title: 'Налаштування' }} />
    </NativeStack>
  );
}
