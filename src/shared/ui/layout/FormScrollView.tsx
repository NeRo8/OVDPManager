import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';

import { space } from '@/shared/theme';
import { screenContent } from './screenContent';

// A third-party view: withUnistyles re-renders it when the theme changes.
const ThemedKeyboardAwareScrollView = withUnistyles(KeyboardAwareScrollView);

/**
 * Scroll container of form screens: like ScreenScrollView, and it scrolls the focused field (with
 * the error line under its row) above the keyboard on both platforms.
 */
type Props = KeyboardAwareScrollViewProps;

export function FormScrollView({ style, contentContainerStyle, ...props }: Props) {
  return (
    <ThemedKeyboardAwareScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      bottomOffset={space.xxxl}
      {...props}
      style={[styles.screen, style]}
      contentContainerStyle={[screenContent, contentContainerStyle]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { backgroundColor: theme.background },
}));
