import type { AppTheme, SeriesColor } from '@/shared/theme';
import { SERIES_COLORS } from '@/shared/theme';
import { withAlpha } from '@/shared/lib';

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
    },
  };
}
