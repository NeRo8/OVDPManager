import { contentsSchema, legacyContentsSchema, validateContents } from './contents.schema';

const bond = {
  isin: 'UA1',
  nominal: 1000,
  rate: 10,
  currency: 'UAH',
  issueDate: '2025-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [{ date: '2027-01-01', type: 'redemption', amount: 1000 }],
};
const operation = {
  id: 'a',
  planId: 'p',
  type: 'purchase',
  ovdp: bond,
  planned: false,
  isin: 'UA1',
  currency: 'UAH',
  date: '2025-02-01',
  quantity: 10,
  amount: 10000,
};
const contents = { plans: [{ id: 'p', name: 'План' }], operations: [operation] };

describe('contents.schema', () => {
  it('retains a bond kind in backups and accepts older snapshots without it', () => {
    const withKind = {
      ...contents,
      operations: [{ ...operation, ovdp: { ...bond, kind: 'ozdp' } }],
    };
    expect(contentsSchema.parse(withKind).operations[0].ovdp?.kind).toBe('ozdp');
    expect(contentsSchema.parse(contents).operations[0].ovdp?.kind).toBeUndefined();
  });

  it('rejects malformed coupon goals and sales marked as generated purchases', () => {
    const goal = {
      currency: 'UAH',
      kind: 'ovdp',
      year: 2028,
      incomeYears: 2,
      purchaseYears: 1,
      monthly: 1000,
      reinvest: true,
    };
    expect(
      contentsSchema.safeParse({ ...contents, plans: [{ ...contents.plans[0], goal }] }).success,
    ).toBe(true);
    for (const invalid of [
      { monthly: 0 },
      { currency: 'GBP' },
      { kind: 'unknown' },
      { year: 2028.5 },
      { incomeYears: 6 },
      { purchaseYears: 4 },
      { purchaseEndYear: 2028 },
      { reinvest: 'yes' },
    ]) {
      expect(
        contentsSchema.safeParse({
          ...contents,
          plans: [{ ...contents.plans[0], goal: { ...goal, ...invalid } }],
        }).success,
      ).toBe(false);
    }
    expect(
      contentsSchema.safeParse({
        ...contents,
        operations: [{ ...operation, type: 'sale', goalGenerated: true }],
      }).success,
    ).toBe(false);
  });

  it('validates nested schedules and the operation identity before restoring', () => {
    expect(contentsSchema.safeParse(contents).success).toBe(true);
    for (const ovdp of [
      { ...bond, isin: 'UA2' },
      { ...bond, currency: 'USD' },
      { ...bond, payments: [{ date: 'wrong', type: 'coupon', amount: 5 }] },
      { ...bond, payments: [...bond.payments, ...bond.payments] },
    ])
      expect(
        contentsSchema.safeParse({ ...contents, operations: [{ ...operation, ovdp }] }).success,
      ).toBe(false);
  });

  it('rejects a valid-looking sale that exceeds the holding', () => {
    const parsed = contentsSchema.parse({
      ...contents,
      operations: [
        operation,
        { ...operation, id: 'sale', type: 'sale', quantity: 11, date: '2026-01-01' },
      ],
    });
    expect(() => validateContents(parsed)).toThrow('перевищує');
  });

  it('gives operations from a file written before confirmation a planned flag by their date', () => {
    const { planned: _planned, ...unflagged } = operation;
    const ahead = { ...unflagged, id: 'ahead', date: '2099-01-01', ovdp: null };
    const [made, planned] = validateContents(
      contentsSchema.parse({ ...contents, operations: [unflagged, ahead] }),
    );
    expect(made.planned).toBe(false);
    expect(planned.planned).toBe(true);
    // A flag in the file is kept, but nothing dated ahead can have taken place.
    const kept = validateContents(
      contentsSchema.parse({
        ...contents,
        operations: [
          { ...operation, planned: true },
          { ...ahead, planned: false },
        ],
      }),
    );
    expect(kept.map((item) => item.planned)).toEqual([true, true]);
  });

  it('reads the actual v6 purchaseDate format without requiring a live catalog', () => {
    const { type: _type, ovdp: _ovdp, date, planned: _planned, ...purchase } = operation;
    const legacy = legacyContentsSchema.parse({
      plans: contents.plans,
      holdings: [{ ...purchase, purchaseDate: date }],
    });
    expect(legacy.operations[0]).toMatchObject({ date, type: 'purchase', ovdp: null });
  });
});
