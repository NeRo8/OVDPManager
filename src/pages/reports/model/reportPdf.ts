import type { ActiveWallet, Currency, ExchangeCurrency } from '@/entities/portfolio';
import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatAmount, formatDate, formatMoney, MONTHS_SHORT, plural } from '@/shared/lib';

import type { BondReport as SingleBondReport } from './bondReport';
import type { FxReport } from './fxReport';
import { periodChartPeriods } from './periodChart';
import type { CurrencyReport, Flows } from './periodReport';
import type { CurrencyPortfolio } from './portfolioReport';
import { purchaseValues } from './purchaseValues';
import type { CurrencyRedemptions } from './redemptionsReport';
import type { ReportTerms } from './reportTerms';
import type { StructureReport } from './structureReport';
import type { CurrencyYears } from './yearOverYearReport';
import type { CurrencyYield } from './yieldReport';

export type ChartColor = 'coupon' | 'redemption' | 'purchase' | 'plannedPurchase';

export type PdfChart =
  | {
      kind: 'columns';
      labels: string[];
      series: { label: string; color: ChartColor; values: number[]; down?: boolean }[];
    }
  | {
      kind: 'bars';
      bars: { label: string; value: number; detail: string; color: ChartColor }[];
    }
  | {
      kind: 'line';
      labels: string[];
      series: { label: string; color: ChartColor; values: number[] }[];
    };

export type PdfSection = {
  title: string;
  columns: string[];
  rows: string[][];
  layout?: 'summary' | 'table' | 'items' | 'chart';
  chart?: PdfChart;
  total?: string[];
  note?: string;
};

export type ReportPdf = {
  title: string;
  scope: string;
  fileStem: string;
  wallet: ActiveWallet;
  sections: PdfSection[];
};

const money = (amount: number, currency: Currency) => formatMoney(amount, currency);
const amount = (value: number | null) => (value === null ? '—' : formatAmount(value));
const percent = (value: number | null) => (value === null ? '—' : `${value}%`);
const pair = (title: string, rows: string[][], note?: string): PdfSection => ({
  title,
  columns: ['Показник', 'Значення'],
  rows,
  layout: 'summary',
  note,
});
const currencyTitle = (currency: Currency) => CURRENCY_NAMES[currency];

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

/** All PDF blocks use the report's own calculated values and visual order. */
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
    sections: reports.flatMap((report): PdfSection[] => [
      flowChart(
        `Грошові потоки по ${report.months.length > 12 ? 'роках' : 'місяцях'} · ${currencyTitle(report.currency)}`,
        periodChartPeriods(report.months).map((row) => ({
          ...row,
          month:
            row.month.length === 4 ? row.month : MONTHS_SHORT[Number(row.month.slice(5, 7)) - 1],
        })),
      ),
      pair(
        `Підсумок · ${currencyTitle(report.currency)}`,
        [
          ['Вкладено', money(report.invested, report.currency)],
          ['Купони', money(report.coupons, report.currency)],
          ['Погашення', money(report.redemptions, report.currency)],
          ['Купони в середньому за місяць', money(report.averageMonthlyCoupons, report.currency)],
        ],
        `Купони ${terms.span}, поділені на ${report.months.length} ${plural(report.months.length, 'місяць', 'місяці', 'місяців')}. Погашення повертає номінал, а не приносить нові гроші щомісяця, тож у середнє не входить.`,
      ),
      ...(report.annualYield === null
        ? []
        : [
            pair(
              `Дохідність · ${currencyTitle(report.currency)}`,
              [
                ['Річна дохідність', percent(report.annualYield), 'Середня за ОВДП'],
                ...(report.highlights.highestYield
                  ? [
                      [
                        'Найвища річна дохідність',
                        percent(report.highlights.highestYield.annualYield),
                        report.highlights.highestYield.isin,
                      ],
                    ]
                  : []),
                ...(report.highlights.lowestYield
                  ? [
                      [
                        'Найнижча річна дохідність',
                        percent(report.highlights.lowestYield.annualYield),
                        report.highlights.lowestYield.isin,
                      ],
                    ]
                  : []),
              ],
              `Річна дохідність — за ціною купівлі й усіма виплатами до погашення, як у формі купівлі. Середня — за ОВДП ${terms.span}, зважена на суму купівель; ОВДП без опублікованого погашення в неї не входять.`,
            ),
          ]),
      {
        title: `По місяцях · ${currencyTitle(report.currency)}`,
        columns: ['Місяць', 'Купівлі', 'Купони', 'Погашення'],
        rows: report.months.map((row) => [
          row.month,
          amount(row.invested),
          amount(row.coupons),
          amount(row.redemptions),
        ]),
        layout: 'table',
        total: [
          'Разом',
          amount(report.invested),
          amount(report.coupons),
          amount(report.redemptions),
        ],
      },
      {
        title: `По ОВДП · ${currencyTitle(report.currency)}`,
        columns: [
          'ISIN',
          'Купівлі',
          'Купони',
          'Погашення',
          terms.income,
          'Річна дохідність',
          'Частка доходу',
        ],
        rows: report.bonds.map((bond) => [
          bond.isin,
          amount(bond.invested),
          amount(bond.coupons),
          amount(bond.redemptions),
          amount(bond.income),
          percent(bond.annualYield),
          percent(bond.incomeShare),
        ]),
        layout: 'items',
      },
    ]),
  };
}

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
    sections: reports.flatMap((report): PdfSection[] => [
      pair(`За всі роки · ${currencyTitle(report.currency)}`, [
        ['Купівлі', money(report.total.invested, report.currency)],
        ['Купони', money(report.total.coupons, report.currency)],
        ['Погашення', money(report.total.redemptions, report.currency)],
        ['Виплати', money(report.total.totalPayments, report.currency)],
        ['Сальдо', money(report.total.balance, report.currency)],
        ['Дохід', money(report.total.income, report.currency)],
      ]),
      ...(report.highlights.highestIncome ||
      report.highlights.highestPayments ||
      report.highlights.highestInvested
        ? [
            pair(`Роки, що вирізняються · ${currencyTitle(report.currency)}`, [
              ...(report.highlights.highestIncome
                ? [
                    [
                      'Найбільший дохід',
                      money(report.highlights.highestIncome.income, report.currency),
                      `${report.highlights.highestIncome.year} рік`,
                    ],
                  ]
                : []),
              ...(report.highlights.highestPayments
                ? [
                    [
                      'Найбільше виплат',
                      money(report.highlights.highestPayments.totalPayments, report.currency),
                      `${report.highlights.highestPayments.year} рік`,
                    ],
                  ]
                : []),
              ...(report.highlights.highestInvested
                ? [
                    [
                      'Найбільше вкладено',
                      money(report.highlights.highestInvested.invested, report.currency),
                      `${report.highlights.highestInvested.year} рік`,
                    ],
                  ]
                : []),
            ]),
          ]
        : []),
      flowChart(
        `Гроші по роках · ${currencyTitle(report.currency)}`,
        report.years.map((year) => ({ ...year, month: String(year.year) })),
      ),
      {
        title: `Дохід по роках · ${currencyTitle(report.currency)}`,
        columns: [],
        rows: [],
        layout: 'chart',
        chart: {
          kind: 'bars',
          bars: report.years.map((year) => ({
            label: String(year.year),
            value: year.income,
            detail: money(year.income, report.currency),
            color: 'coupon',
          })),
        },
      },
      {
        title: `Рух грошей по роках · ${currencyTitle(report.currency)}`,
        columns: ['Рік', 'Купівлі', 'Купони', 'Погашення'],
        rows: report.years.map((row) => [
          String(row.year),
          amount(row.invested),
          amount(row.coupons),
          amount(row.redemptions),
        ]),
        total: [
          'Разом',
          amount(report.total.invested),
          amount(report.total.coupons),
          amount(report.total.redemptions),
        ],
      },
      {
        title: `Підсумки по роках · ${currencyTitle(report.currency)}`,
        columns: ['Рік', 'Сальдо', 'Дохід', 'Зміна доходу'],
        rows: report.years.map((row) => [
          String(row.year),
          amount(row.balance),
          amount(row.income),
          percent(row.incomeChange),
        ]),
        total: ['Разом', amount(report.total.balance), amount(report.total.income), ''],
      },
    ]),
  };
}

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
    sections: reports.flatMap((report): PdfSection[] => [
      pair(`Підсумок · ${currencyTitle(report.currency)}`, [
        ['Усього', money(report.total, report.currency)],
        ['Отримано', money(report.received, report.currency)],
        ['Очікується', money(report.expected, report.currency)],
        ['Найближче', report.next ? formatDate(report.next.date) : '—'],
        ['Останнє', formatDate(report.last.date)],
      ]),
      {
        title: `Погашення по роках · ${currencyTitle(report.currency)}`,
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
        title: `По роках і кварталах · ${currencyTitle(report.currency)}`,
        columns: ['Період', 'Сума', 'Частка'],
        rows: report.years.flatMap((year) => [
          [String(year.year), amount(year.total), percent(year.share)],
          ...year.quarters.map((quarter) => [
            `${year.year} · ${quarter.quarter} кв.`,
            amount(quarter.total),
            percent(quarter.share),
          ]),
        ]),
        total: ['Разом', amount(report.total), '100%'],
      },
      {
        title: `Погашення · ${currencyTitle(report.currency)}`,
        columns: ['Дата', 'ISIN', 'Кількість', 'Сума', 'Стан'],
        rows: report.payments.map((payment) => [
          formatDate(payment.date),
          payment.isin,
          String(payment.quantity),
          amount(payment.total),
          payment.isPaid ? 'Отримано' : 'Очікується',
        ]),
        layout: 'items',
      },
    ]),
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
    sections: reports.flatMap((report): PdfSection[] => [
      pair(`Підсумок · ${currencyTitle(report.currency)}`, [
        ['ОВДП', String(report.bonds.length)],
        ['Вкладено', report.total ? money(report.total.invested, report.currency) : '—'],
        ['Купони', report.total ? money(report.total.coupons, report.currency) : '—'],
        ['Погашення', report.total ? money(report.total.redemption, report.currency) : '—'],
        ['Усього виплат', report.total ? money(report.total.totalPayments, report.currency) : '—'],
        ['Отримано', report.total ? money(report.total.received, report.currency) : '—'],
        ['Очікується', report.total ? money(report.total.expected, report.currency) : '—'],
        [
          'Чистий дохід',
          report.total?.netIncome === undefined ? '—' : amount(report.total.netIncome),
        ],
        ['Дохідність за весь строк', percent(report.total?.returnPercent ?? null)],
      ]),
      {
        title: `Вкладення за ОВДП · ${currencyTitle(report.currency)}`,
        columns: [],
        rows: [],
        layout: 'chart',
        chart: {
          kind: 'bars',
          bars: [...report.bonds]
            .sort((a, b) => b.invested - a.invested)
            .slice(0, 5)
            .map((bond) => ({
              label: bond.isin,
              value: bond.invested,
              detail: money(bond.invested, report.currency),
              color: 'purchase',
            })),
        },
      },
      {
        title: `По ОВДП · ${currencyTitle(report.currency)}`,
        columns: [
          'ISIN',
          'Погашення',
          'Стан',
          'Кількість',
          'Вкладено',
          'Купони',
          'Погашення, сума',
          'Чистий дохід',
          'Річна дохідність',
          'Частка вкладень',
        ],
        rows: report.bonds.map((bond) => [
          bond.isin,
          bond.bond ? formatDate(bond.bond.maturityDate) : '—',
          bond.state === 'unknown'
            ? 'Немає даних НБУ'
            : bond.state === 'planned'
              ? 'Заплановано'
              : bond.state === 'redeemed'
                ? 'Погашено'
                : 'В обігу',
          String(bond.quantity),
          amount(bond.invested),
          bond.results ? amount(bond.results.coupons) : '—',
          bond.results?.complete ? amount(bond.results.redemption) : '—',
          amount(bond.results?.netIncome ?? null),
          percent(bond.annualYield),
          percent(bond.investedShare),
        ]),
        layout: 'items',
        note:
          report.unknownCount > 0
            ? `ОВДП без даних НБУ: ${report.unknownCount}. Не враховано у підсумку.`
            : undefined,
      },
    ]),
  };
}

export function structurePdf(
  wallet: ActiveWallet,
  scope: string,
  report: StructureReport,
): ReportPdf {
  return {
    title: 'Структура портфеля',
    scope,
    fileStem: 'structure',
    wallet,
    sections: report.currencies.flatMap((currency): PdfSection[] => [
      pair(`Підсумок · ${currencyTitle(currency.currency)}`, [
        ['Вкладено', money(currency.total, currency.currency)],
        ['ОВДП', String(currency.bonds.length)],
        ['Середній строк до погашення', formatDate(currency.averageMaturity)],
        ['Середня ставка купону', percent(currency.averageRate)],
      ]),
      {
        title: `За строками · ${currencyTitle(currency.currency)}`,
        columns: ['Строк до погашення', 'Сума', 'Частка', 'ОВДП'],
        rows: currency.terms.map((term) => [
          {
            halfYear: 'До 6 місяців',
            year: '6–12 місяців',
            twoYears: '1–2 роки',
            threeYears: '2–3 роки',
            longer: 'Понад 3 роки',
          }[term.term],
          amount(term.amount),
          percent(term.share),
          String(term.count),
        ]),
        layout: 'chart',
        chart: {
          kind: 'bars',
          bars: currency.terms.map((term) => ({
            label: {
              halfYear: 'До 6 місяців',
              year: '6–12 місяців',
              twoYears: '1–2 роки',
              threeYears: '2–3 роки',
              longer: 'Понад 3 роки',
            }[term.term],
            value: term.amount,
            detail: `${money(term.amount, currency.currency)} · ${percent(term.share)} · ОВДП: ${term.count}`,
            color: 'purchase',
          })),
        },
      },
      {
        title: `За ОВДП · ${currencyTitle(currency.currency)}`,
        columns: ['ISIN', 'Погашення', 'Ставка купону', 'Сума', 'Частка'],
        rows: currency.bonds.map((bond) => [
          bond.isin,
          formatDate(bond.bond.maturityDate),
          percent(bond.bond.rate),
          amount(bond.amount),
          percent(bond.share),
        ]),
        layout: 'items',
        note:
          report.unknownCount > 0
            ? `ОВДП без даних НБУ: ${report.unknownCount}. Не враховано у структурі.`
            : undefined,
      },
    ]),
  };
}

export function yieldPdf(wallet: ActiveWallet, scope: string, reports: CurrencyYield[]): ReportPdf {
  return {
    title: 'Річна дохідність',
    scope,
    fileStem: 'yield',
    wallet,
    sections: reports.flatMap((report): PdfSection[] => [
      pair(`Підсумок · ${currencyTitle(report.currency)}`, [
        ['Середня річна дохідність', percent(report.averageYield)],
        ['Середня ставка купону', percent(report.averageRate)],
        ...(report.currency === 'UAH' ? [['Облікова ставка НБУ', percent(report.keyRate)]] : []),
        ...(report.averageYield !== null && report.keyRate !== null
          ? [
              [
                'Різниця з обліковою ставкою',
                `${Math.round((report.averageYield - report.keyRate) * 10) / 10} п.п.`,
              ],
            ]
          : []),
        ['ОВДП без повних даних', String(report.withoutYield)],
      ]),
      ...(report.bonds.some((bond) => bond.annualYield !== null)
        ? [
            {
              title: `Дохідність за ОВДП · ${currencyTitle(report.currency)}`,
              columns: [],
              rows: [],
              layout: 'chart' as const,
              chart: {
                kind: 'bars' as const,
                bars: report.bonds
                  .filter((bond) => bond.annualYield !== null)
                  .slice(0, 5)
                  .map((bond) => ({
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
        title: `По ОВДП · ${currencyTitle(report.currency)}`,
        columns: [
          'ISIN',
          'Вкладено',
          'Погашення',
          'Купон',
          'Річна дохідність',
          'Облікова ставка на дату купівлі',
        ],
        rows: report.bonds.map((bond) => [
          bond.isin,
          amount(bond.invested),
          bond.bond ? formatDate(bond.bond.maturityDate) : '—',
          percent(bond.bond?.rate ?? null),
          percent(bond.annualYield),
          percent(bond.keyRateAtPurchase),
        ]),
        layout: 'items',
      },
    ]),
  };
}

export function bondPdf(wallet: ActiveWallet, report: SingleBondReport): ReportPdf {
  const { item, money: byYear } = report;
  const { position, bond, results, currency } = item;
  const coupon = bond?.payments.find((payment) => payment.type === 'coupon');
  return {
    title: 'Звіт по ОВДП',
    scope: position.isin,
    fileStem: `bond-${position.isin}`,
    wallet,
    sections: [
      pair('Параметри випуску', [
        ['Валюта', currencyTitle(currency)],
        ['Номінал', bond ? money(bond.nominal, currency) : '—'],
        ['Ставка купону', bond ? percent(bond.rate) : '—'],
        ['Купон на 1 шт', bond ? (coupon ? money(coupon.amount, currency) : 'без купону') : '—'],
        ['Тип', bond?.description ?? '—'],
        ['Дата випуску', bond ? formatDate(bond.issueDate) : '—'],
        ['Дата погашення', bond ? formatDate(bond.maturityDate) : '—'],
      ]),
      pair('Підсумок', [
        ['Кількість', String(position.quantity)],
        ['Вкладено', money(position.investedAmount, currency)],
        ['Купони', results ? money(results.coupons, currency) : '—'],
        ['Погашення', results?.complete ? money(results.redemption, currency) : '—'],
        ['Отримано', results ? money(results.received, currency) : '—'],
        ['Очікується', results ? money(results.expected, currency) : '—'],
        ['Чистий дохід', amount(results?.netIncome ?? null)],
        ['Річна дохідність', percent(item.annualYield)],
        ['Облікова ставка на дату купівлі', percent(report.keyRateAtPurchase)],
      ]),
      ...(byYear
        ? [
            flowChart(
              'Гроші по роках',
              byYear.years.map((year) => ({ ...year, month: String(year.year) })),
            ),
          ]
        : []),
      ...(byYear
        ? [
            {
              title: 'По роках',
              columns: ['Рік', 'Купівлі', 'Купони', 'Погашення', 'Дохід'],
              rows: byYear.years.map((year) => [
                String(year.year),
                amount(year.invested),
                amount(year.coupons),
                amount(year.redemptions),
                amount(year.income),
              ]),
              total: [
                'Разом',
                amount(byYear.total.invested),
                amount(byYear.total.coupons),
                amount(byYear.total.redemptions),
                amount(byYear.total.income),
              ],
            },
          ]
        : []),
      {
        title: 'Купівлі',
        columns: ['Дата', 'Кількість', 'Сума'],
        rows: position.purchases.map((purchase) => [
          formatDate(purchase.purchaseDate),
          String(purchase.quantity),
          money(purchase.amount, currency),
        ]),
        layout: 'items',
      },
      {
        title: 'Виплати',
        columns: ['Дата', 'Тип', 'Кількість', 'Сума', 'Стан'],
        rows: item.payments.map((payment) => [
          formatDate(payment.date),
          payment.type === 'coupon' ? 'Купон' : 'Погашення',
          String(payment.quantity),
          money(payment.total, currency),
          payment.isPaid ? 'Отримано' : 'Очікується',
        ]),
        layout: 'items',
      },
    ],
  };
}

export function fxPdf(
  wallet: ActiveWallet,
  report: FxReport,
  currency: ExchangeCurrency,
): ReportPdf {
  const fxMoney = (value: number) => formatMoney(value, currency);
  return {
    title: 'Валютний еквівалент',
    scope: `${report.year ?? 'Увесь час'} · ${formatDate(report.fromDate)} – ${formatDate(report.throughDate)} · ${currency}`,
    fileStem: 'fx',
    wallet,
    sections: [
      pair('Стан вкладень', [
        ['Вкладено', fxMoney(report.snapshot.invested)],
        ['Отримано виплатами', fxMoney(report.snapshot.received)],
        ['Залишок ОВДП (собівартість)', fxMoney(report.snapshot.remainingCost)],
        ['Виплати + залишок', fxMoney(report.snapshot.payoutsAndRemaining)],
        ['Різниця (оцінка)', fxMoney(report.snapshot.estimatedDifference)],
      ]),
      pair('Рух грошей за період', [
        ['Купівлі за період', fxMoney(report.purchases)],
        ['Купони за період', fxMoney(report.coupons)],
        ['Погашення за період', fxMoney(report.redemptions)],
        ['Сальдо подій', fxMoney(report.balance)],
      ]),
      pair('Завершені ОВДП', [
        ['Кількість', String(report.completedCount)],
        ['Результат завершених ОВДП', fxMoney(report.completedResult)],
      ]),
      ...(report.points.length > 0
        ? [
            {
              title:
                report.year === null
                  ? `Різниця з вкладеним · ${currency}`
                  : `Вкладення у валютному еквіваленті · ${currency}`,
              columns: [],
              rows: [],
              layout: 'chart' as const,
              chart: {
                kind: 'line' as const,
                labels: report.points.map((point) => point.period),
                series:
                  report.year === null
                    ? [
                        {
                          label: 'Різниця',
                          color: 'redemption' as const,
                          values: report.points.map((point) => point.currentFx - point.investedFx),
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
              note: 'Залишок ОВДП оцінено за собівартістю, а не за ціною продажу. Перерахунок за офіційним курсом НБУ.',
            },
          ]
        : []),
      {
        title: 'По роках',
        columns: ['Рік', 'Купівлі', 'Купони', 'Погашення', 'Сальдо'],
        rows: report.years.map((year) => [
          String(year.year),
          amount(year.purchases),
          amount(year.coupons),
          amount(year.redemptions),
          amount(year.balance),
        ]),
        total: [
          'Разом',
          amount(report.purchases),
          amount(report.coupons),
          amount(report.redemptions),
          amount(report.balance),
        ],
      },
      {
        title: 'По місяцях',
        columns: ['Місяць', 'Купівлі', 'Виплати й залишок'],
        rows: report.points.map((point) => [
          point.period,
          amount(point.investedFx),
          amount(point.currentFx),
        ]),
        note: 'Залишок ОВДП оцінено за собівартістю, а не за ціною продажу. Перерахунок за офіційним курсом НБУ.',
      },
      ...report.bonds.map((bond): PdfSection => ({
        title: bond.isin,
        columns: ['Дата', 'Подія', 'Сума, ₴', 'Курс НБУ', `Еквівалент, ${currency}`],
        rows: bond.events.map((event) => [
          formatDate(event.date),
          event.type === 'purchase' ? 'Купівля' : event.type === 'coupon' ? 'Купон' : 'Погашення',
          amount(event.amount),
          amount(event.rate),
          amount(event.equivalent),
        ]),
        layout: 'items',
        note: `Вкладено: ${fxMoney(bond.invested)} · Отримано: ${fxMoney(bond.received)} · Результат: ${bond.result === null ? 'не визначено' : fxMoney(bond.result)}`,
      })),
    ],
  };
}
