import { View } from 'react-native';

import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { HeaderButton } from '@/components/button/HeaderButton';
import {
  serializeReportParams,
  type ReportName,
  type ReportSelection,
} from '@/screens/reports/shared/reportParams';

type Props = {
  report: ReportName;
  selection: ReportSelection;
  sharing: boolean;
  hasData: boolean;
  share: () => void;
};

export function ReportHeaderActions({ report, selection, sharing, hasData, share }: Props) {
  return (
    <View style={styles.actions}>
      <HeaderButton
        icon="options-outline"
        accessibilityLabel="Фільтри звіту"
        onPress={() =>
          router.push({
            pathname: '/reports/filters/[report]',
            params: { report, ...serializeReportParams(selection, report) },
          })
        }
      />
      <HeaderButton
        icon="share-outline"
        accessibilityLabel="Поширити PDF"
        disabled={!hasData || sharing}
        onPress={share}
      />
    </View>
  );
}

const styles = StyleSheet.create({ actions: { flexDirection: 'row' } });
