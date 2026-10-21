import { StyleSheet } from 'react-native-unistyles';

/**
 * Scroll content: phone-width column, centered on tablets. It has no theme values, so it works in
 * `contentContainerStyle`, which Unistyles does not update in place.
 */
export const screenContent = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 48,
    gap: 24,
  },
}).content;
