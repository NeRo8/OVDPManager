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

/** The same alert inside an async flow: resolves whether the user went ahead. */
export function askDestructive(title: string, message: string, action: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Скасувати', style: 'cancel', onPress: () => resolve(false) },
        { text: action, style: 'destructive', onPress: () => resolve(true) },
      ],
      // Android closes the alert on a tap outside it too.
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
