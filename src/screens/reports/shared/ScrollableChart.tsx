import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { Typography } from '@/components/typography/Typography';

type Props = { children: ReactNode; count: number; columnWidth: number };

export function ScrollableChart({ children, count, columnWidth }: Props) {
  const [availableWidth, setAvailableWidth] = useState(0);
  const chartWidth = count * columnWidth + 60;
  return (
    <View onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ width: Math.max(availableWidth, chartWidth) }}>{children}</View>
      </ScrollView>
      {availableWidth > 0 && chartWidth > availableWidth && (
        <Typography variant="caption1" tone="secondary">
          Прокрутіть графік горизонтально, щоб побачити всі періоди.
        </Typography>
      )}
    </View>
  );
}
