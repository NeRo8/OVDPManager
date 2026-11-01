import { formatPercent, parseAmount } from '../format';

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
