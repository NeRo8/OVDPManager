import { useState } from 'react';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { showToast } from '@/stores/appSettings';

import { reportHtml } from './reportPdf';

type Options = {
  planName?: string;
  today: string;
  context: string;
  title: string;
  sections: ReportSection[];
  stale: boolean;
};

export function useReportShare({ planName, today, context, title, sections, stale }: Options) {
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (!planName || !sections.length || sharing) return;
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        showToast({ tone: 'error', title: 'Поширення недоступне на цьому пристрої' });
        return;
      }
      const html = reportHtml(planName, today, context, sections, stale, title);
      const file = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch {
      showToast({ tone: 'error', title: 'Не вдалося створити PDF', message: 'Спробуйте ще раз.' });
    } finally {
      setSharing(false);
    }
  };
  return { sharing, share };
}
