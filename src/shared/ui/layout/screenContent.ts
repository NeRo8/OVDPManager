import { StyleSheet } from 'react-native';

/** Scroll content: phone-width column, centered on tablets. */
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
