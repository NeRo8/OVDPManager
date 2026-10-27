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
 *
 * `mode="layout"` makes room for the keyboard with a spacer after the content instead of the
 * default `contentInset` on a wrapping native view, which on iOS 26 fought the automatic inset
 * under the transparent header and scrolled the first section under it as the screen opened.
 */
type Props = KeyboardAwareScrollViewProps;

export function FormScrollView({ style, contentContainerStyle, ...props }: Props) {
  return (
    <ThemedKeyboardAwareScrollView
      mode="layout"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      bottomOffset={space.xxxl}
      {...props}
      style={[styles.screen, style]}
      contentContainerStyle={[screenContent, styles.spacerGap, contentContainerStyle]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { backgroundColor: theme.background },
  // The keyboard spacer is the content's last child and adds one `gap` (`xl`) before it, so the
  // padding under the content stays `xxxl` in all.
  spacerGap: { paddingBottom: space.xxxl - space.xl },
}));
