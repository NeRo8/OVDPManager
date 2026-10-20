import type { TextStyle } from 'react-native';

/** The app's 12 text styles, after the Apple text-style ramp. Screens pick one by name. */
export const typography = {
  /** Big totals: next payment, yearly income */
  display: { fontSize: 32, fontWeight: '700' },
  /** Large glyphs such as the year switcher arrows */
  title1: { fontSize: 24, fontWeight: '500' },
  /** Empty-state titles, the selected year */
  title2: { fontSize: 22, fontWeight: '700' },
  /** Small titles and inline glyphs */
  title3: { fontSize: 20, fontWeight: '400' },
  /** Buttons and emphasized row titles */
  headline: { fontSize: 17, fontWeight: '600' },
  /** Inputs and primary text */
  body: { fontSize: 17, fontWeight: '400' },
  /** Row titles: dates, ISINs in lists */
  callout: { fontSize: 16, fontWeight: '500' },
  /** Row labels and paragraphs */
  subhead: { fontSize: 15, fontWeight: '400' },
  /** Legends, hints, chart selection */
  footnote: { fontSize: 14, fontWeight: '400' },
  /** Secondary row details, section footers */
  caption1: { fontSize: 13, fontWeight: '400' },
  /** Section and card labels */
  overline: { fontSize: 13, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 0.3 },
  /** Data sources, chart labels */
  caption2: { fontSize: 11, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export type FontWeight = keyof typeof fontWeights;
