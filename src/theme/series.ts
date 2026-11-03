import type { AppTheme } from './palette';

/**
 * Chart series and the list rows of the same kind share these colors: `mark` for columns and
 * swatches, `text` for amounts written in the series color, `badge` for a row's Avatar.
 */
export const SERIES_COLORS = {
  coupon: { mark: 'seriesCoupon', text: 'seriesCouponText', badge: 'seriesCouponBadge' },
  redemption: {
    mark: 'seriesRedemption',
    text: 'seriesRedemptionText',
    badge: 'seriesRedemptionBadge',
  },
  purchase: { mark: 'seriesPurchase', text: 'seriesPurchaseText', badge: 'seriesPurchaseBadge' },
  // Planned purchases differ from made ones only on charts; their rows read as purchases.
  plannedPurchase: {
    mark: 'seriesPlannedPurchase',
    text: 'seriesPurchaseText',
    badge: 'seriesPurchaseBadge',
  },
} as const satisfies Record<
  string,
  { mark: keyof AppTheme; text: keyof AppTheme; badge: keyof AppTheme }
>;

export type SeriesColor = keyof typeof SERIES_COLORS;
