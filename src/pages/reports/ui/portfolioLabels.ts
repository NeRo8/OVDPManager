import type { PortfolioStatus } from '@/features/report-filters';

export const PORTFOLIO_STATUS_LABELS: Record<PortfolioStatus, string> = {
  all: 'Усі',
  active: 'В обігу',
  redeemed: 'Погашені',
};

/** Under the report's date: which bonds it covers. */
export const PORTFOLIO_STATUS_TITLES: Record<PortfolioStatus, string> = {
  all: 'Усі ОВДП',
  active: 'ОВДП в обігу',
  redeemed: 'Погашені ОВДП',
};
