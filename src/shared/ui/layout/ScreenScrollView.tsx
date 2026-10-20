import { ScrollView, type ScrollViewProps } from 'react-native';

import { themeStyles } from '@/shared/theme';
import { screenContent } from './screenContent';

/** Scroll container of form and static screens: themed background, centered content column. */
export function ScreenScrollView({ style, contentContainerStyle, ...props }: ScrollViewProps) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      {...props}
      style={[themeStyles.background, style]}
      contentContainerStyle={[screenContent, contentContainerStyle]}
    />
  );
}
