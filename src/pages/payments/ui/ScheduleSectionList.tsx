import { SectionList, View, type SectionListProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScheduleEventRow, type ScheduleEvent } from '@/entities/portfolio';
import { SectionCell, Typography, screenContent } from '@/shared/ui';
import type { ScheduleSection } from '../model/scheduleSections';

type Props = Pick<
  SectionListProps<ScheduleEvent, ScheduleSection>,
  'ListHeaderComponent' | 'ListFooterComponent' | 'refreshControl'
> & {
  sections: ScheduleSection[];
  /** Shown instead of the months when there are no payments */
  emptyMessage: string;
};

/** Events grouped by month: the shared list of the payments and schedule screens. */
export function ScheduleSectionList({ emptyMessage, ...props }: Props) {
  return (
    <SectionList
      {...props}
      style={styles.list}
      contentContainerStyle={[screenContent, styles.content]}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      keyExtractor={(event) =>
        event.type === 'purchase' ? event.id : `${event.isin}-${event.date}-${event.type}`
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Typography variant="overline" tone="secondary">
            {section.title}
          </Typography>
          <Typography variant="caption1" tone="secondary">
            {section.paymentTotal}
          </Typography>
        </View>
      )}
      ListEmptyComponent={
        <Typography variant="subhead" tone="secondary" align="center" style={styles.empty}>
          {emptyMessage}
        </Typography>
      }
      renderItem={({ item, index, section }) => (
        <SectionCell index={index} count={section.data.length}>
          <ScheduleEventRow event={item} showIsin />
        </SectionCell>
      )}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { backgroundColor: theme.background },
  content: { gap: 0 },
  empty: { marginTop: theme.space.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: theme.space.lg,
    marginTop: theme.space.xl,
    marginBottom: theme.space.sm,
    gap: theme.space.xxs,
  },
}));
