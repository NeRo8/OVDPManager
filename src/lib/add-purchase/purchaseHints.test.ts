import type { Bond } from '@/lib/portfolio/portfolio';
import { formatMoney } from '@/utils/format';

import { annualYieldText, assessPurchase } from './purchaseHints';

const date = '2026-10-29';

let nextIsin = 0;
function bondOf(fields: Partial<Bond> = {}): Bond {
  nextIsin += 1;
  return {
    isin: `UA40000000${String(nextIsin).padStart(2, '0')}`,
    kind: 'ovdp',
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

/** A purchase of `bond` at `pricePerBond` that yields `annualYield`, with every payment known. */
function assess(fields: Partial<Parameters<typeof assessPurchase>[0]> = {}) {
  return assessPurchase({
    bond: bondOf(),
    date,
    today: date,
    pricePerBond: 1000,
    netIncome: 300,
    isComplete: true,
    annualYield: 16,
    keyRate: 16,
    keyRateFailed: false,
    bonds: [],
    ...fields,
  });
}

const tones = (hints: { tone: string }[]) => hints.map((hint) => hint.tone);

describe('assessPurchase', () => {
  it('calls a purchase good when its yield is above the key rate or close to it', () => {
    expect(assess({ annualYield: 17.5 }).verdict).toEqual({
      tone: 'success',
      title: 'Вигідна купівля',
    });
    expect(assess({ annualYield: 15.2 }).verdict?.tone).toBe('success');
  });

  it('warns 1–3 points below the key rate and calls it a poor purchase further below', () => {
    expect(assess({ annualYield: 14 }).verdict?.tone).toBe('warning');
    expect(assess({ annualYield: 12.5 }).verdict).toEqual({
      tone: 'error',
      title: 'Невигідна купівля',
    });
  });

  it('does not praise a discount: the yield decides', () => {
    const { verdict, hints } = assess({ pricePerBond: 900, annualYield: 14 });
    expect(verdict?.tone).toBe('warning');
    expect(hints.find((hint) => hint.text.startsWith('Ціна 1 шт'))?.tone).toBe('info');
  });

  it('does not call a premium for a high coupon an overpayment while the yield is the market’s', () => {
    const { verdict, hints } = assess({
      bond: bondOf({ rate: 19.5 }),
      pricePerBond: 1080,
      annualYield: 16.5,
    });
    expect(verdict?.tone).toBe('success');
    expect(tones(hints)).not.toContain('warning');
  });

  it('explains a long term without holding the verdict back', () => {
    const { verdict, hints } = assess({
      bond: bondOf({ maturityDate: '2036-10-29' }),
      annualYield: 17,
    });
    expect(verdict?.tone).toBe('success');
    expect(hints.find((hint) => hint.text.startsWith('Гроші будуть'))?.tone).toBe('info');
  });

  it('takes a deep discount of a long bond at a market yield for a real price', () => {
    const { verdict } = assess({
      bond: bondOf({ maturityDate: '2047-05-10', rate: 10.3 }),
      pricePerBond: 450,
      annualYield: 20,
    });
    expect(verdict?.tone).toBe('success');
  });

  it('calls a purchase the payments do not cover a poor one', () => {
    const { verdict, hints } = assess({ pricePerBond: 1400, netIncome: -100, annualYield: -5 });
    expect(verdict?.tone).toBe('error');
    expect(hints[0].text).toBe('Виплати не покриють купівлю: ви втратите 100,00 ₴.');
  });

  it('asks to check the amount for a yield no market gives, without comparing it', () => {
    const tooHigh = assess({ pricePerBond: 10, netIncome: 1300, annualYield: null, keyRate: 16 });
    expect(tooHigh.verdict).toEqual({ tone: 'warning', title: 'Перевірте суму' });
    expect(tooHigh.hints).toHaveLength(1);
    expect(tooHigh.hints[0].text).toContain('річна дохідність була б понад 1000%');
    expect(tooHigh.hints[0].text).toContain('Якщо все правильно, купівля дуже вигідна.');

    expect(assess({ annualYield: 55 }).verdict?.title).toBe('Перевірте суму');

    const tooLow = assess({ pricePerBond: 100000, netIncome: -98700, annualYield: null });
    expect(tooLow.verdict?.title).toBe('Перевірте суму');
    expect(tooLow.hints[0].text).toContain(`ви втратите ${formatMoney(98700, 'UAH')}`);
  });

  it('warns that the yield is unknown until NBU publishes the redemption', () => {
    const { verdict, hints } = assess({ netIncome: null, isComplete: false, annualYield: null });
    expect(verdict?.tone).toBe('warning');
    expect(hints[0].text).toContain('НБУ ще не опублікував погашення');
  });

  it('reports missing redemption data even for a high purchase price', () => {
    const result = assess({
      pricePerBond: 10000,
      netIncome: null,
      isComplete: false,
      annualYield: null,
    });
    expect(result.verdict?.title).toBe('Є на що звернути увагу');
    expect(result.hints[0].text).toContain('НБУ ще не опублікував погашення');
  });

  it('compares the yield with the bonds of its currency and term placed in the last 12 months', () => {
    const bonds = [
      bondOf({ rate: 15, issueDate: '2026-03-01' }),
      bondOf({ rate: 16, issueDate: '2026-06-01' }),
      bondOf({ rate: 17, issueDate: '2026-09-01', maturityDate: '2029-01-31' }),
      // Placed long ago, of another currency or another term: left out.
      bondOf({ rate: 6, issueDate: '2017-01-01' }),
      bondOf({ rate: 6, issueDate: '2017-02-01' }),
      bondOf({ rate: 4, currency: 'USD' }),
      bondOf({ rate: 9, maturityDate: '2036-10-29' }),
    ];
    const below = assess({ annualYield: 14.5, keyRate: null, bonds });
    expect(below.verdict?.tone).toBe('warning');
    expect(below.hints[0].text).toBe(
      'Річна дохідність 14,5% на 1,5 п.п. нижча за медіанну ставку купону (16%) облігацій у UAH зі строком 1–3 роки, розміщених за останні 12 місяців (кількість: 3): нова облігація може дати більше.',
    );
    expect(assess({ annualYield: 16.5, keyRate: null, bonds }).verdict?.tone).toBe('success');
  });

  it('leaves the bonds placed lately out when there are too few of them', () => {
    const bonds = [bondOf({ rate: 20, issueDate: '2026-06-01' })];
    expect(assess({ annualYield: 16, keyRate: null, bonds }).hints).toEqual([
      {
        tone: 'info',
        text: 'Облікова ставка НБУ недоступна, а нових облігацій для порівняння недостатньо.',
      },
    ]);
  });

  it('says the key rate did not load, with or without new bonds, the verdict unchanged', () => {
    const fewNewBonds = [bondOf({ rate: 20, issueDate: '2026-06-01' })];
    expect(assess({ keyRate: null, keyRateFailed: true, bonds: fewNewBonds }).hints).toEqual([
      {
        tone: 'info',
        text: 'Не вдалося завантажити облікову ставку НБУ, а нових облігацій для порівняння недостатньо. Спробуйте пізніше.',
      },
    ]);
    const newBonds = [
      bondOf({ rate: 16, issueDate: '2026-06-01' }),
      bondOf({ rate: 16, issueDate: '2026-07-01' }),
    ];
    const withNewBonds = assess({ keyRate: null, keyRateFailed: true, bonds: newBonds });
    expect(withNewBonds.hints.map(({ text }) => text)).toContain(
      'Не вдалося завантажити облікову ставку НБУ, тож порівняння з нею немає. Спробуйте пізніше.',
    );
    expect(withNewBonds.verdict).toEqual(assess({ keyRate: null, bonds: newBonds }).verdict);
  });

  it('compares a bond in another currency with new bonds only, not with the key rate', () => {
    const usd = (rate: number) => bondOf({ currency: 'USD', rate, issueDate: '2026-05-01' });
    const { verdict, hints } = assess({
      bond: bondOf({ currency: 'USD', rate: 4 }),
      annualYield: 2,
      keyRate: 16,
      bonds: [usd(4), usd(4.2)],
    });
    expect(verdict?.tone).toBe('warning');
    expect(hints.some((hint) => hint.text.includes('облікову ставку НБУ ('))).toBe(false);
  });
});

it('explains unavailable comparisons and today’s rates for a future purchase', () => {
  const result = assess({
    date: '2027-01-01',
    today: '2026-10-29',
    keyRate: null,
    bonds: [],
  });
  expect(result.hints.map((hint) => hint.text)).toEqual(
    expect.arrayContaining([
      expect.stringContaining('Облікова ставка НБУ недоступна'),
      expect.stringContaining('сьогоднішні ставки'),
    ]),
  );
});

describe('annualYieldText', () => {
  it('spells out the yield, and where it lies beyond what can be computed', () => {
    expect(annualYieldText({ annualYield: 16.5, netIncome: 300, isComplete: true })).toBe('16,5%');
    expect(annualYieldText({ annualYield: null, netIncome: 1300, isComplete: true })).toBe(
      'понад 1000%',
    );
    expect(annualYieldText({ annualYield: null, netIncome: -500, isComplete: true })).toBe(
      'нижче −99%',
    );
    expect(annualYieldText({ annualYield: null, netIncome: null, isComplete: false })).toBe('—');
  });
});
