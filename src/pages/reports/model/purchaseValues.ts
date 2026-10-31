import { round2 } from '@/shared/lib';

import type { Flows } from './periodReport';

/**
 * Purchases on a chart over time, split into those made and the planned ones, each a series of its
 * own color below the baseline.
 */
export function purchaseValues(rows: Pick<Flows, 'invested' | 'planned'>[]): {
  made: number[];
  planned: number[];
} {
  return {
    made: rows.map(({ invested, planned }) => round2(invested - planned)),
    planned: rows.map(({ planned }) => planned),
  };
}
