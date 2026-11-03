import {
  formatCompact,
  formatMoney,
  formatPercent,
  formatRateNumber,
  formatTotals,
  parseAmount,
  plural,
  signPrefix,
} from './format';

/** Intl groups thousands with a no-break space; compared here as a plain one. */
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('parseAmount', () => {
  it('reads decimal commas and points, and explicit grouped formats', () => {
    expect(parseAmount('10 000,50')).toBe(10000.5);
    expect(parseAmount('1,000.50')).toBe(1000.5);
    expect(parseAmount('1.000,50')).toBe(1000.5);
    expect(parseAmount('1.000')).toBe(1);
    expect(parseAmount('1,000')).toBe(1);
  });

  it('rejects ambiguous or malformed punctuation', () => {
    expect(parseAmount('1,000,50')).toBeNaN();
    expect(parseAmount('1.2.3')).toBeNaN();
    expect(parseAmount('')).toBeNaN();
  });
});

describe('formatPercent', () => {
  it('writes the decimal comma and a true minus sign', () => {
    expect(formatPercent(16.5)).toBe('16,5%');
    expect(formatPercent(-3.25)).toBe('−3,25%');
    expect(formatPercent(40)).toBe('40%');
  });
});

describe('formatMoney and formatTotals', () => {
  it('writes two decimals with a comma, groups thousands and adds the currency sign', () => {
    expect(plain(formatMoney(10200.5, 'UAH'))).toBe('10 200,50 ₴');
    expect(plain(formatMoney(5, 'USD'))).toBe('5,00 $');
    expect(plain(formatMoney(0.1, 'EUR'))).toBe('0,10 €');
    expect(plain(formatMoney(5, 'GBP'))).toBe('5,00 GBP');
  });

  it('adds amounts up per currency, in the order the currencies first come', () => {
    const totals = formatTotals([
      { currency: 'UAH', value: 100 },
      { currency: 'USD', value: 5 },
      { currency: 'UAH', value: 0.1 },
    ]);
    expect(plain(totals)).toBe('100,10 ₴ + 5,00 $');
  });
});

describe('short numbers and signs', () => {
  it('shortens axis amounts to thousands and millions', () => {
    expect(formatCompact(950)).toBe('950');
    expect(plain(formatCompact(1500))).toBe('1,5 тис');
    expect(plain(formatCompact(12500))).toBe('12,5 тис');
    expect(plain(formatCompact(1_200_000))).toBe('1,2 млн');
  });

  it('writes a rate with a decimal comma and a true minus', () => {
    expect(formatRateNumber(16.5)).toBe('16,5');
    expect(formatRateNumber(-0.5)).toBe('−0,5');
  });

  it('prefixes a plus or a minus, nothing at zero', () => {
    expect(signPrefix(3)).toBe('+');
    expect(signPrefix(-3)).toBe('−');
    expect(signPrefix(0)).toBe('');
  });
});

describe('plural', () => {
  const purchases = (count: number) => plural(count, 'купівля', 'купівлі', 'купівель');

  it('follows the Ukrainian rules, the teens always many', () => {
    expect([1, 21, 101].map(purchases)).toEqual(['купівля', 'купівля', 'купівля']);
    expect([2, 4, 22, 104].map(purchases)).toEqual(['купівлі', 'купівлі', 'купівлі', 'купівлі']);
    expect([0, 5, 11, 12, 14, 111, 112].map(purchases)).toEqual(Array(7).fill('купівель'));
  });
});
