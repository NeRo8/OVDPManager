import type { AppTheme } from '@/theme/palette';
import { type SeriesColor, SERIES_COLORS } from '@/theme/series';
import { withAlpha } from '@/utils/color';

export type ChartPalette = {
  border: string;
  grid: string;
  marks: Record<SeriesColor, string>;
};

export function chartPalette(theme: AppTheme): ChartPalette {
  return {
    border: theme.border,
    grid: withAlpha(theme.border, 0.55),
    marks: {
      coupon: theme[SERIES_COLORS.coupon.mark],
      redemption: theme[SERIES_COLORS.redemption.mark],
      purchase: theme[SERIES_COLORS.purchase.mark],
      sale: theme[SERIES_COLORS.sale.mark],
      plannedPurchase: theme[SERIES_COLORS.plannedPurchase.mark],
    },
  };
}
