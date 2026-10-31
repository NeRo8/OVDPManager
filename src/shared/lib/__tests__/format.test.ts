import { parseAmount } from '../format';

describe('parseAmount', () => {
  it('reads decimal commas and points, and explicit grouped formats', () => {
    expect(parseAmount('10 000,50')).toBe(10000.5);
    expect(parseAmount('1,000.50')).toBe(1000.5);
    expect(parseAmount('1.000,50')).toBe(1000.5);
    expect(parseAmount('1.000')).toBe(1);
  });

  it('rejects ambiguous or malformed punctuation', () => {
    expect(parseAmount('1,000,50')).toBeNaN();
    expect(parseAmount('1.2.3')).toBeNaN();
    expect(parseAmount('')).toBeNaN();
  });
});
