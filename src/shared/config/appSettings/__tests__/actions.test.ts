import { refreshToday } from '../actions';
import { useAppSettingsStore } from '../store';

describe('refreshToday', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useAppSettingsStore.setState({ preference: 'dark', today: '2026-01-01' });
  });

  afterEach(() => jest.useRealTimers());

  it('takes the local calendar date and keeps the theme', () => {
    jest.setSystemTime(new Date(2026, 0, 2, 0, 5));
    refreshToday();
    expect(useAppSettingsStore.getState()).toEqual({ preference: 'dark', today: '2026-01-02' });
  });
});
