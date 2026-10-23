import { useKeyRateStore } from './store';

export function saveKeyRate(rate: number, updatedAt: number): void {
  useKeyRateStore.setState({ rate, updatedAt });
}
