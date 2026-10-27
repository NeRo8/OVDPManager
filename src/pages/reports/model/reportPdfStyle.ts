import { light } from '@/shared/theme';

/**
 * Paper-sized interpretation of the report UI's light palette, cards and type hierarchy. The page
 * stays white, so the 10 mm margin shows on paper and no ink goes on a fill; a block keeps its
 * title with its card on one page, and a card too long for a page draws its frame on each one.
 */
export const reportPdfStyle = `
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: ${light.text}; font-family: -apple-system, BlinkMacSystemFont, 'Arial', sans-serif; font-size: 11px; line-height: 1.4; }
  .report-head { text-align: center; padding: 18px 12px 16px; margin-bottom: 16px; }
  .eyebrow, h2 { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .65px; color: ${light.secondaryText}; }
  .eyebrow { color: ${light.accent}; margin: 0 0 8px; }
  h1 { font-size: 23px; line-height: 1.2; margin: 0 0 5px; font-weight: 700; }
  .report-name { margin: 0; font-size: 13px; color: ${light.secondaryText}; }
  .meta { margin-top: 13px; color: ${light.secondaryText}; font-size: 10px; }
  section { margin: 0 0 18px; break-inside: avoid; page-break-inside: avoid; }
  h2 { margin: 0 0 7px 14px; break-after: avoid; page-break-after: avoid; }
  .card { background: ${light.card}; border: 1px solid ${light.border}; border-radius: 12px; padding: 13px 15px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .summary-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 7px 0; border-bottom: 1px solid ${light.border}; break-inside: avoid; }
  .summary-row:last-child { border: 0; }.summary-row.important { font-size: 12px; font-weight: 600; }
  .summary-label { display: inline-flex; align-items: center; gap: 7px; color: ${light.secondaryText}; }
  .summary-row.important .summary-label { color: ${light.text}; }
  .summary-label small { display: block; font-size: 9px; color: ${light.secondaryText}; font-weight: 400; margin-top: 2px; }
  .summary-row strong { text-align: right; white-space: nowrap; font-weight: 600; font-variant-numeric: tabular-nums; }
  .summary-row strong.positive { color: ${light.positive}; } .summary-row strong.negative { color: ${light.danger}; }
  .swatch, .legend i { display: inline-block; flex: none; width: 8px; height: 8px; border-radius: 3px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; font-variant-numeric: tabular-nums; }
  thead { display: table-header-group; } tr { break-inside: avoid; page-break-inside: avoid; }
  th, td { padding: 7px 3px; text-align: right; vertical-align: top; border-bottom: 1px solid ${light.border}; overflow-wrap: anywhere; }
  th { color: ${light.secondaryText}; font-weight: 500; } th:first-child, td:first-child { text-align: left; width: 19%; }
  tr:last-child td { border: 0; } tr.total td { font-weight: 700; border-top: 1px solid ${light.border}; border-bottom: 0; }
  .card.items { padding: 0; } .item { padding: 11px 15px; border-bottom: 1px solid ${light.border}; break-inside: avoid; page-break-inside: avoid; }
  .item:last-child { border: 0; } .item-title { font-size: 12px; font-weight: 700; color: ${light.text}; margin-bottom: 6px; font-variant-numeric: tabular-nums; }
  .item-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 20px; }
  .item-detail { display: flex; justify-content: space-between; gap: 6px; flex-wrap: wrap; font-size: 10px; }
  .item-detail span { color: ${light.secondaryText}; } .item-detail strong { font-weight: 600; font-variant-numeric: tabular-nums; }
  .mini-track, .bar-track { height: 5px; width: 100%; border-radius: 6px; background: ${light.muted}; overflow: hidden; }
  .mini-track div { height: 100%; border-radius: 6px; background: ${light.accent}; }
  .card.chart { padding: 14px; } svg { break-inside: avoid; page-break-inside: avoid; width: 100%; height: auto; display: block; }
  .axis-label { font-size: 10px; fill: ${light.secondaryText}; font-family: Arial, sans-serif; }
  .legend { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; padding-top: 8px; font-size: 10px; color: ${light.secondaryText}; }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .bars { display: flex; flex-direction: column; gap: 11px; } .bar-row { break-inside: avoid; }
  .bar-head { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px; font-size: 10px; }
  .bar-head span { color: ${light.secondaryText}; } .bar-head strong { font-weight: 600; }
  .bar-fill { height: 100%; border-radius: 6px; }
  .note { margin: 7px 14px 0; color: ${light.secondaryText}; font-size: 10px; }
  .empty { color: ${light.secondaryText}; padding: 20px; text-align: center; }
  footer { margin-top: 22px; padding: 10px 13px; border-top: 1px solid ${light.border}; color: ${light.secondaryText}; font-size: 9px; }
`;
