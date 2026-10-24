import { StyleSheet } from 'react-native-unistyles';

import { space } from '@/shared/theme';

/**
 * Scroll content: phone-width column, centered on tablets. It has no theme values, so it works in
 * `contentContainerStyle`, which Unistyles does not update in place.
 */
export const screenContent = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: space.lg,
    paddingBottom: space.xxxl,
    gap: space.xl,
  },
}).content;
