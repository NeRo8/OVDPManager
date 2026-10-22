import { TextInput } from 'react-native';
import { withUnistyles } from 'react-native-unistyles';

export const ThemedTextInput = withUnistyles(TextInput, (theme) => ({
  placeholderTextColor: theme.secondaryText,
}));
