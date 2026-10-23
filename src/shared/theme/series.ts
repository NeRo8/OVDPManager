import type { AppTheme } from './palette';

/**
 * Chart series and the list rows of the same kind share these colors: `mark` for columns and
 * swatches, `text` for amounts written in the series color.
 */
export const SERIES_COLORS = {
  coupon: { mark: 'seriesCoupon', text: 'seriesCouponText' },
  redemption: { mark: 'seriesRedemption', text: 'seriesRedemptionText' },
  purchase: { mark: 'seriesPurchase', text: 'seriesPurchaseText' },
} as const satisfies Record<string, { mark: keyof AppTheme; text: keyof AppTheme }>;

export type SeriesColor = keyof typeof SERIES_COLORS;
