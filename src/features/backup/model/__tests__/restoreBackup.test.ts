import {
  type InvestmentPlan,
  type PlanPurchase,
  getInvestmentPlans,
  getPurchases,
  restorePortfolio,
} from '@/entities/portfolio';

import { confirmDestructive, showToast } from '@/shared/lib';

import { restoreBackup } from '../restoreBackup';

// The confirmation is a native alert and the toast a screen's: what they are asked to show is
// what matters here.
jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  confirmDestructive: jest.fn(),
  showToast: jest.fn(),
}));

const confirm = jest.mocked(confirmDestructive);
const toast = jest.mocked(showToast);

const plan: InvestmentPlan = { id: 'restored', name: 'З копії' };
const purchase = (id: string, planId: string): PlanPurchase => ({
  id,
  planId,
  isin: 'UA4000227045',
  purchaseDate: '2025-03-10',
  amount: 1000,
  quantity: 1,
  currency: 'UAH',
});
const backup = { plans: [plan], purchases: [purchase('a', plan.id), purchase('b', plan.id)] };

beforeEach(() => {
  jest.clearAllMocks();
  restorePortfolio([], []);
});

describe('restoreBackup', () => {
  it('restores at once into an empty app, says so and closes', () => {
    const onRestored = jest.fn();
    restoreBackup(backup, 'file', onRestored);

    expect(confirm).not.toHaveBeenCalled();
    expect(getInvestmentPlans()).toEqual([plan]);
    expect(getPurchases()).toEqual(backup.purchases);
    expect(toast).toHaveBeenCalledWith({
      tone: 'success',
      title: 'Копію відновлено',
      message: 'Відновлено 1 план і 2 купівлі з файлу.',
    });
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('asks before replacing what the app holds, and changes nothing until confirmed', () => {
    const current: InvestmentPlan = { id: 'current', name: 'Мій план' };
    restorePortfolio([purchase('c', current.id)], [current]);
    const onRestored = jest.fn();

    restoreBackup(backup, 'cloud', onRestored);

    expect(confirm).toHaveBeenCalledWith(
      'Замінити дані з копії?',
      'Зараз 1 план і 1 купівля. Їх буде замінено на 1 план і 2 купівлі з хмари.',
      'Замінити',
      expect.any(Function),
    );
    // Cancelled: the alert never calls back, and the app keeps its data and its screen.
    expect(getInvestmentPlans()).toEqual([current]);
    expect(onRestored).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();

    // Confirmed: everything is replaced, plans and purchases alike.
    const [, , , apply] = confirm.mock.calls[0];
    apply();
    expect(getInvestmentPlans()).toEqual([plan]);
    expect(getPurchases()).toEqual(backup.purchases);
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('names where the copy came from', () => {
    restoreBackup(backup, 'pasted', jest.fn());
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Відновлено 1 план і 2 купівлі з копії.' }),
    );
  });
});
