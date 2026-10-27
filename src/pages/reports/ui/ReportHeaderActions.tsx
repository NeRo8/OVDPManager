import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ReportName } from '@/features/report-filters';
import { showToast } from '@/shared/lib';
import { HeaderButton } from '@/shared/ui';
import type { ReportPdf } from '../model/reportPdf';
import { reportPdfHtml } from '../model/reportPdfHtml';
import { ReportFiltersButton } from './ReportFiltersButton';

type Props = {
  report: ReportName;
  activeFilterCount: number;
  createDocument: () => ReportPdf | null;
  available?: boolean;
};

/** Exports the currently visible report and opens the OS Save/Share actions. */
export function ReportHeaderActions({
  report,
  activeFilterCount,
  createDocument,
  available = true,
}: Props) {
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    if (!available || sharing) return;
    setSharing(true);
    try {
      const document = createDocument();
      if (!document) return;
      if (!(await Sharing.isAvailableAsync())) {
        showToast({ tone: 'error', title: 'Поширення недоступне на цьому пристрої' });
        return;
      }
      const { uri } = await Print.printToFileAsync({
        html: reportPdfHtml(document),
        width: 595,
        height: 842,
        // 10 mm on every side (28 pt). iOS uses the native printable rectangle; @page in the HTML
        // covers Android.
        margins: { left: 28, right: 28, top: 28, bottom: 28 },
      });
      const source = new File(uri);
      const target = new File(
        Paths.cache,
        `ovdp-${document.fileStem}-${document.wallet.today}.pdf`,
      );
      await source.move(target, { overwrite: true });
      await Sharing.shareAsync(target.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Поділитися PDF звітом',
      });
    } catch {
      showToast({ tone: 'error', title: 'Не вдалося створити або поширити PDF' });
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.actions}>
      <HeaderButton
        icon="share-outline"
        accessibilityLabel="Поділитися PDF звітом"
        onPress={() => void share()}
        disabled={!available || sharing}
      />
      <ReportFiltersButton report={report} activeFilterCount={activeFilterCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
