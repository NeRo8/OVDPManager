import type { InvestmentPlan } from '@/lib/portfolio/plan';
import type { PlanOperation } from '@/lib/portfolio/portfolio';
import { showToast } from '@/stores/appSettings';
import { getOperations } from '@/stores/operations';
import { getActivePlan, getInvestmentPlans, restorePortfolio } from '@/stores/plans';
import { confirmDestructive } from '@/utils/confirm';

import { restoreBackup } from './restoreBackup';

// The confirmation is a native alert and the toast a screen's: what they are asked to show is
// what matters here.
jest.mock('@/utils/confirm', () => ({
  ...jest.requireActual('@/utils/confirm'),
  confirmDestructive: jest.fn(),
}));
jest.mock('@/stores/toast', () => ({
  ...jest.requireActual('@/stores/toast'),
  showToast: jest.fn(),
}));

const confirm = jest.mocked(confirmDestructive);
const toast = jest.mocked(showToast);

const plan: InvestmentPlan = { id: 'restored', name: 'З копії', isActive: true };
const purchase = (id: string, planId: string): PlanOperation => ({
  type: 'purchase',
  ovdp: null,
  id,
  planId,
  isin: 'UA4000227045',
  date: '2025-03-10',
  amount: 1000,
  quantity: 1,
  currency: 'UAH',
});
const backup = { plans: [plan], operations: [purchase('a', plan.id), purchase('b', plan.id)] };

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
    expect(getOperations()).toEqual(backup.operations);
    expect(toast).toHaveBeenCalledWith({
      tone: 'success',
      title: 'Копію відновлено',
      message: 'Відновлено 1 план і 2 операції з файлу.',
    });
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('asks before replacing what the app holds, and changes nothing until confirmed', () => {
    const current: InvestmentPlan = { id: 'current', name: 'Мій план', isActive: true };
    restorePortfolio([purchase('c', current.id)], [current]);
    const onRestored = jest.fn();

    restoreBackup(backup, 'cloud', onRestored);

    expect(confirm).toHaveBeenCalledWith(
      'Замінити дані з копії?',
      'Зараз 1 план і 1 операція. Їх буде замінено на 1 план і 2 операції з хмари.',
      'Замінити',
      expect.any(Function),
    );
    // Cancelled: the alert never calls back, and the app keeps its data and its screen.
    expect(getInvestmentPlans()).toEqual([current]);
    expect(onRestored).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();

    // Confirmed: everything is replaced, plans and operations alike.
    const [, , , apply] = confirm.mock.calls[0];
    apply();
    expect(getInvestmentPlans()).toEqual([plan]);
    expect(getOperations()).toEqual(backup.operations);
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('names where the copy came from', () => {
    restoreBackup(backup, 'pasted', jest.fn());
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Відновлено 1 план і 2 операції з копії.' }),
    );
  });

  it('restores the selected plan from the backup', () => {
    const plans = [
      { ...plan, isActive: false },
      { id: 'second', name: 'Другий', isActive: true },
    ];
    restoreBackup({ ...backup, plans }, 'file', jest.fn());
    expect(getActivePlan()?.id).toBe('second');
    expect(getInvestmentPlans().map((item) => item.isActive)).toEqual([false, true]);
  });
});
