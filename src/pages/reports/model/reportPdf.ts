import type { ReportScope } from '@/features/report-filters';

import {
  type ActiveWallet,
  CURRENCY_NAMES,
  type Currency,
  type ExchangeCurrency,
  pricePerBond,
  isPlannedPurchase,
  netIncomeBasis,
} from '@/entities/portfolio';

import { formatAmount, formatDate, formatMoney, formatTimeLeft } from '@/shared/lib';

import { bondStateLabel } from '../lib/portfolioLabels';
import {
  FORECAST_NOTE,
  QUARTER_LABELS,
  amountCell,
  changeCell,
  monthName,
  pointsCell,
  shareCell,
  yearCell,
} from '../lib/reportCells';
import { TERM_BUCKET_LABELS } from '../lib/structureLabels';

import type { BondReport as SingleBondReport } from './bondReport';
import type { FxReport } from './fxReport';
import { periodChartPeriods } from './periodChart';
import type { CurrencyReport, Flows } from './periodReport';
import type { CurrencyPortfolio } from './portfolioReport';
import { purchaseValues } from './purchaseValues';
import type { CurrencyRedemptions } from './redemptionsReport';
import { type ReportTerms, summaryFooter } from './reportTerms';
import type { StructureReport } from './structureReport';
import type { CurrencyYears } from './yearOverYearReport';
import { type CurrencyYield, KEY_RATE_CURRENCY, yieldChartBonds } from './yieldReport';

/**
 * A report as a printed document. It says what the screen says: the same blocks in the same order,
 * labelled and formatted by the same helpers (`lib/`), so paper and screen read alike.
 */

export type ChartColor = 'coupon' | 'redemption' | 'purchase' | 'plannedPurchase';

export type PdfChart =
  | {
      kind: 'columns';
      labels: string[];
      series: { label: string; color: ChartColor; values: number[]; down?: boolean }[];
    }
  | {
      kind: 'bars';
      /** A bar grows from zero with `value`, as `ShareBar`; `signed` colors its detail */
      bars: { label: string; value: number; detail: string; color: ChartColor; signed?: number }[];
    }
  | {
      kind: 'line';
      labels: string[];
      series: { label: string; color: ChartColor; values: number[] }[];
    };

/** A row of a summary block, as the screen's `InfoRow`, `LegendRow` or `TotalRow` shows it. */
export type PdfSummaryRow = {
  label: string;
  value: string;
  hint?: string;
  /** The series swatch before the label, as `LegendRow` */
  color?: ChartColor;
  /** Colors the value by its sign, as `SignedValue` */
  signed?: number;
  /** Bold, as `TotalRow` */
  total?: boolean;
};

export type PdfSection = {
  title: string;
  columns: string[];
  rows: string[][];
  layout?: 'summary' | 'table' | 'items' | 'chart';
  /** The rows of a `summary` */
  summary?: PdfSummaryRow[];
  chart?: PdfChart;
  total?: string[];
  /** Rows of a `table` that head a group, as a year above its months */
  groupRows?: number[];
  /** Per cell of `rows`, the number whose sign colors it, as the screen's `signedCells` */
  signedCells?: (number | null)[][];
  /** The same for `total` */
  totalSigned?: (number | null)[];
  note?: string;
};

export type ReportPdf = {
  title: string;
  scope: string;
  fileStem: string;
  wallet: ActiveWallet;
  sections: PdfSection[];
  /** The currency and bonds the report is narrowed to, spelled out */
  filters?: string;
  /** The NBU data could not be refreshed and the saved one is shown */
  stale?: boolean;
};

/** «Валюта: Долар · ОВДП: UA4000…, UA4000…»; nothing when the report covers the whole wallet. */
export function scopeLine(scope: ReportScope, withCurrency = true): string | undefined {
  const parts = [
    withCurrency && scope.currency !== null && `Валюта: ${CURRENCY_NAMES[scope.currency]}`,
    scope.isins.length > 0 && `ОВДП: ${scope.isins.join(', ')}`,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

const summary = (title: string, rows: (PdfSummaryRow | false)[], note?: string): PdfSection => ({
  title,
  columns: [],
  rows: [],
  layout: 'summary',
  summary: rows.filter((row): row is PdfSummaryRow => row !== false),
  note,
});

const notes = (...parts: (string | false | undefined)[]) =>
  parts.filter(Boolean).join(' ') || undefined;

const percent = (value: number | null) => (value === null ? '—' : `${value}%`);

const titled = (title: string, currency: Currency) => `${title} · ${CURRENCY_NAMES[currency]}`;

const flowChart = (title: string, rows: (Flows & { month: string })[]): PdfSection => {
  const { made, planned } = purchaseValues(rows);
  return {
    title,
    columns: [],
    rows: [],
    layout: 'chart',
    chart: {
      kind: 'columns',
      labels: rows.map(({ month }) => month),
      series: [
        { label: 'Купони', color: 'coupon', values: rows.map(({ coupons }) => coupons) },
        {
          label: 'Погашення',
          color: 'redemption',
          values: rows.map(({ redemptions }) => redemptions),
        },
        { label: 'Купівлі', color: 'purchase', values: made, down: true },
        ...(planned.some((value) => value > 0)
          ? [
              {
                label: 'Заплановані купівлі',
                color: 'plannedPurchase' as const,
                values: planned,
                down: true,
              },
            ]
          : []),
      ],
    },
  };
};

/** The year's or the period's months, a row with the year above each year's when they span several. */
function monthsTable(report: CurrencyReport): PdfSection {
  const { months } = report;
  const yearOf = (month: string) => month.slice(0, 4);
  const severalYears = yearOf(months[0].month) !== yearOf(months.at(-1)?.month ?? '');
  const rows: string[][] = [];
  const groupRows: number[] = [];
  months.forEach((month, index) => {
    const year = yearOf(month.month);
    if (severalYears && year !== yearOf(months[index - 1]?.month ?? '')) {
      groupRows.push(rows.length);
      rows.push([year, '', '', '']);
    }
    rows.push([
      monthName(month.month),
      amountCell(month.invested),
      amountCell(month.coupons),
      amountCell(month.redemptions),
    ]);
  });
  return {
    title: titled('По місяцях', report.currency),
    columns: ['Місяць', 'Купівлі', 'Купони', 'Погашення'],
    rows,
    groupRows,
    layout: 'table',
    total: [
      'Разом',
      amountCell(report.invested),
      amountCell(report.coupons),
      amountCell(report.redemptions),
    ],
  };
}

/** The year report and the period report, as `CurrencyReportList` shows them. */
export function periodPdf(
  title: string,
  scope: string,
  fileStem: string,
  wallet: ActiveWallet,
  reports: CurrencyReport[],
  terms: ReportTerms,
): ReportPdf {
  return {
    title,
    scope,
    fileStem,
    wallet,
    sections: reports.flatMap((report): PdfSection[] => {
      const { currency, highlights } = report;
      const money = (value: number) => formatMoney(value, currency);
      return [
        flowChart(
          titled(`Грошові потоки по ${report.months.length > 12 ? 'роках' : 'місяцях'}`, currency),
          periodChartPeriods(report.months).map((row) => ({
            ...row,
            month: row.month.length === 4 ? row.month : monthName(row.month),
          })),
        ),
        summary(
          titled('Підсумок', currency),
          [
            { label: 'Вкладено', value: money(report.invested), color: 'purchase' },
            { label: 'Купони', value: money(report.coupons), color: 'coupon' },
            { label: 'Погашення', value: money(report.redemptions), color: 'redemption' },
            {
              label: terms.balance,
              value: money(report.balance),
              signed: report.balance,
              total: true,
            },
            {
              label: terms.income,
              value: money(report.income),
              signed: report.income,
              total: true,
            },
            {
              label: 'Купони в середньому за місяць',
              value: money(report.averageMonthlyCoupons),
              total: true,
            },
          ],
          summaryFooter(terms, report.monthCount),
        ),
        ...(report.annualYield === null
          ? []
          : [
              summary(
                titled('Дохідність', currency),
                [
                  {
                    label: 'Річна дохідність',
                    hint: 'Середня за ОВДП',
                    value: `${report.annualYield}%`,
                  },
                  !!highlights.highestYield && {
                    label: 'Найвища річна дохідність',
                    hint: highlights.highestYield.isin,
                    value: percent(highlights.highestYield.annualYield),
                  },
                  !!highlights.lowestYield && {
                    label: 'Найнижча річна дохідність',
                    hint: highlights.lowestYield.isin,
                    value: percent(highlights.lowestYield.annualYield),
                  },
                ],
                `Річна дохідність — за ціною купівлі й усіма виплатами до погашення, як у формі купівлі. Середня — за ОВДП ${terms.span}, зважена на суму купівель; ОВДП без опублікованого погашення в неї не входять.`,
              ),
            ]),
        monthsTable(report),
        {
          title: titled('По ОВДП', currency),
          columns: [
            'ISIN',
            'Річна дохідність',
            'Купони',
            'Погашення',
            'Купівлі',
            terms.income,
            'Частка доходу',
          ],
          rows: report.bonds.map((bond) => [
            bond.isin,
            percent(bond.annualYield),
            amountCell(bond.coupons),
            amountCell(bond.redemptions),
            amountCell(bond.invested),
            bond.hasBondData ? amountCell(bond.income) : 'Немає даних НБУ',
            bond.incomeShare === null ? '—' : shareCell(bond.incomeShare),
          ]),
          layout: 'items',
        },
      ];
    }),
  };
}

const highlightHint = (row: { year: number; forecast: boolean }) =>
  `${row.year} рік${row.forecast ? ', прогноз' : ''}`;

/** Every year side by side, as the year-over-year screen shows them. */
export function yearsPdf(wallet: ActiveWallet, reports: CurrencyYears[]): ReportPdf {
  const years = reports.flatMap((report) => report.years.map(({ year }) => year));
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  return {
    title: 'Звіт від року до року',
    scope:
      years.length === 0
        ? 'Роки плану'
        : firstYear === lastYear
          ? String(firstYear)
          : `${firstYear} – ${lastYear}`,
    fileStem: 'year-over-year',
    wallet,
    sections: reports.flatMap((report): PdfSection[] => {
      const { currency, total, highlights } = report;
      const { highestIncome, highestPayments, highestInvested } = highlights;
      const money = (value: number) => formatMoney(value, currency);
      const forecast = report.years.some((year) => year.forecast);
      return [
        summary(
          titled('Підсумок', currency),
          [
            { label: 'Купони', value: money(total.coupons), color: 'coupon' },
            { label: 'Погашення', value: money(total.redemptions), color: 'redemption' },
            {
              label: 'Усього виплат',
              value: money(total.totalPayments),
              hint:
                total.expected > 0
                  ? `отримано ${money(total.received)}, очікується ${money(total.expected)}`
                  : undefined,
              total: true,
            },
            { label: 'Купівлі', value: money(total.invested), color: 'purchase' },
            {
              label: 'Сальдо за всі роки',
              value: money(total.balance),
              signed: total.balance,
              total: true,
            },
            {
              label: 'Дохід за всі роки',
              value: money(total.income),
              signed: total.income,
              total: true,
            },
          ],
          'Сальдо за всі роки — виплати мінус купівлі. Дохід за всі роки — купони та різниця між погашенням і ціною купівлі погашених ОВДП.',
        ),
        ...(highestIncome || highestPayments || highestInvested
          ? [
              summary(titled('Роки, що вирізняються', currency), [
                !!highestIncome && {
                  label: 'Найбільший дохід',
                  hint: highlightHint(highestIncome),
                  value: money(highestIncome.income),
                  signed: highestIncome.income,
                },
                !!highestPayments && {
                  label: 'Найбільше виплат',
                  hint: highlightHint(highestPayments),
                  value: money(highestPayments.totalPayments),
                },
                !!highestInvested && {
                  label: 'Найбільше вкладено',
                  hint: highlightHint(highestInvested),
                  value: money(highestInvested.invested),
                },
              ]),
            ]
          : []),
        ...(report.years.length > 0
          ? [
              flowChart(
                titled('Гроші по роках', currency),
                report.years.map((year) => ({ ...year, month: yearCell(year) })),
              ),
              {
                title: titled('Дохід по роках', currency),
                columns: [],
                rows: [],
                layout: 'chart' as const,
                chart: {
                  kind: 'bars' as const,
                  bars: report.years.map((year) => ({
                    label: yearCell(year),
                    value: Math.max(year.income, 0),
                    detail: money(year.income),
                    color: 'coupon' as const,
                    signed: year.income,
                  })),
                },
              },
            ]
          : []),
        {
          title: titled('Рух грошей по роках', currency),
          columns: ['Рік', 'Купівлі', 'Купони', 'Погашення'],
          rows: report.years.map((row) => [
            yearCell(row),
            amountCell(row.invested),
            amountCell(row.coupons),
            amountCell(row.redemptions),
          ]),
          total: [
            'Разом',
            amountCell(total.invested),
            amountCell(total.coupons),
            amountCell(total.redemptions),
          ],
          note: forecast ? FORECAST_NOTE : undefined,
        },
        {
          title: titled('Підсумки по роках', currency),
          columns: ['Рік', 'Сальдо', 'Дохід', 'Зміна доходу'],
          rows: report.years.map((row) => [
            yearCell(row),
            formatAmount(row.balance),
            formatAmount(row.income),
            changeCell(row.incomeChange),
          ]),
          signedCells: report.years.map((row) => [
            null,
            row.balance,
            row.income,
            row.incomeChange === null ? null : Math.round(row.incomeChange),
          ]),
          total: ['Разом', formatAmount(total.balance), formatAmount(total.income), ''],
          totalSigned: [null, total.balance, total.income, null],
          note: notes('Зміна доходу — дохід року проти попереднього.', forecast && FORECAST_NOTE),
        },
      ];
    }),
  };
}

const describePayment = (payment: { isin: string; date: string }) =>
  `${payment.isin} · ${formatDate(payment.date)}`;

const plannedMark = (payment: { quantity: number; plannedQuantity: number }) =>
  payment.plannedQuantity === 0
    ? ''
    : payment.plannedQuantity === payment.quantity
      ? ' · заплановано'
      : ` · ${payment.plannedQuantity} з ${payment.quantity} шт заплановано`;

export function redemptionsPdf(
  wallet: ActiveWallet,
  scope: string,
  reports: CurrencyRedemptions[],
): ReportPdf {
  return {
    title: 'Графік погашень',
    scope,
    fileStem: 'redemptions',
    wallet,
    sections: reports.flatMap((report): PdfSection[] => {
      const { currency, total, received, expected, planned, next, last } = report;
      const money = (value: number) => formatMoney(value, currency);
      const both = received > 0 && expected > 0;
      const rows: string[][] = [];
      const groupRows: number[] = [];
      for (const year of report.years) {
        groupRows.push(rows.length);
        rows.push([
          String(year.year),
          amountCell(year.total),
          year.total > 0 ? shareCell(year.share) : '—',
        ]);
        for (const quarter of year.quarters) {
          rows.push([
            QUARTER_LABELS[quarter.quarter],
            amountCell(quarter.total),
            shareCell(quarter.share),
          ]);
        }
      }
      return [
        summary(titled('Підсумок', currency), [
          { label: 'Усього погашень', value: money(total) },
          both && { label: 'Отримано', value: money(received) },
          both && { label: 'Очікується', value: money(expected) },
          planned > 0 && {
            label: 'З них від запланованих купівель',
            hint: 'Погашення ОВДП, які ще лише заплановано купити',
            value: money(planned),
          },
          !!next && {
            label: 'Найближче погашення',
            hint: describePayment(next),
            value: money(next.total),
          },
          last !== next && {
            label: 'Останнє погашення',
            hint: describePayment(last),
            value: money(last.total),
          },
        ]),
        {
          title: titled('Погашення по роках', currency),
          columns: [],
          rows: [],
          layout: 'chart',
          chart: {
            kind: 'columns',
            labels: report.years.map((year) => String(year.year)),
            series: [
              {
                label: 'Погашення',
                color: 'redemption',
                values: report.years.map((year) => year.total),
              },
            ],
          },
        },
        {
          title: titled('По роках і кварталах', currency),
          columns: ['Період', 'Сума', 'Частка'],
          rows,
          groupRows,
          total: ['Разом', amountCell(total), '100%'],
          note: 'Частка — від усіх погашень у звіті.',
        },
        {
          title: titled('Погашення', currency),
          columns: ['ISIN', 'Дата', 'Кількість', 'Сума', 'Стан'],
          rows: report.payments.map((payment) => [
            payment.isin,
            formatDate(payment.date),
            `${payment.quantity} шт`,
            money(payment.total),
            (payment.isPaid ? 'отримано' : 'очікується') + plannedMark(payment),
          ]),
          layout: 'items',
        },
      ];
    }),
  };
}

export function portfolioPdf(
  wallet: ActiveWallet,
  scope: string,
  reports: CurrencyPortfolio[],
): ReportPdf {
  return {
    title: 'Звіт по портфелю',
    scope,
    fileStem: 'portfolio',
    wallet,
    sections: reports.flatMap((report): PdfSection[] => {
      const { currency, total, bonds, unknownCount, planned } = report;
      const money = (value: number) => formatMoney(value, currency);
      return [
        summary(
          titled('Підсумок', currency),
          [
            { label: 'ОВДП', value: String(bonds.length) },
            ...(total
              ? [
                  { label: 'Вкладено', value: money(total.invested) },
                  planned > 0 && {
                    label: 'З них заплановано',
                    hint: 'Купівлі, яких ще не зроблено',
                    value: money(planned),
                  },
                  { label: 'Купони', value: money(total.coupons) },
                  { label: 'Погашення', value: money(total.redemption) },
                  { label: 'Усього виплат', value: money(total.totalPayments) },
                  total.received > 0 &&
                    total.expected > 0 && { label: 'Отримано', value: money(total.received) },
                  total.received > 0 &&
                    total.expected > 0 && { label: 'Очікується', value: money(total.expected) },
                  total.netIncome !== null && {
                    label: 'Чистий дохід',
                    hint: netIncomeBasis(total),
                    value: money(total.netIncome),
                    signed: total.netIncome,
                    total: true,
                  },
                  total.netIncome !== null && {
                    label: 'Дохідність за весь строк',
                    value: `${total.returnPercent ?? 0}%`,
                  },
                ]
              : []),
          ],
          notes(
            'Чистий дохід — виплати мінус вкладення; дохідність за весь строк — він у відсотках від вкладень, без перерахунку на рік, податків і комісій.',
            unknownCount > 0 &&
              `ОВДП, яких немає в даних НБУ (${unknownCount}), не враховано в підсумку.`,
            !!total &&
              total.incompleteCount > 0 &&
              `НБУ ще не опублікував погашення ${total.incompleteCount} ОВДП: їхні купони у виплатах є, а погашення немає, тож чистий дохід і дохідність за весь строк рахуються без них — з тих сум, що під чистим доходом.`,
          ),
        ),
        {
          title: titled('Вкладення за ОВДП', currency),
          columns: [],
          rows: [],
          layout: 'chart',
          chart: {
            kind: 'bars',
            bars: [...bonds]
              .sort((a, b) => b.invested - a.invested)
              .slice(0, 5)
              .map((bond) => ({
                label: bond.isin,
                value: bond.invested,
                detail: money(bond.invested),
                color: 'purchase',
              })),
          },
        },
        {
          title: titled('По ОВДП', currency),
          columns: [
            'ISIN',
            'Стан',
            'Ставка купону',
            'Кількість',
            'Річна дохідність',
            'Вкладено',
            'З них заплановано',
            'Купони',
            'Погашення',
            'Чистий дохід',
            'Частка вкладень',
          ],
          rows: bonds.map((bond) => [
            bond.isin,
            bondStateLabel(bond.state, bond.bond?.maturityDate),
            percent(bond.bond?.rate ?? null),
            `${bond.quantity} шт`,
            percent(bond.annualYield),
            money(bond.invested),
            bond.planned > 0 && bond.planned < bond.invested ? money(bond.planned) : '—',
            bond.results ? money(bond.results.coupons) : '—',
            bond.results
              ? bond.results.complete
                ? money(bond.results.redemption)
                : 'Немає повних даних НБУ'
              : '—',
            bond.results?.netIncome == null ? '—' : money(bond.results.netIncome),
            bond.investedShare === null ? '—' : shareCell(bond.investedShare),
          ]),
          layout: 'items',
        },
      ];
    }),
  };
}

export function structurePdf(
  wallet: ActiveWallet,
  scope: string,
  report: StructureReport,
): ReportPdf {
  const { today } = wallet;
  const sections: PdfSection[] = [
    ...(report.currencies.length > 1
      ? [
          summary(
            'За валютами',
            report.currencies.map(({ currency, total, bonds }) => ({
              label: CURRENCY_NAMES[currency],
              hint: `ОВДП: ${bonds.length}`,
              value: formatMoney(total, currency),
            })),
            'Суми в різних валютах не складаються без курсу, тож частки нижче рахуються в межах кожної валюти.',
          ),
        ]
      : []),
    ...report.currencies.flatMap((currency): PdfSection[] => {
      const money = (value: number) => formatMoney(value, currency.currency);
      const largest = currency.bonds[0];
      return [
        summary(
          titled('Підсумок', currency.currency),
          [
            { label: 'Вкладено', value: money(currency.total) },
            currency.planned > 0 && {
              label: 'З них заплановано',
              hint: 'Купівлі, яких ще не зроблено',
              value: money(currency.planned),
            },
            { label: 'ОВДП', value: String(currency.bonds.length) },
            {
              label: 'Середній строк до погашення',
              hint: `приблизно до ${formatDate(currency.averageMaturity)}`,
              value:
                currency.averageMaturity > today
                  ? formatTimeLeft(today, currency.averageMaturity)
                  : '—',
            },
            { label: 'Середня ставка купону', value: `${currency.averageRate}%` },
            currency.bonds.length > 1 && {
              label: 'Найбільша частка',
              hint: largest.isin,
              value: shareCell(largest.share),
            },
          ],
          'Вкладено — ціна купівель ОВДП, що ще в обігу. Середні строк і ставка зважені на суму купівель.',
        ),
        {
          title: titled('За строком до погашення', currency.currency),
          columns: [],
          rows: [],
          layout: 'chart',
          chart: {
            kind: 'bars',
            bars: currency.terms.map((term) => ({
              label: TERM_BUCKET_LABELS[term.term],
              value: term.amount,
              detail: term.count
                ? `${money(term.amount)} · ${shareCell(term.share)} · ОВДП: ${term.count}`
                : '—',
              color: 'purchase',
            })),
          },
        },
        {
          title: titled('За ОВДП', currency.currency),
          columns: ['ISIN', 'Сума', 'Ставка купону', 'Погашення', 'Частка грошей у валюті'],
          rows: currency.bonds.map((bond) => [
            bond.isin,
            money(bond.amount),
            `${bond.bond.rate}%`,
            `до ${formatDate(bond.bond.maturityDate)} · ${formatTimeLeft(today, bond.bond.maturityDate)}`,
            shareCell(bond.share),
          ]),
          layout: 'items',
        },
      ];
    }),
  ];
  // As the screen, once under the report's top: these bonds have no maturity to place them by.
  if (report.unknownCount > 0 && sections.length > 0) {
    sections[0] = {
      ...sections[0],
      note: notes(
        sections[0].note,
        `ОВДП, яких немає в даних НБУ (${report.unknownCount}), не враховано: їхні строки невідомі.`,
      ),
    };
  }
  return { title: 'Структура портфеля', scope, fileStem: 'structure', wallet, sections };
}

export function yieldPdf(wallet: ActiveWallet, scope: string, reports: CurrencyYield[]): ReportPdf {
  return {
    title: 'Річна дохідність',
    scope,
    fileStem: 'yield',
    wallet,
    sections: reports.flatMap((report): PdfSection[] => {
      const { currency, averageYield, averageRate, keyRate, bonds, withoutYield } = report;
      const gap = averageYield !== null && keyRate !== null ? averageYield - keyRate : null;
      const withYield = bonds.filter((bond) => bond.annualYield !== null);
      return [
        summary(
          titled('Річна дохідність', currency),
          [
            {
              label: 'Середня річна дохідність',
              value: averageYield === null ? 'Немає повних даних НБУ' : `${averageYield}%`,
            },
            keyRate !== null && { label: 'Облікова ставка НБУ сьогодні', value: `${keyRate}%` },
            gap !== null && {
              label: 'Різниця зі ставкою сьогодні',
              value: pointsCell(gap),
              signed: Math.round(gap * 10) / 10,
            },
            averageRate !== null && { label: 'Середня ставка купону', value: `${averageRate}%` },
            { label: 'ОВДП', value: String(bonds.length) },
          ],
          notes(
            'Річна дохідність — за ціною купівлі й усіма виплатами до погашення, як у формі купівлі; середні зважені на суму купівель.',
            currency === KEY_RATE_CURRENCY
              ? 'Порівняння зі ставкою сьогодні використовує дохідність за ціною купівлі, а не за поточною ринковою ціною. У рядках ставка на дату купівлі; для запланованої — сьогоднішня.'
              : 'Облікова ставка НБУ — гривнева, тож валютні ОВДП з нею не порівнюються.',
            currency === KEY_RATE_CURRENCY &&
              (keyRate === null || bonds.some((bond) => bond.keyRateAtPurchase === null)) &&
              'Деякі облікові ставки ще недоступні або не завантажилися; відповідні порівняння не показано.',
            withoutYield > 0 &&
              `ОВДП без повних даних НБУ (${withoutYield}) у середню річну дохідність не враховано.`,
          ),
        ),
        ...(averageYield !== null && keyRate !== null
          ? [
              {
                title: titled('Поруч з обліковою ставкою', currency),
                columns: [],
                rows: [],
                layout: 'chart' as const,
                chart: {
                  kind: 'bars' as const,
                  bars: [
                    { label: 'Портфель', value: averageYield, color: 'coupon' as const },
                    { label: 'Облікова ставка НБУ', value: keyRate, color: 'redemption' as const },
                  ].map((bar) => ({
                    ...bar,
                    value: Math.max(bar.value, 0),
                    detail: `${bar.value}%`,
                  })),
                },
              },
            ]
          : []),
        ...(withYield.length > 0
          ? [
              {
                title: titled('Дохідність за ОВДП', currency),
                columns: [],
                rows: [],
                layout: 'chart' as const,
                chart: {
                  kind: 'bars' as const,
                  bars: yieldChartBonds(withYield).map((bond) => ({
                    label: bond.isin,
                    value: bond.annualYield ?? 0,
                    detail: percent(bond.annualYield),
                    color: ((bond.annualYield ?? 0) < 0 ? 'purchase' : 'coupon') as ChartColor,
                  })),
                },
              },
            ]
          : []),
        {
          title: titled('По ОВДП', currency),
          columns: [
            'ISIN',
            'Річна дохідність',
            'Купон',
            'Вкладено',
            'Стан',
            'Облікова ставка на дату купівлі',
          ],
          rows: bonds.map((bond) => [
            bond.isin,
            percent(bond.annualYield),
            percent(bond.bond?.rate ?? null),
            formatMoney(bond.invested, currency),
            bondStateLabel(bond.state, bond.bond?.maturityDate),
            bond.annualYield !== null && bond.keyRateAtPurchase !== null
              ? `${bond.keyRateAtPurchase}% · ${pointsCell(bond.annualYield - bond.keyRateAtPurchase)}`
              : '—',
          ]),
          layout: 'items',
        },
      ];
    }),
  };
}

export function bondPdf(wallet: ActiveWallet, report: SingleBondReport): ReportPdf {
  const { item, keyRateAtPurchase, money: byYear } = report;
  const { position, bond, results, currency, annualYield } = item;
  const money = (value: number) => formatMoney(value, currency);
  const coupon = bond?.payments.find((payment) => payment.type === 'coupon');
  return {
    title: 'Звіт по ОВДП',
    scope: position.isin,
    fileStem: `bond-${position.isin}`,
    wallet,
    sections: [
      summary(
        'Параметри випуску',
        bond
          ? [
              { label: 'Валюта', value: CURRENCY_NAMES[currency] },
              { label: 'Стан', value: bondStateLabel(item.state, bond.maturityDate) },
              { label: 'Ставка купону', value: `${bond.rate}%` },
              {
                label: 'Перший купон на 1 шт',
                value: coupon
                  ? `${money(coupon.amount)} · ${formatDate(coupon.date)}`
                  : 'немає даних',
              },
              { label: 'Номінал', value: money(bond.nominal) },
              { label: 'Тип', value: bond.description },
              { label: 'Дата розміщення', value: formatDate(bond.issueDate) },
              { label: 'Дата погашення', value: formatDate(bond.maturityDate) },
            ]
          : [{ label: 'Валюта', value: CURRENCY_NAMES[currency] }],
        bond
          ? undefined
          : 'Цієї ОВДП немає в даних НБУ — параметри випуску й графік виплат недоступні.',
      ),
      summary(
        'Підсумок',
        [
          { label: 'Кількість', value: `${position.quantity} шт` },
          { label: 'Вкладено', value: money(position.investedAmount) },
          position.purchases.length > 1 && {
            label: 'Середня ціна 1 шт',
            value: money(pricePerBond(position.investedAmount, position.quantity)),
          },
          ...(results
            ? [
                { label: 'Купони', value: money(results.coupons) },
                {
                  label: 'Погашення',
                  value: results.complete ? money(results.redemption) : 'Немає повних даних НБУ',
                },
                results.complete && {
                  label: 'Усього виплат',
                  value: money(results.totalPayments),
                },
                { label: 'Отримано', value: money(results.received) },
                { label: 'Очікується', value: money(results.expected) },
                results.netIncome !== null && {
                  label: 'Чистий дохід',
                  value: money(results.netIncome),
                  signed: results.netIncome,
                  total: true,
                },
                results.netIncome !== null && {
                  label: 'Дохідність за весь строк',
                  value: `${results.returnPercent ?? 0}%`,
                },
              ]
            : []),
          annualYield !== null && { label: 'Річна дохідність', value: `${annualYield}%` },
          annualYield !== null &&
            keyRateAtPurchase !== null && {
              label: 'Облікова ставка на дату купівлі',
              value: `${keyRateAtPurchase}%`,
            },
          annualYield !== null &&
            keyRateAtPurchase !== null && {
              label: 'Різниця з обліковою ставкою',
              value: pointsCell(annualYield - keyRateAtPurchase),
              signed: Math.round((annualYield - keyRateAtPurchase) * 10) / 10,
            },
        ],
        'Чистий дохід — виплати мінус вкладення; дохідність за весь строк — він у відсотках від вкладень. Річна дохідність — за ціною купівлі й усіма виплатами до погашення, як у формі купівлі; облікова ставка — НБУ на дату купівлі (для запланованої — сьогоднішня), для кількох купівель зважена на суму.',
      ),
      ...(byYear && byYear.years.length > 0
        ? [
            flowChart(
              'Гроші по роках',
              byYear.years.map((year) => ({ ...year, month: yearCell(year) })),
            ),
          ]
        : []),
      {
        title: 'Купівлі',
        columns: ['Дата', 'Кількість', 'Ціна 1 шт', 'Сума'],
        rows: position.purchases.map((purchase) => [
          formatDate(purchase.purchaseDate) +
            (isPlannedPurchase(purchase, wallet.today) ? ' · заплановано' : ''),
          `${purchase.quantity} шт`,
          money(pricePerBond(purchase.amount, purchase.quantity)),
          money(purchase.amount),
        ]),
        layout: 'items',
      },
      {
        title: 'Виплати',
        columns: ['Дата', 'Виплата', 'Кількість', 'Сума'],
        rows: item.payments.map((payment) => [
          formatDate(payment.date),
          (payment.type === 'coupon' ? 'Купон' : 'Погашення') +
            (payment.isPaid ? ' · отримано' : '') +
            plannedMark(payment),
          `${payment.quantity} шт`,
          money(payment.total),
        ]),
        layout: 'items',
      },
    ],
  };
}

const rateFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function fxPdf(
  wallet: ActiveWallet,
  report: FxReport,
  currency: ExchangeCurrency,
): ReportPdf {
  const fxMoney = (value: number) => formatMoney(value, currency);
  const { year, snapshot } = report;
  const allTime = year === null;
  const chartNote = allTime
    ? 'Кожна точка — кінець місяця, для поточного — сьогодні. Різниця = отримані виплати + залишок ОВДП за собівартістю − усі купівлі у валютному еквіваленті. Виплати, вкладені знову, і нові купівлі враховано окремо. Для непогашених ОВДП це оцінка, а не остаточний результат у валюті.'
    : '«Вкладено» — накопичені купівлі за курсом їхніх дат. Друга лінія — залишок гривневих вкладень за курсом на кінець місяця та отримані виплати за курсом їхніх дат. Ринкову ціну ОВДП не враховано. Виплати, вкладені знову, залишаються у сумі виплат, тому друга лінія не є сумою грошей, доступних зараз.';
  return {
    title: 'Валютний еквівалент',
    scope: `${year ?? 'Увесь час'} · ${allTime ? `з ${formatDate(report.fromDate)} ` : ''}до ${formatDate(report.throughDate)} · ${currency}`,
    fileStem: 'fx',
    wallet,
    sections:
      report.bonds.length === 0
        ? []
        : [
            summary(
              `Стан вкладень на ${formatDate(report.throughDate)}`,
              [
                { label: 'Вкладено від першої купівлі', value: fxMoney(snapshot.invested) },
                { label: 'Повернулося виплатами', value: fxMoney(snapshot.received) },
                { label: 'Залишок ОВДП (оцінка)', value: fxMoney(snapshot.remainingCost) },
                {
                  label: 'Виплати + залишок (оцінка)',
                  value: fxMoney(snapshot.payoutsAndRemaining),
                },
                {
                  label: report.openCount > 0 ? 'Різниця (оцінка)' : 'Різниця з вкладеним',
                  value: fxMoney(snapshot.estimatedDifference),
                  signed: snapshot.estimatedDifference,
                  total: true,
                },
              ],
              `${snapshot.received >= snapshot.invested ? 'Вкладене вже повернулося виплатами.' : 'Вкладене ще не повернулося виплатами.'} Залишок ОВДП оцінено за собівартістю, а не за ціною продажу. Виплати рахуються як отримані, навіть якщо їх згодом вкладено знову; нові купівлі входять до «Вкладено». Сума виплат і залишку не є грошима на рахунку.${report.bonds.some((bond) => !bond.hasBondData) ? ' Для ОВДП без даних НБУ залишок умовно дорівнює сумі купівлі; їхні виплати невідомі.' : ''}`,
            ),
            summary(
              allTime ? 'Рух грошей за весь час' : 'Рух грошей за рік',
              [
                { label: 'Купівлі', value: fxMoney(report.purchases) },
                { label: 'Купони', value: fxMoney(report.coupons) },
                { label: 'Погашення', value: fxMoney(report.redemptions) },
                {
                  label: allTime ? 'Сальдо подій' : 'Сальдо подій року',
                  value: fxMoney(report.balance),
                  signed: report.balance,
                  total: true,
                },
              ],
              'Сальдо — отримані виплати мінус купівлі за обраний період. Воно не є заробітком на ОВДП, що ще не погашені.',
            ),
            ...(report.points.length > 0
              ? [
                  {
                    title: allTime
                      ? `Різниця з вкладеним · ${currency}`
                      : `Вкладення у валютному еквіваленті · ${currency}`,
                    columns: [],
                    rows: [],
                    layout: 'chart' as const,
                    chart: {
                      kind: 'line' as const,
                      labels: report.points.map((point) => point.period),
                      series: allTime
                        ? [
                            {
                              label: 'Різниця',
                              color: 'redemption' as const,
                              values: report.points.map(
                                (point) => point.currentFx - point.investedFx,
                              ),
                            },
                          ]
                        : [
                            {
                              label: 'Вкладено',
                              color: 'purchase' as const,
                              values: report.points.map((point) => point.investedFx),
                            },
                            {
                              label: 'Залишок + виплати',
                              color: 'redemption' as const,
                              values: report.points.map((point) => point.currentFx),
                            },
                          ],
                    },
                    note: chartNote,
                  },
                ]
              : []),
            ...(allTime && report.years.length > 1
              ? [
                  {
                    title: `Рух грошей по роках · ${currency}`,
                    columns: ['Рік', 'Купівлі', 'Виплати', 'Сальдо'],
                    rows: report.years.map((row) => [
                      String(row.year),
                      amountCell(row.purchases),
                      amountCell(row.coupons + row.redemptions),
                      amountCell(row.balance),
                    ]),
                    signedCells: report.years.map((row) => [null, null, null, row.balance]),
                    total: [
                      'Разом',
                      amountCell(report.purchases),
                      amountCell(report.coupons + report.redemptions),
                      amountCell(report.balance),
                    ],
                    totalSigned: [null, null, null, report.balance],
                    note: 'Виплати = купони + погашення. Сальдо — виплати мінус купівлі; воно не є заробітком на непогашених ОВДП.',
                  },
                ]
              : []),
            summary(
              'Завершені ОВДП',
              [
                { label: 'Кількість', value: String(report.completedCount) },
                {
                  label: 'Результат у валюті',
                  value: report.completedCount > 0 ? fxMoney(report.completedResult) : '—',
                  signed: report.completedCount > 0 ? report.completedResult : undefined,
                  total: true,
                },
              ],
              report.openCount > 0
                ? `${report.openCount} ОВДП ще не погашено або їхні дані неповні. Їх не включено в результат.`
                : undefined,
            ),
            ...report.bonds.map((bond): PdfSection => ({
              title: `Події ${allTime ? 'за весь час' : 'року'} · ${bond.isin}`,
              columns: ['Дата', 'Подія', 'Сума, ₴', 'Курс НБУ', `Еквівалент, ${currency}`],
              rows: bond.events.map((event) => [
                formatDate(event.date),
                event.type === 'purchase'
                  ? 'Купівля'
                  : event.type === 'coupon'
                    ? 'Купон'
                    : 'Погашення',
                amountCell(event.amount),
                `${rateFormat.format(event.rate)} ₴/${currency}`,
                amountCell(event.equivalent),
              ]),
              layout: 'items',
              note: `Вкладено від першої купівлі: ${fxMoney(bond.invested)} · Отримано виплатами: ${fxMoney(bond.received)}${!bond.hasBondData ? ' · ОВДП немає в даних НБУ: її залишок умовно дорівнює сумі купівлі, виплати невідомі.' : bond.result === null ? ' · ОВДП ще не погашена або дані про погашення неповні. Остаточний валютний результат не визначено.' : ` · Результат: ${fxMoney(bond.result)}`}`,
            })),
          ],
  };
}
