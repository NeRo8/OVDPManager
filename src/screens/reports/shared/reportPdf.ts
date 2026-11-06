import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { formatDate } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/format';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );
}

export function reportHtml(
  planName: string,
  today: string,
  status: string,
  sections: ReportSection[],
  stale: boolean,
  title = 'Звіт по портфелю',
): string {
  const chartHtml = (section: ReportSection) => {
    if (!section.chart?.bars.length) return '';
    const max = Math.max(0, ...section.chart.bars.map((bar) => Math.abs(bar.value)));
    const currency = section.chart.currency;
    const percent = section.chart.percent;
    return `<div class="chart">${section.chart.title ? `<strong>${escapeHtml(section.chart.title)}</strong>` : ''}${section.chart.bars.map((bar) => `<div class="bar-row"><span>${escapeHtml(bar.label)}</span><div class="track"><div class="bar" style="width:${max ? (Math.abs(bar.value) / max) * 100 : 0}%;${bar.value < 0 ? 'background:#a14a4a' : ''}"></div></div><span>${escapeHtml(percent ? formatPercent(bar.value) : formatMoney(bar.value, currency))}</span></div>`).join('')}</div>`;
  };
  const lineChartHtml = (section: ReportSection) => {
    const chart = section.lineChart;
    if (!chart || !chart.labels.length || !chart.series.length) return '';
    const values = chart.series.flatMap((item) => item.values);
    const min = Math.min(0, ...values);
    const max = Math.max(0, ...values);
    const span = max - min || 1;
    const colors = ['#526f91', '#8b5793', '#20704e', '#be7429', '#a14444'];
    const lines = chart.series
      .map((item, seriesIndex) => {
        const xOf = (index: number) =>
          chart.labels.length === 1
            ? 300
            : (chart.positions?.[index] ?? index / (chart.labels.length - 1)) * 580 + 10;
        const yOf = (value: number) => 140 - ((value - min) / span) * 120;
        const points = item.values.map((value, index) => `${xOf(index)},${yOf(value)}`).join(' ');
        const color = colors[seriesIndex % colors.length];
        if (chart.labels.length === 1)
          return `<circle cx="300" cy="${yOf(item.values[0])}" r="3" fill="${color}"/>`;
        if (chart.step) {
          const path = item.values
            .map((value, index) =>
              index === 0 ? `M ${xOf(index)} ${yOf(value)}` : `H ${xOf(index)} V ${yOf(value)}`,
            )
            .join(' ');
          return `<path fill="none" stroke="${color}" stroke-width="2" d="${path}"/>`;
        }
        return `<polyline fill="none" stroke="${color}" stroke-width="2" points="${points}"/>`;
      })
      .join('');
    const legend = chart.series
      .map(
        (item, index) =>
          `<span style="color:${colors[index % colors.length]}">${escapeHtml(item.label)}</span>`,
      )
      .join(' · ');
    return `<div class="chart"><svg viewBox="0 0 600 150" width="100%" height="150" role="img">${lines}</svg><p>${escapeHtml(chart.labels[0])} — ${escapeHtml(chart.labels.at(-1) ?? '')} · ${legend}</p></div>`;
  };
  const capitalChartHtml = (section: ReportSection) => {
    const chart = section.capitalChart;
    if (!chart) return '';
    const line = lineChartHtml({
      title: section.title,
      rows: [],
      lineChart: {
        labels: chart.dates.map(formatDate),
        positions: chart.positions,
        series: chart.series,
        step: true,
      },
    });
    const rows = chart.dates.flatMap((date, index) =>
      chart.series.map(
        (item) =>
          `<tr><td>${escapeHtml(`${formatDate(date)} · ${item.label}`)}</td><td>${escapeHtml(formatMoney(item.values[index], chart.currency))}</td></tr>`,
      ),
    );
    return `${line}<table>${rows.join('')}</table>`;
  };
  const tableHtml = (section: ReportSection) => {
    const table = section.table;
    if (!table) return '';
    const heading = `<tr><th>${escapeHtml(table.firstColumn ?? 'Міс')}</th>${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>`;
    const rows = table.rows
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.label)}</td>${row.values.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`,
      )
      .join('');
    return `<table class="period-table"><thead>${heading}</thead><tbody>${rows}</tbody></table>`;
  };
  const content = sections
    .map(
      (section) => `
    <section><h2>${escapeHtml(section.title)}</h2>
    ${section.rows.length ? `<table>${section.rows.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.value)}</td></tr>`).join('')}</table>` : ''}${tableHtml(section)}${chartHtml(section)}${capitalChartHtml(section)}${lineChartHtml(section)}
    ${section.footer ? `<p>${escapeHtml(section.footer)}</p>` : ''}</section>`,
    )
    .join('');
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><style>
    @page { margin: 15mm; } body { font: 11pt -apple-system, Arial, sans-serif; color: #222; }
    h1 { font-size: 20pt; } h2 { font-size: 14pt; margin-top: 20pt; break-after: avoid; }
    table { width: 100%; border-collapse: collapse; } thead { display: table-header-group; }
    tr { break-inside: avoid; }
    td { padding: 5pt 0; border-bottom: 1px solid #ddd; } td:last-child { text-align: right; }
    .period-table { margin: 10pt 0; } .period-table th, .period-table td { text-align: right; padding: 5pt 3pt; }
    .period-table th:first-child, .period-table td:first-child { text-align: left; }
    .chart { margin: 10pt 0; } .bar-row { display: flex; gap: 8pt; align-items: center; margin: 4pt 0; font-size: 9pt; }
    .bar-row > span:first-child { width: 100pt; } .bar-row > span:last-child { width: 90pt; text-align: right; }
    .track { flex: 1; background: #eee; height: 8pt; } .bar { background: #526f91; height: 8pt; }
    p { color: #555; font-size: 9pt; }
  </style></head><body><h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(planName)} · ${escapeHtml(status)} · станом на ${escapeHtml(formatDate(today))}</p>
    ${stale ? '<p>Не вдалося оновити дані НБУ — показано збережені.</p>' : ''}
    ${content}<p>Розрахунок включає заплановані операції. Виплати наведено за збереженим графіком НБУ.</p>
  </body></html>`;
}
