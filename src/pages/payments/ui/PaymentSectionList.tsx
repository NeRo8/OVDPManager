import { SectionList, StyleSheet, View, type SectionListProps } from 'react-native';

import { PaymentRow, type PositionPayment } from '@/entities/portfolio';
import { themeStyles } from '@/shared/theme';
import { SectionCell, Typography, screenContent } from '@/shared/ui';
import type { PaymentSection } from '../model/paymentSections';

type Props = Pick<
  SectionListProps<PositionPayment, PaymentSection>,
  'ListHeaderComponent' | 'ListEmptyComponent' | 'ListFooterComponent' | 'refreshControl'
> & { sections: PaymentSection[] };

/** Payments grouped by month: the shared list of the payments and schedule screens. */
export function PaymentSectionList(props: Props) {
  const theme = themeStyles;
  return (
    <SectionList
      {...props}
      style={theme.background}
      contentContainerStyle={[screenContent, styles.content]}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      keyExtractor={(payment) => `${payment.isin}-${payment.date}-${payment.type}`}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Typography variant="overline" tone="secondary">
            {section.title}
          </Typography>
          <Typography variant="caption1" tone="secondary">
            {section.total}
          </Typography>
        </View>
      )}
      renderItem={({ item, index, section }) => (
        <SectionCell index={index} count={section.data.length}>
          <PaymentRow payment={item} showIsin />
        </SectionCell>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { gap: 0 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 6,
    gap: 2,
  },
});
