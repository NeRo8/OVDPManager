import { reportHtml } from './reportPdf';

describe('reportHtml', () => {
  it('includes report rows and escapes user-supplied plan names', () => {
    const html = reportHtml(
      '<script>План</script>',
      '2026-01-01',
      'Усі',
      [{ title: 'Підсумок · UAH', rows: [{ label: 'Вкладено', value: '1 000,00 ₴' }] }],
      true,
    );
    expect(html).toContain('&lt;script&gt;План&lt;/script&gt;');
    expect(html).not.toContain('<script>План</script>');
    expect(html).toContain('Вкладено');
    expect(html).toContain('1 000,00 ₴');
    expect(html).toContain('показано збережені');
  });
});

it('includes a line chart with escaped labels', () => {
  const html = reportHtml(
    'План',
    '2026-01-01',
    'Усі',
    [
      {
        title: 'Динаміка',
        rows: [],
        lineChart: {
          labels: ['2025-01', '2025-02'],
          series: [{ label: '<Вкладено>', values: [100, 120] }],
        },
      },
    ],
    false,
  );
  expect(html).toContain('<polyline');
  expect(html).toContain('&lt;Вкладено&gt;');
});

it('prints months as rows and escapes table content', () => {
  const html = reportHtml(
    'План',
    '2026-01-01',
    '2026',
    [
      {
        title: 'За місяцями',
        rows: [],
        table: {
          firstColumn: 'Період',
          columns: ['Купівлі', 'Продажі'],
          rows: [{ label: 'січ 2026', values: ['1', '<4>'] }],
        },
      },
    ],
    false,
  );
  expect(html.match(/class="period-table"/g)).toHaveLength(1);
  expect(html).toContain('<th>Купівлі</th>');
  expect(html).toContain('<th>Період</th>');
  expect(html).toContain('<td>січ 2026</td>');
  expect(html).toContain('&lt;4&gt;');
});
