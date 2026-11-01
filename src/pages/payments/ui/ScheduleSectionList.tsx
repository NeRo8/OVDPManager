import {
  SectionList,
  type SectionListData,
  type SectionListProps,
  type SectionListRenderItemInfo,
  View,
} from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { ScheduleEventRow, type ScheduleEvent } from '@/entities/portfolio';

import {
  EmptyState,
  type EmptyStateProps,
  SectionCell,
  Typography,
  screenContent,
} from '@/shared/ui';

import type { ScheduleSection } from '../model/scheduleSections';

type Props = Pick<
  SectionListProps<ScheduleEvent, ScheduleSection>,
  'ListHeaderComponent' | 'ListFooterComponent' | 'refreshControl'
> & {
  sections: ScheduleSection[];
  /** Shown instead of the months when there are no events: why, and what would show some */
  empty: Omit<EmptyStateProps, 'layout' | 'children'>;
};

const keyOf = (event: ScheduleEvent) =>
  event.type === 'purchase' ? event.id : `${event.isin}-${event.date}-${event.type}`;

/** Events grouped by month: the payments screen's list. */
export function ScheduleSectionList({ empty, ...props }: Props) {
  const renderSectionHeader = ({
    section,
  }: {
    section: SectionListData<ScheduleEvent, ScheduleSection>;
  }) => (
    <View style={styles.sectionHeader}>
      <Typography variant="overline" tone="secondary">
        {section.title}
      </Typography>
      <Typography variant="caption1" tone="secondary">
        {section.paymentTotal}
      </Typography>
    </View>
  );

  const renderEvent = ({
    item,
    index,
    section,
  }: SectionListRenderItemInfo<ScheduleEvent, ScheduleSection>) => (
    <SectionCell index={index} count={section.data.length}>
      <ScheduleEventRow event={item} showIsin />
    </SectionCell>
  );

  return (
    <SectionList
      {...props}
      style={styles.list}
      contentContainerStyle={[screenContent, styles.content]}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      keyExtractor={keyOf}
      renderSectionHeader={renderSectionHeader}
      ListEmptyComponent={<EmptyState layout="inline" {...empty} />}
      renderItem={renderEvent}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { backgroundColor: theme.background },
  content: { gap: 0 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: theme.space.lg,
    marginTop: theme.space.xl,
    marginBottom: theme.space.sm,
    gap: theme.space.xxs,
  },
}));
