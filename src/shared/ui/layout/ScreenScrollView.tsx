import { ScrollView, type ScrollViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { screenContent } from './screenContent';

/** Scroll container of screens without text fields: themed background, centered content column. */
type Props = ScrollViewProps;

export function ScreenScrollView({ style, contentContainerStyle, ...props }: Props) {
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
