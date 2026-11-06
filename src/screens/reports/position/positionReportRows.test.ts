import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';
import { formatAmount, formatMoney, formatPercent } from '@/utils/format';

import { positionReportSections } from './positionReportRows';

const bond: Bond = {
  isin: 'UA1',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [
    { date: '2026-01-01', type: 'redemption', amount: 500 },
    { date: '2027-01-01', type: 'redemption', amount: 500 },
  ],
};
const purchase: Operation = {
  id: 'buy',
  type: 'purchase',
  isin: bond.isin,
  currency: 'UAH',
  ovdp: bond,
  date: '2025-01-01',
  quantity: 2,
  amount: 1800,
  planned: false,
};

describe('positionReportRows', () => {
  it('shows remaining cost after a partial redemption and a planned sale according to the selected scenario', () => {
    const sale: Operation = {
      ...purchase,
      id: 'sale',
      type: 'sale',
      date: '2026-07-01',
      quantity: 2,
      amount: 1000,
      planned: true,
    };
    const wallet = buildWallet([purchase, sale], new Map(), '2026-02-01');
    expect(positionReportSections(wallet, 'structure', null, null, 'all')).toEqual([]);
    const made = positionReportSections(wallet, 'structure', null, null, 'made');
    expect(made[0].rows.find((row) => row.label === 'Собівартість залишку')?.value).toContain(
      '900,00',
    );
  });
});

describe('portfolio structure', () => {
  it('counts a redemption due today only in the planned scenario', () => {
    const wallet = buildWallet([purchase], new Map(), '2026-01-01');
    const total = (scenario: 'all' | 'made') =>
      positionReportSections(wallet, 'structure', null, null, scenario)[0].rows.find(
        (row) => row.label === 'Собівартість залишку',
      )?.value;
    expect(total('made')).toBe(formatMoney(1800, 'UAH'));
    expect(total('all')).toBe(formatMoney(900, 'UAH'));
  });

  it('allocates remaining costs and shares across maturity ranges and bonds', () => {
    const laterBond: Bond = {
      ...bond,
      isin: 'UA2',
      maturityDate: '2030-01-01',
      payments: [{ date: '2030-01-01', type: 'redemption', amount: 1000 }],
    };
    const laterPurchase: Operation = {
      ...purchase,
      id: 'later',
      isin: laterBond.isin,
      ovdp: laterBond,
      quantity: 1,
      amount: 1000,
    };
    const wallet = buildWallet([purchase, laterPurchase], new Map(), '2026-02-01');
    const sections = positionReportSections(wallet, 'structure', null, null, 'made');
    const value = (title: string, label: string) =>
      sections.find((section) => section.title === title)?.rows.find((row) => row.label === label)
        ?.value;

    expect(value('Підсумок · UAH', 'Собівартість залишку')).toBe(formatMoney(1900, 'UAH'));
    expect(value('За строками погашення · UAH', '6–12 місяців')).toBe(formatMoney(900, 'UAH'));
    expect(value('За строками погашення · UAH', 'Понад 3 роки')).toBe(formatMoney(1000, 'UAH'));
    expect(value('UA1 · UAH', 'Частка у валюті')).toBe(formatPercent(47.37));
    expect(value('UA2 · UAH', 'Частка у валюті')).toBe(formatPercent(52.63));
    expect(value('UA1 · UAH', 'Кількість')).toBe('2');
    expect(value('UA1 · UAH', 'Ставка купону')).toBe(formatPercent(10));
    expect(value('UA1 · UAH', 'Дата погашення')).toBe('01.01.2027');
    expect(sections.find((section) => section.allocationChart)?.allocationChart?.slices).toEqual([
      { label: 'UA2', value: 1000 },
      { label: 'UA1', value: 900 },
    ]);
  });

  it('keeps the full portfolio in detail while combining small slices into other', () => {
    const operations = Array.from({ length: 6 }, (_, index): Operation => {
      const isin = `UA${index + 1}`;
      return { ...purchase, id: isin, isin, amount: 1000, quantity: 1, ovdp: { ...bond, isin } };
    });
    const wallet = buildWallet(operations, new Map(), '2025-02-01');
    const sections = positionReportSections(wallet, 'structure', null, null, 'made');
    const slices = sections.find((section) => section.allocationChart)?.allocationChart?.slices;
    expect(slices).toHaveLength(5);
    expect(slices?.at(-1)).toEqual({ label: 'Інші', value: 2000 });
    expect(sections.filter((section) => /^UA\d · UAH$/.test(section.title))).toHaveLength(6);
  });

  it('shows missing bond data without assigning it a guessed cost or share', () => {
    const unknown: Operation = { ...purchase, id: 'unknown', isin: 'UA2', ovdp: null };
    const wallet = buildWallet([purchase, unknown], new Map(), '2025-02-01');
    const sections = positionReportSections(wallet, 'structure', null, null, 'made');
    const unknownSection = sections.find((section) => section.title === 'UA2 · UAH');
    expect(unknownSection?.rows).toContainEqual({ label: 'Кількість', value: '2' });
    expect(unknownSection?.rows).toContainEqual({ label: 'Собівартість залишку', value: '—' });
    expect(sections[0].rows).toContainEqual({ label: 'Випусків без розрахунку', value: '1' });
    expect(sections.find((section) => section.allocationChart)?.allocationChart?.slices).toEqual([
      { label: 'UA1', value: 1800 },
    ]);
  });

  it('does not assign a cost to a confirmed sale that depends on an unconfirmed purchase', () => {
    const pending = { ...purchase, planned: true };
    const confirmedSale: Operation = {
      ...purchase,
      id: 'sale',
      type: 'sale',
      date: '2025-02-01',
      quantity: 1,
      amount: 1000,
    };
    const wallet = buildWallet([pending, confirmedSale], new Map(), '2025-03-01');
    const made = positionReportSections(wallet, 'structure', null, null, 'made');
    expect(made[0].rows).toContainEqual({ label: 'Собівартість залишку', value: '—' });
    expect(made.find((section) => section.title === 'UA1 · UAH')?.footer).toContain(
      'Продаж залежить від непідтвердженої купівлі',
    );
    expect(made.some((section) => section.allocationChart)).toBe(false);
  });
});

describe('yield and bond reports', () => {
  it('weights historical NBU rates by purchase amount and shows the current rate separately', () => {
    const second: Operation = { ...purchase, id: 'second', date: '2025-03-01', amount: 900 };
    const wallet = buildWallet([purchase, second], new Map(), '2025-06-01');
    const rateOn = (date: string) => (date === '2025-01-01' ? 12 : 18);
    const [section, bondSection] = positionReportSections(wallet, 'yield', null, 15, 'all', rateOn);
    const value = (label: string) => section.rows.find((row) => row.label === label)?.value;

    expect(value('Середня ставка купону')).toBe(formatPercent(10));
    expect(value('Облікова ставка НБУ зараз')).toBe(formatPercent(15));
    expect(bondSection.title).toBe('UA1 · UAH');
    expect(bondSection.rows.find((row) => row.label === 'Ставка НБУ на дати купівлі')?.value).toBe(
      formatPercent(14),
    );
  });

  it('groups each bond with its currency summary and keeps missing values visible', () => {
    const usdBond: Bond = { ...bond, isin: 'UA2', currency: 'USD', rate: 5 };
    const usdPurchase: Operation = {
      ...purchase,
      id: 'usd',
      isin: usdBond.isin,
      currency: 'USD',
      ovdp: usdBond,
    };
    const unknown: Operation = { ...purchase, id: 'unknown', isin: 'UA3', ovdp: null };
    const wallet = buildWallet([purchase, usdPurchase, unknown], new Map(), '2025-06-01');
    const sections = positionReportSections(wallet, 'yield', null, null);
    expect(sections.map((section) => section.title)).toEqual([
      'Підсумок · UAH',
      'UA1 · UAH',
      'UA3 · UAH',
      'Підсумок · USD',
      'UA2 · USD',
    ]);
    expect(sections[2].rows).toEqual([
      { label: 'Річна дохідність', value: '—' },
      { label: 'Ставка купону', value: '—' },
      { label: 'Ставка НБУ на дати купівлі', value: '—' },
    ]);
    expect(sections[4].rows.some((row) => row.label.includes('НБУ'))).toBe(false);
  });

  it('keeps every bond in the report when the chart shows only five', () => {
    const operations = Array.from({ length: 6 }, (_, index): Operation => {
      const isin = `UA${index + 1}`;
      return { ...purchase, id: isin, isin, ovdp: { ...bond, isin } };
    });
    const wallet = buildWallet(operations, new Map(), '2025-06-01');
    const sections = positionReportSections(wallet, 'yield', null, 15, 'all', () => 15);
    expect(sections).toHaveLength(7);
    expect(sections[0].chart?.bars).toHaveLength(5);
    expect(sections[0].footer).toContain('чотири найвищі та найнижча');
    expect(sections.slice(1).map((section) => section.title)).toEqual(
      operations.map((operation) => `${operation.isin} · UAH`),
    );
  });

  it('shows missing historical rates as unknown and does not show NBU rates for foreign currency', () => {
    const wallet = buildWallet([purchase], new Map(), '2025-06-01');
    const [section] = positionReportSections(wallet, 'bond', bond.isin, null);
    expect(section.rows.find((row) => row.label === 'Ставка НБУ на дати купівлі')?.value).toBe('—');

    const usdBond: Bond = { ...bond, isin: 'UA2', currency: 'USD' };
    const usdPurchase: Operation = {
      ...purchase,
      isin: usdBond.isin,
      currency: 'USD',
      ovdp: usdBond,
    };
    const usdWallet = buildWallet([usdPurchase], new Map(), '2025-06-01');
    const [usdSection] = positionReportSections(usdWallet, 'yield', null, 15);
    expect(usdSection.rows.some((row) => row.label.includes('НБУ'))).toBe(false);
  });
});

describe('bond cash flow report', () => {
  it('graphs the selected bond and preserves annual totals and event details', () => {
    const planned: Operation = {
      ...purchase,
      id: 'planned',
      date: '2025-03-01',
      quantity: 1,
      amount: 900,
      planned: true,
    };
    const sale: Operation = {
      ...purchase,
      id: 'sale',
      type: 'sale',
      date: '2025-05-01',
      quantity: 1,
      amount: 1100,
      planned: true,
    };
    const otherBond: Bond = { ...bond, isin: 'UA2' };
    const other: Operation = { ...purchase, id: 'other', isin: 'UA2', ovdp: otherBond };
    const wallet = buildWallet([purchase, planned, sale, other], new Map(), '2025-02-01');
    const sections = positionReportSections(wallet, 'bond', bond.isin, null);
    const chart = sections.find((section) => section.capitalChart)?.capitalChart;
    expect(chart?.dates).toEqual([
      '2025-01-01',
      '2025-02-01',
      '2025-03-01',
      '2025-05-01',
      '2026-01-01',
      '2027-01-01',
    ]);
    expect(chart?.series.find((line) => line.label === 'Залишок вкладень · план')?.values).toEqual([
      1800, 1800, 2700, 1800, 900, 0,
    ]);
    const operations = sections.find((section) => section.table?.columns[0] === 'Купівлі')?.table;
    expect(operations?.rows.find((row) => row.label === '2025')?.values).toEqual([
      formatAmount(2700),
      formatAmount(1100),
    ]);
    expect(
      sections.find((section) => section.title === 'Дохід за роками · UAH')?.rows,
    ).toContainEqual({
      label: '2025',
      value: formatMoney(200, 'UAH'),
    });
    expect(sections.some((section) => section.title.startsWith('Продаж · 01.05.2025'))).toBe(true);
    expect(sections.some((section) => section.title.startsWith('Погашення · 01.01.2026'))).toBe(
      true,
    );
  });

  it('returns no report for an unavailable bond', () => {
    const wallet = buildWallet([purchase], new Map(), '2025-02-01');
    expect(positionReportSections(wallet, 'bond', 'missing', null)).toEqual([]);
  });
});
