import type { DimensionValue } from 'react-native';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

export const VALUE_WIDTH = 72;

type Props = {
  text: string;
  /** Where the label stands over its column: at the plot's edge for the first and last */
  column: number;
  count: number;
  /** Distance from the plot's top, or from its bottom for a stack above the baseline */
  top?: number;
  bottom?: number;
};

function labelPosition(isFirst: boolean, isLast: boolean, left: DimensionValue) {
  if (isFirst) return styles.start;
  if (isLast) return styles.end;
  return { left, marginLeft: -VALUE_WIDTH / 2 };
}

function labelAlign(isFirst: boolean, isLast: boolean) {
  if (isFirst) return 'left' as const;
  if (isLast) return 'right' as const;
  return 'center' as const;
}

/** The selected column's sum, just past the end of its stack. */
export function ColumnValueLabel({ text, column, count, top, bottom }: Props) {
  const isFirst = column === 0;
  const isLast = column === count - 1;
  const left: DimensionValue = `${((column + 0.5) / count) * 100}%`;

  return (
    <View
      pointerEvents="none"
      style={[styles.box, { top, bottom }, labelPosition(isFirst, isLast, left)]}
    >
      <Typography
        variant="caption2"
        weight="semibold"
        tabular
        numberOfLines={1}
        align={labelAlign(isFirst, isLast)}
      >
        {text}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', width: VALUE_WIDTH },
  start: { left: 0 },
  end: { right: 0 },
});
