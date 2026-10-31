import type { Bond, Purchase } from '../portfolio';
import { buildWallet, narrowWallet } from '../wallet';

function bondOf(isin: string, currency: Bond['currency'], maturityDate: string): Bond {
  return {
    isin,
    nominal: 1000,
    rate: 10,
    currency,
    issueDate: '2025-01-01',
    maturityDate,
    description: '',
    payments: [
      { date: '2025-07-01', type: 'coupon', amount: 50 },
      { date: maturityDate, type: 'coupon', amount: 50 },
      { date: maturityDate, type: 'redemption', amount: 1000 },
    ],
  };
}

const hryvnia = bondOf('UA4000000001', 'UAH', '2026-01-01');
const dollar = bondOf('UA4000000002', 'USD', '2025-10-01');
const byIsin = new Map([hryvnia, dollar].map((bond) => [bond.isin, bond]));
const today = '2025-08-01';

let nextId = 0;
function purchase(isin: string, currency: Purchase['currency'], purchaseDate: string): Purchase {
  nextId += 1;
  return { id: String(nextId), isin, currency, purchaseDate, amount: 990, quantity: 1 };
}

const purchases = [
  purchase(hryvnia.isin, 'UAH', '2025-02-01'),
  purchase(dollar.isin, 'USD', '2025-03-01'),
  purchase(hryvnia.isin, 'UAH', '2025-04-01'),
  // Missing from the NBU data: kept with its cost, without payments.
  purchase('UA4000000099', 'UAH', '2025-05-01'),
];

describe('buildWallet', () => {
  const wallet = buildWallet(purchases, byIsin, today);

  it('groups the purchases into a Position per bond', () => {
    expect(wallet.positions.map(({ position }) => position.isin)).toEqual([
      hryvnia.isin,
      dollar.isin,
      'UA4000000099',
    ]);
    expect(wallet.positions[0].position.quantity).toBe(2);
  });

  it('lists every Position’s payments by date, none for a bond missing from the NBU data', () => {
    expect(wallet.payments.map(({ date, isin }) => `${date} ${isin.slice(-2)}`)).toEqual([
      '2025-07-01 01',
      '2025-07-01 02',
      '2025-10-01 02',
      '2025-10-01 02',
      '2026-01-01 01',
      '2026-01-01 01',
    ]);
  });

  it('lists every purchase as an event by date, the missing bond’s too', () => {
    expect(wallet.purchaseEvents.map(({ date }) => date)).toEqual([
      '2025-02-01',
      '2025-03-01',
      '2025-04-01',
      '2025-05-01',
    ]);
  });
});

describe('narrowWallet', () => {
  const wallet = buildWallet(purchases, byIsin, today);

  it('keeps every field in step with the purchases it keeps', () => {
    const uah = narrowWallet(wallet, { currency: 'UAH', isins: [] });
    expect(uah.purchases.map(({ isin }) => isin)).toEqual([
      hryvnia.isin,
      hryvnia.isin,
      'UA4000000099',
    ]);
    expect(uah.positions.map(({ position }) => position.isin)).toEqual([
      hryvnia.isin,
      'UA4000000099',
    ]);
    expect(uah.payments.every(({ currency }) => currency === 'UAH')).toBe(true);
    expect(uah.purchaseEvents.every(({ currency }) => currency === 'UAH')).toBe(true);
  });

  it('narrows by bond, and by currency and bond together', () => {
    expect(narrowWallet(wallet, { currency: null, isins: [dollar.isin] }).positions).toHaveLength(
      1,
    );
    expect(narrowWallet(wallet, { currency: 'UAH', isins: [dollar.isin] }).purchases).toHaveLength(
      0,
    );
  });

  it('keeps everything with no currency and no bonds chosen', () => {
    expect(narrowWallet(wallet, { currency: null, isins: [] })).toEqual(wallet);
  });
});
