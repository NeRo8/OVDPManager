import { Alert, Platform } from 'react-native';

/** Destructive confirmation: a native alert on iOS/Android, the browser dialog on web. */
export function confirmDestructive(
  title: string,
  message: string,
  action: string,
  onConfirm: () => void,
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Скасувати', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}
