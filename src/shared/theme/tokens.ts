/**
 * Spacing on a 4-point grid, plus `xxs` for the tight gap inside a stack of text lines. Rows and
 * screen edges use `lg` sideways and `md` vertically; sections are `xl` apart.
 */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Corner radii: `xs` for chart marks, `sm` for fields and inner controls, `md` for cards and buttons. */
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;
