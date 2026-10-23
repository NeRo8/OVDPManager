import { useKeyRateStore } from './store';

export function saveKeyRate(date: string, rate: number, updatedAt: number): void {
  useKeyRateStore.setState((state) => ({
    byDate: { ...state.byDate, [date]: { rate, updatedAt } },
  }));
}
