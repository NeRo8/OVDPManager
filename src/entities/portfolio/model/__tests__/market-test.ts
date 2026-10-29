import { type NewBondsRate, maturityTerm, newBondsLabel, newBondsRate } from '../market';
import type { Bond } from '../portfolio';
import { amountForYield, annualYield } from '../yield';

const date = '2026-10-29';

let nextIsin = 0;
function bondOf(fields: Partial<Bond> = {}): Bond {
  nextIsin += 1;
  return {
    isin: `UA40000001${String(nextIsin).padStart(2, '0')}`,
    nominal: 1000,
    rate: 16,
    currency: 'UAH',
    issueDate: '2026-04-01',
    maturityDate: '2028-10-25',
    description: '',
    payments: [],
    ...fields,
  };
}

describe('maturityTerm', () => {
  it('splits the time left at one and three years, the last day included', () => {
    expect(maturityTerm({ maturityDate: '2027-10-29' }, date)).toBe('short');
    expect(maturityTerm({ maturityDate: '2027-10-30' }, date)).toBe('medium');
    expect(maturityTerm({ maturityDate: '2029-10-29' }, date)).toBe('medium');
    expect(maturityTerm({ maturityDate: '2029-10-30' }, date)).toBe('long');
  });
});

describe('newBondsRate', () => {
  const bond = bondOf();

  it('takes the median coupon of other bonds of its currency and term placed in the last 12 months', () => {
    const bonds = [
      bond,
      bondOf({ rate: 15, issueDate: '2026-03-01' }),
      bondOf({ rate: 17, issueDate: '2026-09-01' }),
      bondOf({ rate: 6, issueDate: '2025-10-29' }),
      bondOf({ rate: 4, currency: 'USD' }),
      bondOf({ rate: 9, maturityDate: '2036-10-29' }),
      bondOf({ rate: 9, issueDate: '2026-11-01' }),
    ];
    expect(newBondsRate(bond, date, bonds)).toEqual({ rate: 16, count: 2, term: 'medium' });
  });

  it('is null with fewer than two such bonds', () => {
    expect(newBondsRate(bond, date, [bond, bondOf({ issueDate: '2026-05-01' })])).toBeNull();
  });

  it('names them in words', () => {
    const rate: NewBondsRate = { rate: 16, count: 12, term: 'medium' };
    expect(newBondsLabel(rate, 'UAH')).toBe(
      '12 ОВДП у UAH зі строком 1–3 роки, розміщених за останні 12 місяців',
    );
  });
});

describe('amountForYield', () => {
  const payments = [
    { date: '2027-04-29', total: 80 },
    { date: '2027-10-29', total: 80 },
    { date: '2027-10-29', total: 1000 },
  ];

  it('gives the amount at which annualYield finds that yield', () => {
    const amount = amountForYield(date, payments, 15);
    expect(annualYield(amount, date, payments)).toBeCloseTo(15, 1);
  });

  it('is the nominal for a coupon of the same rate bought on a coupon date', () => {
    expect(amountForYield(date, payments, 16)).toBeCloseTo(1000, -1);
  });
});
