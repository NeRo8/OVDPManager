import { NativeStack } from '@/shared/ui';

export default function SettingsStackLayout() {
  return (
    <NativeStack>
      <NativeStack.Screen name="settings" options={{ title: 'Налаштування' }} />
    </NativeStack>
  );
}
