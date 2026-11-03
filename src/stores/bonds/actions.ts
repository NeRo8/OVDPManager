import type { Bond } from '@/lib/portfolio/portfolio';
import { recoverOperationBonds, syncOperationBonds } from '@/stores/operations';

import { useBondsStore } from './store';

export function saveBonds(bonds: Bond[], updatedAt: number): void {
  recoverOperationBonds(useBondsStore.getState().bonds ?? []);
  syncOperationBonds(bonds);
  useBondsStore.setState({ bonds, updatedAt });
}
