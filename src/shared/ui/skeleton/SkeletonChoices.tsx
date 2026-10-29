import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { ListRow } from '../layout/ListRow';
import { Section } from '../layout/Section';

import { SkeletonBlock } from './SkeletonBlock';

type Props = {
  rows: number;
  /** `field` stands in for a text field or a picker, `check` for a choice's mark */
  trailing: 'field' | 'check';
};

/** A titled `Section` of a form or filters on its way: each row a label and what ends it. */
export function SkeletonChoices({ rows, trailing }: Props) {
  return (
    <View style={styles.titled}>
      <View style={styles.title}>
        <SkeletonBlock width="30%" height={10} />
      </View>
      <Section>
        {Array.from({ length: rows }, (_, index) => (
          <ListRow
            key={index}
            title={<SkeletonBlock width="45%" height={14} />}
            trailing={
              trailing === 'field' ? (
                <SkeletonBlock width={96} height={28} />
              ) : (
                <SkeletonBlock width={22} height={22} shape="circle" />
              )
            }
          />
        ))}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  titled: { gap: theme.space.sm },
  title: { paddingHorizontal: theme.space.lg },
}));
