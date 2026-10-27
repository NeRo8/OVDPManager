import { Platform, TextInput } from 'react-native';
import { withUnistyles } from 'react-native-unistyles';

import { withAlpha } from '@/shared/lib';

// iOS tints the caret and the handles with `selectionColor` and fades the selection box itself.
// Android fills the box with it as given, so it gets a faded accent there, and the caret and the
// handles take the solid one through their own props.
export const ThemedTextInput = withUnistyles(TextInput, (theme) => ({
  placeholderTextColor: theme.secondaryText,
  selectionColor: Platform.OS === 'ios' ? theme.accent : withAlpha(theme.accent, 0.35),
  cursorColor: theme.accent,
  selectionHandleColor: theme.accent,
}));
