import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { SectionFrame, type SectionFrameProps } from './SectionFrame';
import { Separator } from './Separator';

export type SectionProps = SectionFrameProps & {
  /** The card's rows: a separator goes between each two, so callers never add one */
  children: ReactNode;
};

type Row = { key: string; node: ReactNode };

/**
 * The rows among the children: lists and fragments are opened, so the rows a condition or a map
 * adds are separated like the others; `false` and `null` leave no row.
 */
function rowsOf(children: ReactNode, keyPrefix = ''): Row[] {
  return Children.toArray(children).flatMap((child, index) => {
    const key = `${keyPrefix}${isValidElement(child) ? child.key : index}`;
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return rowsOf(child.props.children, `${key}/`);
    }
    return [{ key, node: child }];
  });
}

/** A titled card of rows, as on a grouped settings screen, with an optional footer under it. */
export function Section({ title, footer, children }: SectionProps) {
  return (
    <SectionFrame title={title} footer={footer}>
      <View style={styles.card}>
        <View style={styles.clip}>
          {rowsOf(children).map((row, index) => (
            <Fragment key={row.key}>
              {index > 0 && <Separator />}
              {row.node}
            </Fragment>
          ))}
        </View>
      </View>
    </SectionFrame>
  );
}

const styles = StyleSheet.create((theme) => ({
  // The shadow and the clipping sit on separate views, so the clip cannot cut the shadow off.
  card: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.card,
    boxShadow: theme.shadowCard,
  },
  clip: { borderRadius: theme.radius.md, borderCurve: 'continuous', overflow: 'hidden' },
}));
