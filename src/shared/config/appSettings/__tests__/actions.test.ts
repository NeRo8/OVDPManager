import { recordAppOpening } from '../actions';
import { useAppSettingsStore } from '../store';

describe('recordAppOpening', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useAppSettingsStore.setState({ preference: 'dark', today: '2026-01-01', lastOpenedAt: null });
  });

  afterEach(() => jest.useRealTimers());

  it('keeps the theme, records the opening, and reports an absence longer than 24 hours', () => {
    const firstOpening = new Date(2026, 0, 1, 12);
    jest.setSystemTime(firstOpening);
    expect(recordAppOpening()).toBe(false);
    expect(useAppSettingsStore.getState()).toMatchObject({
      preference: 'dark',
      today: '2026-01-01',
      lastOpenedAt: firstOpening.getTime(),
    });

    jest.setSystemTime(new Date(firstOpening.getTime() + 24 * 60 * 60 * 1000));
    expect(recordAppOpening()).toBe(false);
    expect(useAppSettingsStore.getState().today).toBe('2026-01-02');

    jest.setSystemTime(new Date(firstOpening.getTime() + 48 * 60 * 60 * 1000 + 1));
    expect(recordAppOpening()).toBe(true);
  });
});
