import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';
import { formatMoney, formatPercent } from '@/utils/format';

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
    expect(
      made[0].rows.find((row) => row.label === 'Вартість утримуваних облігацій')?.value,
    ).toContain('900,00');
  });
});

describe('portfolio structure', () => {
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
    const rows = positionReportSections(wallet, 'structure', null, null, 'made')[0].rows;
    const value = (label: string) => rows.find((row) => row.label === label)?.value;

    expect(value('Вартість утримуваних облігацій')).toBe(formatMoney(1900, 'UAH'));
    expect(value('До 1 року')).toBe(formatMoney(900, 'UAH'));
    expect(value('Понад 3 роки')).toBe(formatMoney(1000, 'UAH'));
    expect(value('Частка · UA1')).toBe(formatPercent(47.37));
    expect(value('Частка · UA2')).toBe(formatPercent(52.63));
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
