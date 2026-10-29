import { type Bond, type Purchase, amountForYield, groupPositions } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { holdOrSell } from '../holdOrSell';

/** Two years, a 10% coupon paid twice a year on a nominal of 1000, redeemed at once. */
const bond: Bond = {
  isin: 'UA4000000001',
  nominal: 1000,
  rate: 10,
  currency: 'UAH',
  issueDate: '2025-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [
    { date: '2025-07-01', type: 'coupon', amount: 50 },
    { date: '2026-01-01', type: 'coupon', amount: 50 },
    { date: '2026-07-01', type: 'coupon', amount: 50 },
    { date: '2027-01-01', type: 'coupon', amount: 50 },
    { date: '2027-01-01', type: 'redemption', amount: 1000 },
  ],
};
const today = '2026-03-15';

/** Bonds of the same currency and term placed lately, paying 14% and 16%: the median is 15%. */
const newBonds: Bond[] = [14, 16].map((rate, index) => ({
  ...bond,
  isin: `UA400000010${index}`,
  rate,
  issueDate: '2026-01-01',
  maturityDate: '2026-12-01',
}));

let nextId = 0;
function purchase(fields: Partial<Purchase> & Pick<Purchase, 'purchaseDate' | 'amount'>): Purchase {
  nextId += 1;
  return { id: String(nextId), isin: bond.isin, quantity: 2, currency: 'UAH', ...fields };
}

const bought = purchase({ purchaseDate: '2025-01-01', amount: 1980 });

function assess(
  fields: Partial<Parameters<typeof holdOrSell>[0]> & { purchases?: Purchase[] } = {},
) {
  const { purchases = [bought], ...rest } = fields;
  return holdOrSell({
    position: groupPositions(purchases)[0],
    bond,
    today,
    keyRate: 16,
    bonds: [bond, ...newBonds],
    salePrice: null,
    ...rest,
  });
}

/** The payments of one bond still ahead today. */
const ahead = [
  { date: '2026-07-01', total: 50 },
  { date: '2027-01-01', total: 50 },
  { date: '2027-01-01', total: 1000 },
];

describe('holdOrSell', () => {
  it('gives the prices that decide: break-even and where selling beats new bonds', () => {
    const result = assess();
    expect(result).toMatchObject({
      quantity: 2,
      // Cost 1980, coupons received 200, over 2 bonds.
      breakEvenPrice: 890,
      sellAbovePrice: amountForYield(today, ahead, 15),
      holdResult: 420,
      sale: null,
    });
  });

  it('without a price, says new bonds pay more than a bond bought at 10%', () => {
    const result = assess();
    expect(result?.verdict).toEqual({ tone: 'warning', title: 'Нові ОВДП дають більше' });
    expect(result?.hints.every((hint) => hint.tone === 'warning')).toBe(true);
  });

  it('without a price, keeps a bond that pays more than the market', () => {
    const result = assess({ keyRate: 8, bonds: [bond] });
    expect(result?.verdict).toEqual({ tone: 'success', title: 'Варто тримати' });
  });

  it('sells above the price at which the money would earn more in a new bond', () => {
    const above = (assess()?.sellAbovePrice ?? 0) + 10;
    const result = assess({ salePrice: above });
    expect(result?.verdict).toEqual({ tone: 'warning', title: 'Вигідніше продати' });
    expect(result?.sale?.holdYield).toBeLessThan(15);
    expect(result?.sale?.saleResult).toBeCloseTo(200 + above * 2 - 1980, 2);
  });

  it('keeps below that price, and warns when selling there loses money', () => {
    const result = assess({ salePrice: 880 });
    expect(result?.verdict).toEqual({ tone: 'success', title: 'Вигідніше тримати' });
    expect(result?.sale?.saleResult).toBe(-20);
    expect(result?.hints[1].text).toContain(`збиток ${formatMoney(20, 'UAH')}`);
  });

  it('asks to check a price no buyer would pay', () => {
    expect(assess({ salePrice: 10 })?.verdict?.title).toBe('Перевірте ціну');
    expect(assess({ salePrice: 5000 })?.verdict?.title).toBe('Перевірте ціну');
    expect(assess({ salePrice: 10 })?.sale).toBeNull();
  });

  it('falls back to the key rate without new bonds, and to no verdict in another currency', () => {
    expect(assess({ bonds: [bond] })?.sellAbovePrice).toBe(amountForYield(today, ahead, 16));
    const usd = assess({
      bond: { ...bond, currency: 'USD' },
      bonds: [bond],
      purchases: [{ ...bought, currency: 'USD' }],
      salePrice: 1000,
    });
    expect(usd?.sellAbovePrice).toBeNull();
    expect(usd?.verdict).toBeNull();
  });

  it('counts only the bonds held today', () => {
    const planned = purchase({ purchaseDate: '2026-05-01', amount: 2000 });
    expect(assess({ purchases: [bought, planned] })?.quantity).toBe(2);
    expect(assess({ purchases: [planned] })).toBeNull();
  });

  it('is null once the bond cannot be sold or while its redemption is unpublished', () => {
    expect(assess({ today: '2027-01-01' })).toBeNull();
    const unpublished = { ...bond, payments: bond.payments.filter((p) => p.type === 'coupon') };
    expect(assess({ bond: unpublished })).toBeNull();
  });
});
