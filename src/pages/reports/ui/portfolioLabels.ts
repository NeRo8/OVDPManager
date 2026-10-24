import type { PortfolioStatus } from '@/features/report-filters';
import { formatDate } from '@/shared/lib';
import type { BondState } from '../model/portfolioReport';

export const PORTFOLIO_STATUS_LABELS: Record<PortfolioStatus, string> = {
  all: 'Усі',
  inCirculation: 'В обігу',
  redeemed: 'Погашені',
};

/** Under the report's date: which bonds it covers. */
export const PORTFOLIO_STATUS_TITLES: Record<PortfolioStatus, string> = {
  all: 'Усі ОВДП',
  inCirculation: 'ОВДП в обігу',
  redeemed: 'Погашені ОВДП',
};

/** Where a bond stands, as a row says it: «до 12.05.2028», «погашено». */
export function bondStateLabel(state: BondState, maturityDate?: string): string {
  if (state === 'unknown') return 'немає в даних НБУ';
  if (state === 'planned') return 'заплановано';
  if (state === 'redeemed') return 'погашено';
  return `до ${formatDate(maturityDate ?? '')}`;
}
