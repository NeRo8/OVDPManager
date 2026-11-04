import type { NewBondsRate } from './market';
import { keyRateFailedHint, keyRateHint, newBondsHint } from './yieldHints';

const newBonds: NewBondsRate = { rate: 16, count: 3, term: 'medium' };
const tone = (hint: { tone: string } | null) => hint?.tone ?? null;

describe('keyRateHint', () => {
  it('compares only a hryvnia yield, and only once the key rate is there', () => {
    expect(keyRateHint(14, 16, 'USD')).toBeNull();
    expect(keyRateHint(14, null, 'UAH')).toBeNull();
  });

  it('praises a yield above the key rate or within a point of it', () => {
    expect(keyRateHint(16.5, 16, 'UAH')).toEqual({
      tone: 'success',
      text: 'Річна дохідність 16,5% вища за облікову ставку НБУ (16%).',
    });
    expect(keyRateHint(15, 16, 'UAH')).toEqual({
      tone: 'success',
      text: 'Річна дохідність 15% близька до облікової ставки НБУ (16%).',
    });
  });

  it('warns more than a point below it, and calls it an error past the gap given', () => {
    expect(keyRateHint(14.5, 16, 'UAH')).toEqual({
      tone: 'warning',
      text: 'Річна дохідність 14,5% на 1,5 п.п. нижча за облікову ставку НБУ (16%): депозит чи нова ОВДП можуть дати більше.',
    });
    expect(tone(keyRateHint(10, 16, 'UAH'))).toBe('warning');
    expect(tone(keyRateHint(13, 16, 'UAH', 3))).toBe('warning');
    expect(tone(keyRateHint(12.9, 16, 'UAH', 3))).toBe('error');
  });
});

describe('newBondsHint', () => {
  it('says nothing without new bonds to compare with', () => {
    expect(newBondsHint(14, null, 'UAH')).toBeNull();
  });

  it('warns more than a point below their median coupon, in any currency, never an error', () => {
    expect(newBondsHint(14, newBonds, 'UAH')).toEqual({
      tone: 'warning',
      text: 'Річна дохідність 14% на 2 п.п. нижча за медіанну ставку купону (16%) облігацій у UAH зі строком 1–3 роки, розміщених за останні 12 місяців (кількість: 3): нова облігація може дати більше.',
    });
    expect(tone(newBondsHint(5, { ...newBonds, rate: 9 }, 'USD'))).toBe('warning');
  });

  it('praises a yield above their median or within a point of it', () => {
    expect(tone(newBondsHint(16.5, newBonds, 'UAH'))).toBe('success');
    expect(newBondsHint(15, newBonds, 'UAH')?.text).toMatch(/^Річна дохідність 15% близька/);
  });
});

describe('keyRateFailedHint', () => {
  it('explains a missing key rate only when it failed to load, and only in hryvnia', () => {
    expect(keyRateFailedHint(true, 'UAH')).toEqual({
      tone: 'info',
      text: 'Не вдалося завантажити облікову ставку НБУ, тож порівняння з нею немає. Спробуйте пізніше.',
    });
    expect(keyRateFailedHint(false, 'UAH')).toBeNull();
    expect(keyRateFailedHint(true, 'USD')).toBeNull();
  });
});
