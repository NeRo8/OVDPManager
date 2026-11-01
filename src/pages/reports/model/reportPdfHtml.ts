import { formatDate } from '@/shared/lib';
import { light } from '@/shared/theme';

import type { ChartColor, PdfChart, PdfSection, ReportPdf } from './reportPdf';
import { reportPdfStyle } from './reportPdfStyle';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const chartColor = (color: ChartColor) =>
  ({
    coupon: light.seriesCoupon,
    redemption: light.seriesRedemption,
    purchase: light.seriesPurchase,
    plannedPurchase: light.seriesPlannedPurchase,
  })[color];

const chartLegend = (series: { label: string; color: ChartColor }[]) =>
  `<div class="legend">${series.map(({ label, color }) => `<span><i style="background:${chartColor(color)}"></i>${escapeHtml(label)}</span>`).join('')}</div>`;

/** Static SVG prints consistently in the native HTML-to-PDF WebView. */
function columnChart(chart: Extract<PdfChart, { kind: 'columns' }>): string {
  const groups: string[] = [];
  for (let start = 0; start < chart.labels.length; start += 12) {
    const labels = chart.labels.slice(start, start + 12);
    const series = chart.series.map((item) => ({
      ...item,
      values: item.values.slice(start, start + 12),
    }));
    const upMax = Math.max(
      1,
      ...labels.map((_, index) =>
        series.reduce((sum, item) => sum + (item.down ? 0 : item.values[index]), 0),
      ),
    );
    const downMax = Math.max(
      0,
      ...labels.map((_, index) =>
        series.reduce((sum, item) => sum + (item.down ? item.values[index] : 0), 0),
      ),
    );
    const baseline = downMax > 0 ? 110 : 150;
    const slot = 470 / labels.length;
    const barWidth = Math.min(24, slot * 0.58);
    const bars = labels
      .map((label, index) => {
        const x = 40 + index * slot + (slot - barWidth) / 2;
        let top = baseline;
        let bottom = baseline;
        const parts = series
          .map((item) => {
            const value = Math.max(0, item.values[index]);
            if (!value) return '';
            const height = item.down ? (value / downMax) * 38 : (value / upMax) * (baseline - 15);
            const y = item.down ? bottom : top - height;
            if (item.down) bottom += height;
            else top -= height;
            return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${height.toFixed(1)}" rx="3" fill="${chartColor(item.color)}"/>`;
          })
          .join('');
        return `${parts}<text x="${(x + barWidth / 2).toFixed(1)}" y="170" text-anchor="middle" class="axis-label">${escapeHtml(label)}</text>`;
      })
      .join('');
    groups.push(`<svg viewBox="0 0 520 178" role="img" aria-label="Графік за періодами" xmlns="http://www.w3.org/2000/svg">
      <line x1="40" x2="510" y1="${baseline}" y2="${baseline}" stroke="${light.border}" stroke-width="1.5"/>
      <line x1="40" x2="510" y1="15" y2="15" stroke="${light.border}" stroke-opacity="0.55"/>
      ${bars}</svg>`);
  }
  return groups.join('') + chartLegend(chart.series);
}

/** The class that colors a value by its sign, as `SignedValue`: none at zero. */
const toneOf = (signed: number | null | undefined) => {
  if (signed === undefined || signed === null || signed === 0) return '';
  if (signed > 0) return 'positive';
  return 'negative';
};

function barChart(chart: Extract<PdfChart, { kind: 'bars' }>): string {
  const max = Math.max(1, ...chart.bars.map(({ value }) => Math.abs(value)));
  return `<div class="bars">${chart.bars
    .map(
      (bar) => `
    <div class="bar-row"><div class="bar-head"><span>${escapeHtml(bar.label)}</span><strong class="${toneOf(bar.signed)}">${escapeHtml(bar.detail)}</strong></div>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, (Math.abs(bar.value) / max) * 100).toFixed(1)}%;background:${chartColor(bar.color)}"></div></div></div>`,
    )
    .join('')}</div>`;
}

function lineChart(chart: Extract<PdfChart, { kind: 'line' }>): string {
  if (chart.labels.length === 0) return '';
  const all = chart.series.flatMap(({ values }) => values);
  const minimum = Math.min(0, ...all);
  const maximum = Math.max(0, ...all);
  const range = Math.max(1, maximum - minimum);
  const xOf = (index: number) => 40 + (index / Math.max(1, chart.labels.length - 1)) * 470;
  const yOf = (value: number) => 145 - ((value - minimum) / range) * 125;
  const paths = chart.series
    .map((item) => {
      const points = item.values
        .map((value, index) => `${xOf(index).toFixed(1)},${yOf(value).toFixed(1)}`)
        .join(' ');
      return `<polyline points="${points}" fill="none" stroke="${chartColor(item.color)}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
    })
    .join('');
  const step = Math.max(1, Math.ceil(chart.labels.length / 7));
  const labels = chart.labels
    .map((label, index) =>
      index === 0 || index === chart.labels.length - 1 || index % step === 0
        ? `<text x="${xOf(index).toFixed(1)}" y="170" text-anchor="middle" class="axis-label">${escapeHtml(label.slice(2))}</text>`
        : '',
    )
    .join('');
  return `<svg viewBox="0 0 520 178" role="img" aria-label="Лінійний графік" xmlns="http://www.w3.org/2000/svg">
    <line x1="40" x2="510" y1="${yOf(0).toFixed(1)}" y2="${yOf(0).toFixed(1)}" stroke="${light.border}" stroke-width="1.5"/>
    ${paths}${labels}</svg>${chartLegend(chart.series)}`;
}

function renderChart(chart: PdfChart): string {
  if (chart.kind === 'columns') return columnChart(chart);
  if (chart.kind === 'bars') return barChart(chart);
  return lineChart(chart);
}

function renderSummary(section: PdfSection): string {
  return (section.summary ?? [])
    .map(({ label, value, hint, color, signed, total }) => {
      const tone = toneOf(signed);
      const swatch = color ? `<i class="swatch" style="background:${chartColor(color)}"></i>` : '';
      const note = hint ? `<small>${escapeHtml(hint)}</small>` : '';
      return `<div class="summary-row${total ? ' important' : ''}"><span class="summary-label">
      ${swatch}<span>${escapeHtml(label)}${note}</span></span>
      <strong class="${tone}">${escapeHtml(value)}</strong></div>`;
    })
    .join('');
}

function renderTable(section: PdfSection): string {
  const row = (cells: string[], kind = '', signed: (number | null)[] = []) => {
    const tag = kind === 'heading' ? 'th' : 'td';
    return `<tr class="${kind}">${cells.map((cell, index) => `<${tag} class="${toneOf(signed[index])}">${escapeHtml(cell)}</${tag}>`).join('')}</tr>`;
  };
  const kindOf = (index: number) => (section.groupRows?.includes(index) ? 'total' : '');
  return `<table><thead>${row(section.columns, 'heading')}</thead><tbody>${section.rows.map((cells, index) => row(cells, kindOf(index), section.signedCells?.[index])).join('')}
    ${section.total ? row(section.total, 'total', section.totalSigned) : ''}</tbody></table>`;
}

function renderItems(section: PdfSection): string {
  return (
    section.rows
      .map((row) => {
        const details = row
          .slice(1)
          .map((value, index) => {
            const label = section.columns[index + 1];
            if (value === '—') return '';
            // «<1%» still shows a sliver, as the screen's bar does.
            const share = label.toLowerCase().includes('частка')
              ? Number(value.replace('<', '').replace('%', '').replace(',', '.'))
              : null;
            return `<div class="item-detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>
        ${share !== null && Number.isFinite(share) ? `<div class="mini-track"><div style="width:${Math.min(100, Math.max(0, share))}%;"></div></div>` : ''}</div>`;
          })
          .join('');
        return `<article class="item"><div class="item-title">${escapeHtml(row[0])}</div><div class="item-grid">${details}</div></article>`;
      })
      .join('') || '<div class="empty">Даних немає</div>'
  );
}

function renderSection(section: PdfSection): string {
  const content = renderSectionContent(section);
  return `<section><h2>${escapeHtml(section.title)}</h2><div class="card ${section.layout ?? 'table'}">${content}</div>
    ${section.note ? `<p class="note">${escapeHtml(section.note)}</p>` : ''}</section>`;
}

function renderSectionContent(section: PdfSection) {
  if (section.layout === 'chart' && section.chart) return renderChart(section.chart);
  if (section.layout === 'summary') return renderSummary(section);
  if (section.layout === 'items') return renderItems(section);
  return renderTable(section);
}

/** Escapes plan names and report data before passing HTML to the native PDF renderer. */
export function reportPdfHtml(document: ReportPdf): string {
  const { title, scope, wallet, sections, filters, stale } = document;
  const content =
    sections.length === 0
      ? '<div class="card empty">Даних для звіту немає.</div>'
      : sections.map(renderSection).join('');
  return `<!DOCTYPE html><html lang="uk"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${reportPdfStyle}</style></head><body>
    <header class="report-head"><p class="eyebrow">ОВДП Портфель · Звіт</p><h1>${escapeHtml(scope)}</h1>
    <p class="report-name">${escapeHtml(title)}</p>${filters ? `<div class="meta">${escapeHtml(filters)}</div>` : ''}<div class="meta">План «${escapeHtml(wallet.plan?.name ?? '')}» · сформовано ${escapeHtml(formatDate(wallet.today))}</div>
    ${stale ? '<p class="stale">Не вдалося оновити дані НБУ — показано збережені.</p>' : ''}</header>
    ${content}<footer>Джерело умов ОВДП та ставок: НБУ · План «${escapeHtml(wallet.plan?.name ?? '')}»</footer>
    </body></html>`;
}
