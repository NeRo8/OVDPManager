import type { Bond } from '../../model/portfolio';
import { useBondsStore } from './store';

export function saveBonds(bonds: Bond[], updatedAt: number): void {
  useBondsStore.setState({ bonds, updatedAt });
}
