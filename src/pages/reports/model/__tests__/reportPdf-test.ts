import type { ActiveWallet } from '@/entities/portfolio';
import type { ReportPdf } from '../reportPdf';
import { reportPdfHtml } from '../reportPdfHtml';

describe('reportPdfHtml', () => {
  it('keeps user-provided plan text out of HTML markup', () => {
    const document: ReportPdf = {
      title: 'Звіт за рік',
      scope: '2026',
      fileStem: 'year-2026',
      wallet: {
        today: '2026-10-27',
        plan: { name: '<script>alert("x")</script>' },
      } as ActiveWallet,
      sections: [{ title: 'Підсумок', columns: ['Показник'], rows: [['<img src=x>']] }],
    };

    const html = reportPdfHtml(document);

    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x>');
  });

  it('renders report cards and the chart in the same series colors as the app', () => {
    const document: ReportPdf = {
      title: 'Звіт за рік',
      scope: '2026',
      fileStem: 'year-2026',
      wallet: { today: '2026-10-27', plan: { name: 'План' } } as ActiveWallet,
      sections: [
        {
          title: 'Підсумок',
          layout: 'summary',
          columns: ['Показник', 'Значення'],
          rows: [['Купони', '1 000 ₴']],
        },
        {
          title: 'Грошові потоки',
          layout: 'chart',
          columns: [],
          rows: [],
          chart: {
            kind: 'columns',
            labels: ['Січ'],
            series: [{ label: 'Купони', color: 'coupon', values: [1000] }],
          },
        },
      ],
    };

    const html = reportPdfHtml(document);

    expect(html).toContain('class="card summary"');
    expect(html).toContain('class="card chart"');
    expect(html).toContain('<svg');
    expect(html).toContain('#21A0A0');
  });
});
