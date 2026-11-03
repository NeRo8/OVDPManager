import type { Bond } from '@/lib/portfolio/portfolio';

import { useBondsStore } from './store';

export function saveBonds(bonds: Bond[], updatedAt: number): void {
  useBondsStore.setState({ bonds, updatedAt });
}
