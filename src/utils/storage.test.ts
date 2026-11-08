import { mmkvStorage, portfolioUpdate } from './storage';

it('restores both persisted stores if a portfolio update fails', () => {
  mmkvStorage.setItem('holdings-v1', 'old operations');
  mmkvStorage.setItem('investment-plan-v1', 'old plans');
  expect(() =>
    portfolioUpdate(() => {
      mmkvStorage.setItem('holdings-v1', 'new operations');
      mmkvStorage.setItem('investment-plan-v1', 'new plans');
      throw new Error('interrupted');
    }),
  ).toThrow('interrupted');
  expect(mmkvStorage.getItem('holdings-v1')).toBe('old operations');
  expect(mmkvStorage.getItem('investment-plan-v1')).toBe('old plans');
});
