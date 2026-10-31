import type { ActiveWallet } from '@/entities/portfolio';

import { portfolioReport } from '../portfolioReport';
import { redemptionsReport } from '../redemptionsReport';
import { type ReportPdf, portfolioPdf, redemptionsPdf, scopeLine, yearsPdf } from '../reportPdf';
import { reportPdfHtml } from '../reportPdfHtml';
import { yearOverYearReport } from '../yearOverYearReport';

import { plannedActiveWallet, plannedWallet } from './plannedWallet';

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
          columns: [],
          rows: [],
          summary: [{ label: 'Купони', value: '1 000 ₴', color: 'coupon' }],
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

  const wallet = { today: '2026-10-27', plan: { name: 'План' } } as ActiveWallet;

  it('colors a value by the sign it is given, not by the words of its label', () => {
    const html = reportPdfHtml({
      title: 'Звіт',
      scope: '2026',
      fileStem: 'year-2026',
      wallet,
      sections: [
        {
          title: 'Підсумок',
          layout: 'summary',
          columns: [],
          rows: [],
          summary: [
            { label: 'Річна дохідність', value: '-2%' },
            { label: 'Дохід за рік', value: '−500,00 ₴', signed: -500, total: true },
          ],
        },
      ],
    });

    expect(html.match(/class="negative"/g)).toHaveLength(1);
    expect(html.match(/summary-row important/g)).toHaveLength(1);
  });

  it('colors the table cells it is told to, as the screen’s tables do', () => {
    const html = reportPdfHtml({
      title: 'Звіт',
      scope: '2026',
      fileStem: 'years',
      wallet,
      sections: [
        {
          title: 'Підсумки по роках',
          columns: ['Рік', 'Дохід'],
          rows: [
            ['2025', '−10,00'],
            ['2026', '20,00'],
          ],
          signedCells: [
            [null, -10],
            [null, 20],
          ],
          total: ['Разом', '10,00'],
          totalSigned: [null, 10],
        },
      ],
    });

    expect(html.match(/class="negative"/g)).toHaveLength(1);
    expect(html.match(/class="positive"/g)).toHaveLength(2);
  });

  it('names the filters that narrow the report and says when the NBU data is the saved one', () => {
    const filters = scopeLine({ currency: 'USD', isins: ['UA4000000001'] });
    expect(filters).toBe('Валюта: Долар · ОВДП: UA4000000001');
    expect(scopeLine({ currency: 'USD', isins: [] }, false)).toBeUndefined();
    expect(scopeLine({ currency: null, isins: [] })).toBeUndefined();

    const html = reportPdfHtml({
      title: 'Звіт',
      scope: '2026',
      fileStem: 'year-2026',
      wallet,
      sections: [],
      filters,
      stale: true,
    });
    expect(html).toContain('Валюта: Долар · ОВДП: UA4000000001');
    expect(html).toContain('Не вдалося оновити дані НБУ');
  });
});

describe('the PDF of the reports with planned purchases', () => {
  const summaryOf = (section: { summary?: { label: string; value: string; hint?: string }[] }) =>
    section.summary?.map(({ label, hint }) => [label, hint]);

  it('reads as the screen: the planned part, the bond’s state, the forecast years', () => {
    const portfolio = portfolioPdf(
      plannedActiveWallet,
      'Усі ОВДП',
      portfolioReport(plannedWallet, 'all'),
    );
    expect(summaryOf(portfolio.sections[0])).toContainEqual([
      'З них заплановано',
      'Купівлі, яких ще не зроблено',
    ]);
    expect(portfolio.sections[2].rows[0][1]).toBe('до 01.03.2027');

    const redemptions = redemptionsPdf(
      plannedActiveWallet,
      'Майбутні',
      redemptionsReport(plannedWallet, 'upcoming'),
    );
    expect(redemptions.sections[3].rows[0][4]).toBe('очікується · 3 з 5 шт заплановано');

    const years = yearsPdf(plannedActiveWallet, yearOverYearReport(plannedWallet));
    const flows = years.sections.find(({ title }) => title.startsWith('Рух грошей по роках'));
    expect(flows?.rows.map(([year]) => year)).toEqual(['2025', '2026*', '2027*']);
    expect(flows?.note).toContain('прогноз');
  });
});
