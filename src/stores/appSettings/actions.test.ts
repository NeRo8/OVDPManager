import { completeOnboarding, hideToast, refreshToday, showToast } from './actions';
import { initialState, useAppSettingsStore } from './store';

const settings = () => useAppSettingsStore.getState();

beforeEach(() => useAppSettingsStore.setState(initialState));

describe('refreshToday', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useAppSettingsStore.setState({ preference: 'dark', today: '2026-01-01' });
  });

  afterEach(() => jest.useRealTimers());

  it('takes the local calendar date and keeps the theme', () => {
    jest.setSystemTime(new Date(2026, 0, 2, 0, 5));
    refreshToday();
    expect(settings()).toMatchObject({ preference: 'dark', today: '2026-01-02' });
  });
});

describe('onboarding', () => {
  it('stays completed once seen, the theme kept', () => {
    useAppSettingsStore.setState({ preference: 'dark' });
    completeOnboarding();
    expect(settings()).toMatchObject({ preference: 'dark', isOnboardingCompleted: true });
  });
});

describe('toast', () => {
  it('shows one toast at a time, a new one replacing the last', () => {
    showToast({ tone: 'info', title: 'Перший' });
    showToast({ tone: 'success', title: 'Другий' });
    expect(settings().toast).toEqual({ tone: 'success', title: 'Другий' });
    hideToast();
    expect(settings().toast).toBeNull();
  });
});
