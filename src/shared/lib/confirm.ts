import { Alert } from 'react-native';

/** Confirm a destructive action with a native alert. */
export function confirmDestructive(
  title: string,
  message: string,
  action: string,
  onConfirm: () => void,
) {
  Alert.alert(title, message, [
    { text: 'Скасувати', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Report the outcome of an action that has no screen of its own to show it on. */
export function showMessage(title: string, message?: string) {
  Alert.alert(title, message);
}
