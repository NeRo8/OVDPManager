import { columnStacks, describeColumn, formatChartValue } from '../columnStacks';

const columns = [
  { label: 'січ', name: 'Січень' },
  { label: 'лют', name: 'Лютий' },
];
const series = [
  { label: 'Купони', color: 'coupon' as const, values: [100, 0] },
  { label: 'Погашення', color: 'redemption' as const, values: [50, 0] },
  { label: 'Купівлі', color: 'purchase' as const, values: [0, 300], direction: 'down' as const },
];

describe('column chart', () => {
  it('stacks each column above and below zero on one grid', () => {
    const stacks = columnStacks(columns, series);

    expect(stacks.up.map((item) => item.label)).toEqual(['Купони', 'Погашення']);
    expect(stacks.down.map((item) => item.label)).toEqual(['Купівлі']);
    expect(stacks.upTotals).toEqual([150, 0]);
    expect(stacks.downTotals).toEqual([0, 300]);
    expect(stacks.grid.min).toBeLessThanOrEqual(-300);
    expect(stacks.grid.max).toBeGreaterThanOrEqual(150);
  });

  it('leaves negative values out of a stack', () => {
    const stacks = columnStacks(columns, [{ label: 'Дохід', color: 'coupon', values: [-20, 40] }]);

    expect(stacks.upTotals).toEqual([0, 40]);
  });

  it('describes a column in words, money going out with a minus', () => {
    expect(describeColumn(columns[1], 1, series, 'percent', 'UAH')).toBe('Лютий: Купівлі −300 %');
    expect(describeColumn({ label: 'бер', name: 'Березень' }, 2, series, 'money', 'UAH')).toBe(
      'Березень: нічого немає',
    );
  });

  it('formats a percent with up to two decimals', () => {
    expect(formatChartValue(12.345, 'percent', 'UAH')).toBe('12,35 %');
  });
});
