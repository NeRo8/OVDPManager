import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Section, type SectionProps } from '../layout/Section';
import { SegmentedSelect, type SegmentedSelectProps } from './SegmentedSelect';

export type SegmentedSectionProps<T extends string | number> = SegmentedSelectProps<T> &
  Pick<SectionProps, 'title' | 'footer'>;

/** A filter's section that is one choice out of a few: the segmented control in a card. */
export function SegmentedSection<T extends string | number>({
  title,
  footer,
  ...select
}: SegmentedSectionProps<T>) {
  return (
    <Section title={title} footer={footer}>
      <View style={styles.picker}>
        <SegmentedSelect {...select} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
