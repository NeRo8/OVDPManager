import { salePriceSchema } from '../salePrice.schema';

describe('salePriceSchema', () => {
  it('accepts an empty price or a positive amount in Ukrainian format', () => {
    expect(salePriceSchema.parse({ price: '  ' }).price).toBeNull();
    expect(salePriceSchema.parse({ price: '1 234,56' }).price).toBe(1234.56);
  });

  it('rejects nonnumeric, zero and negative prices', () => {
    for (const price of ['abc', '0', '-1']) {
      expect(salePriceSchema.safeParse({ price }).success).toBe(false);
    }
  });
});
