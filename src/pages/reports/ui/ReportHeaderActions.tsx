import { useState } from 'react';
import { View } from 'react-native';

import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StyleSheet } from 'react-native-unistyles';

import type { ReportName, ReportScope } from '@/features/report-filters';

import { useBonds } from '@/entities/portfolio';

import { showToast } from '@/shared/lib';
import { HeaderButton } from '@/shared/ui';

import { type ReportPdf, scopeLine } from '../model/reportPdf';
import { reportPdfHtml } from '../model/reportPdfHtml';

import { ReportFiltersButton } from './ReportFiltersButton';

type Props = {
  report: ReportName;
  activeFilterCount: number;
  createDocument: () => ReportPdf | null;
  /** The currency and bonds the report is narrowed to, named under the PDF's title */
  scope?: ReportScope;
  /** False while the report has nothing to put on paper */
  available?: boolean;
};

/**
 * Exports the currently visible report and opens the OS Save/Share actions. The document names the
 * filters that narrow it and says when the NBU data shown is the saved one, as the screen does.
 */
export function ReportHeaderActions({
  report,
  activeFilterCount,
  createDocument,
  scope,
  available = true,
}: Props) {
  const [sharing, setSharing] = useState(false);
  const { bonds, error } = useBonds();

  const share = async () => {
    if (!available || sharing) return;
    setSharing(true);
    try {
      const created = createDocument();
      if (!created) return;
      // The FX report always covers hryvnia bonds; its title names the currency it compares with.
      const filters = scope && scopeLine(scope, report !== 'fx');
      const document: ReportPdf = { ...created, filters, stale: !!error && !!bonds };
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
