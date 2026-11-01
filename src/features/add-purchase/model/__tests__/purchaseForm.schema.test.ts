import type { Bond } from '@/entities/portfolio';

import { purchaseFormSchema } from '../purchaseForm.schema';

const bond: Bond = {
  isin: 'UA4000000001',
  currency: 'UAH',
  nominal: 1000,
  rate: 15,
  issueDate: '2025-01-01',
  maturityDate: '2028-01-01',
  description: '',
  payments: [],
};

it('rejects fractional and punctuation-separated quantities without changing their value', () => {
  const schema = purchaseFormSchema(bond);
  for (const quantity of ['1,5', '1.5', '1.000']) {
    expect(schema.safeParse({ purchaseDate: '2026-01-01', quantity, amount: '1000' }).success).toBe(
      false,
    );
  }
  expect(
    schema.parse({ purchaseDate: '2026-01-01', quantity: '15', amount: '1000' }).quantity,
  ).toBe(15);
});

it('reads a single comma or point as a decimal separator', () => {
  const schema = purchaseFormSchema(bond);
  const input = { purchaseDate: '2026-01-01', quantity: '1' };
  expect(schema.parse({ ...input, amount: '1.000' }).amount).toBe(1);
  expect(schema.parse({ ...input, amount: '1,000' }).amount).toBe(1);
  expect(schema.parse({ ...input, amount: '1 000' }).amount).toBe(1000);
  expect(schema.parse({ ...input, amount: '1,50' }).amount).toBe(1.5);
});

/** The message of the first problem with the form as typed, or null when it is valid. */
const problem = (fields: Partial<{ purchaseDate: string; quantity: string; amount: string }>) => {
  const result = purchaseFormSchema(bond).safeParse({
    purchaseDate: '2026-03-15',
    quantity: '10',
    amount: '10 000',
    ...fields,
  });
  return result.success ? null : result.error.issues[0].message;
};

it('takes a date from the placement day up to the day before maturity', () => {
  expect(problem({ purchaseDate: '2025-01-01' })).toBeNull();
  expect(problem({ purchaseDate: '2027-12-31' })).toBeNull();
  expect(problem({ purchaseDate: '2024-12-31' })).toBe(
    'ОВДП розміщена 01.01.2025 — дата купівлі не може бути раніше',
  );
  expect(problem({ purchaseDate: '2028-01-01' })).toBe(
    'ОВДП погашається 01.01.2028 — купівля має бути раніше',
  );
  expect(problem({ purchaseDate: '' })).toBe('Вкажіть дату купівлі');
});

it('asks for a quantity and an amount, both above zero', () => {
  expect(problem({ quantity: ' ' })).toBe('Вкажіть кількість ОВДП');
  expect(problem({ quantity: '0' })).toBe('Кількість має бути більшою за нуль');
  expect(problem({ amount: '' })).toBe('Вкажіть суму купівлі');
  expect(problem({ amount: '0,004' })).toBe('Сума має бути більшою за нуль');
  expect(problem({ amount: '1,000,50' })).toBe('Сума має бути числом');
});

it('gives the values as numbers, the amount rounded to kopecks', () => {
  expect(
    purchaseFormSchema(bond).parse({
      purchaseDate: '2026-03-15',
      quantity: '10',
      amount: '10 200,505',
    }),
  ).toEqual({ purchaseDate: '2026-03-15', quantity: 10, amount: 10200.51 });
});
