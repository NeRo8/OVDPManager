import { chartGrid, formatGridTick, gridBoundaries } from '../chartGrid';

describe('chart grid', () => {
  it('keeps equal rows across zero and includes the whole value range', () => {
    const grid = chartGrid(-8, 163);

    expect(grid).toEqual({
      min: -25,
      max: 175,
      step: 25,
      ticks: [175, 150, 125, 100, 75, 50, 25, 0, -25],
    });
  });

  it('uses readable bounds for positive values and zero-only data', () => {
    expect(chartGrid(0, 3121).ticks).toEqual([3500, 3000, 2500, 2000, 1500, 1000, 500, 0]);
    expect(chartGrid(0, 0).ticks).toEqual([1, 0.8, 0.6, 0.4, 0.2, 0]);
  });

  it('keeps vertical lines on whole slot boundaries', () => {
    expect(gridBoundaries(12)).toEqual([0, 2 / 12, 4 / 12, 6 / 12, 8 / 12, 10 / 12, 1]);
    expect(gridBoundaries(1)).toEqual([0, 1]);
  });

  it('keeps adjacent fractional labels distinct', () => {
    const grid = chartGrid(0, 0.5);
    const labels = grid.ticks.map((tick) => formatGridTick(tick, grid.step));

    expect(new Set(labels).size).toBe(labels.length);
  });
});
