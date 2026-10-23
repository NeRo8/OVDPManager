import type { TextStyle } from 'react-native';

/**
 * Manrope 4.504 (OFL, static files from `aaronbell/manrope`), embedded by the `expo-font` plugin in
 * `app.json` (`src/shared/config/fonts/`). One family for every weight: iOS groups the files by
 * their family name, Android by the plugin's XML font family, and `fontWeight` picks the face.
 */
export const fontFamily = 'Manrope';

/** The app's 12 text styles, after the Apple text-style ramp. Screens pick one by name. */
export const typography = {
  /** Big totals: next payment, yearly income */
  display: { fontFamily, fontSize: 32, fontWeight: '700' },
  /** Large glyphs such as the year switcher arrows */
  title1: { fontFamily, fontSize: 24, fontWeight: '500' },
  /** Empty-state titles, the selected year */
  title2: { fontFamily, fontSize: 22, fontWeight: '700' },
  /** Small titles and inline glyphs */
  title3: { fontFamily, fontSize: 20, fontWeight: '400' },
  /** Buttons and emphasized row titles */
  headline: { fontFamily, fontSize: 17, fontWeight: '600' },
  /** Inputs and primary text */
  body: { fontFamily, fontSize: 17, fontWeight: '400' },
  /** Row titles: dates, ISINs in lists */
  callout: { fontFamily, fontSize: 16, fontWeight: '500' },
  /** Row labels and paragraphs */
  subhead: { fontFamily, fontSize: 15, fontWeight: '400' },
  /** Legends, hints, chart selection */
  footnote: { fontFamily, fontSize: 14, fontWeight: '400' },
  /** Secondary row details, section footers */
  caption1: { fontFamily, fontSize: 13, fontWeight: '400' },
  /** Section and card labels */
  overline: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  /** Data sources, chart labels */
  caption2: { fontFamily, fontSize: 11, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export type FontWeight = keyof typeof fontWeights;
