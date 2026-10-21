import { ScrollView, type ScrollViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { screenContent } from './screenContent';

/** Scroll container of form and static screens: themed background, centered content column. */
export function ScreenScrollView({ style, contentContainerStyle, ...props }: ScrollViewProps) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      {...props}
      style={[styles.screen, style]}
      contentContainerStyle={[screenContent, contentContainerStyle]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { backgroundColor: theme.background },
}));
