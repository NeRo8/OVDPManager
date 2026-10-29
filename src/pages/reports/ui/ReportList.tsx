import { RefreshControl, SectionList, type SectionListProps, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { type ActiveWallet, NbuSourceNote } from '@/entities/portfolio';

import { usePullToRefresh } from '@/shared/lib';
import { screenContent } from '@/shared/ui';

import { ReportCaption } from './ReportCaption';

type Props<ItemT, SectionT> = Omit<
  SectionListProps<ItemT, SectionT>,
  | 'style'
  | 'contentContainerStyle'
  | 'contentInsetAdjustmentBehavior'
  | 'stickySectionHeadersEnabled'
  | 'refreshControl'
  | 'ListFooterComponent'
> & {
  wallet: ActiveWallet;
};

/**
 * A report laid out as a list: a section per currency, its long part as rows that render as they
 * scroll. It refreshes the NBU data on pull and ends with the source and the plan and date it was
 * made. The list has no gaps of its own; section headers space themselves.
 */
export function ReportList<ItemT, SectionT>({ wallet, ...props }: Props<ItemT, SectionT>) {
  const pullToRefresh = usePullToRefresh(wallet.refresh);

  return (
    <SectionList
      {...props}
      style={styles.list}
      contentContainerStyle={[screenContent, styles.content]}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl {...pullToRefresh} />}
      ListFooterComponent={
        <View style={styles.footer}>
          <NbuSourceNote />
          <ReportCaption planName={wallet.plan?.name} date={wallet.today} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { backgroundColor: theme.background },
  content: { gap: 0 },
  footer: { gap: theme.space.xxs, marginTop: theme.space.xl },
}));
