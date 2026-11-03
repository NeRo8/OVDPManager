// Built from the brand colors #046865 (deep teal), #21A0A0 (teal), #E53D00 (vermilion), #000000
// and #FCFFF7. Teal is the money coming in and the main actions; vermilion is the money going out
// and the add button. Every text pair passes WCAG AA on `card` and `background`.
export const light = {
  background: '#EEF3EC',
  card: '#FCFFF7',
  /**
   * Brand surface of the launch splash and the Android date picker's header, the same in both
   * themes. Navigation headers are not colored: on iOS 26 they are glass over the content.
   */
  headerBackground: '#046865',
  headerText: '#FCFFF7',
  headerMutedText: 'rgba(252, 255, 247, 0.8)',
  text: '#000000',
  secondaryText: '#52625E',
  border: '#D5E0DA',
  accent: '#046865',
  /** The label on every filled control and badge: `accentFill`, the series' badges, currencies */
  accentText: '#FCFFF7',
  /** The primary button's and the selected segment's fill (6.5:1 under `accentText`) */
  accentFill: '#046865',
  /** Tints the disc and the glow behind an illustration icon drawn in `accent` (5.4:1) */
  accentSurface: '#D6ECE8',
  positive: '#046865',
  // #E53D00 itself is 4.2:1 on `card`, so text takes a darker step of it.
  danger: '#C23300',
  /**
   * Status colors for advice: green is all well, amber asks to look, `danger` is a loss or a
   * mistake. Each passes 4.5:1 on `card`, `background` and its own surface, which tints a banner.
   */
  success: '#1E7A36',
  warning: '#8A5800',
  successSurface: '#E2F3E5',
  warningSurface: '#FFF1D2',
  dangerSurface: '#FCE6DC',
  /** Fields, the segmented control's track and pressed rows */
  muted: '#E4EBE5',
  /**
   * The outline of a field that takes input (3.3:1 on `card`, 2.7:1 on `muted`), so it reads as
   * something to tap; `border` only separates rows.
   */
  fieldBorder: '#7F918C',
  /** A surface raised above `muted` */
  raised: '#FCFFF7',
  /**
   * The floating add button. Its light glyph is 4.2:1 on vermilion, above the 3:1 that icons need;
   * a text label would need 4.5:1, so it stays black (5:1).
   */
  fab: '#E53D00',
  fabIcon: '#FCFFF7',
  fabText: '#000000',
  // Chart series: teal, blue, vermilion and plum for planned purchases; checked with the dataviz
  // palette validator against `card` (lightness, chroma, CVD and normal-vision separation, all
  // pairs). Two teals did not separate.
  seriesCoupon: '#21A0A0',
  seriesRedemption: '#4A5FD0',
  seriesPurchase: '#E53D00',
  seriesPlannedPurchase: '#9E3F7A',
  // The same hues stepped to 4.5:1 on `card`, for amounts written in the series color.
  seriesCouponText: '#046865',
  seriesRedemptionText: '#4A5FD0',
  seriesPurchaseText: '#C23300',
  // The badges of the schedule's rows, with `accentText` on top (5.4:1 and more).
  seriesCouponBadge: '#046865',
  seriesRedemptionBadge: '#4A5FD0',
  seriesPurchaseBadge: '#C23300',
  /**
   * Each currency's badge, with `accentText` on top (5.1:1 and more): hryvnia berry, dollar green,
   * euro indigo. Checked with the dataviz palette validator on `card` and `background`; the
   * berry–green pair is 7.3 for deutan readers, which the currency sign on the badge backs up.
   */
  currencyUah: '#8A2E66',
  currencyUsd: '#0A7C5C',
  currencyEur: '#6A4FD0',
  shadowCard: '0 1px 2px rgba(4, 48, 46, 0.08), 0 4px 8px -2px rgba(4, 48, 46, 0.08)',
  shadowRaised: '0 8px 20px rgba(229, 61, 0, 0.32)',
  /** Floating layers above the screen, such as toasts */
  shadowOverlay: '0 8px 24px rgba(4, 48, 46, 0.18)',
};

export type AppTheme = typeof light;

export const dark: AppTheme = {
  background: '#000000',
  card: '#0F1716',
  headerBackground: light.headerBackground,
  headerText: light.headerText,
  headerMutedText: light.headerMutedText,
  text: '#FCFFF7',
  secondaryText: '#9AAEA9',
  border: '#24302D',
  // #046865 is 2.7:1 on black, so the lighter teal takes its place.
  accent: '#21A0A0',
  accentText: '#FCFFF7',
  // A darker teal than `accent`, so the light label reads on it (4.7:1) and the fill itself still
  // stands out on black (4.4:1) and on `card` (3.8:1). The badges below take the same steps.
  accentFill: '#0F807D',
  accentSurface: '#0B2B2A',
  positive: '#3CC9C3',
  danger: '#FF6A33',
  success: '#5BC877',
  warning: '#F0B03C',
  successSurface: '#10291A',
  warningSurface: '#2E2309',
  dangerSurface: '#33160B',
  muted: '#18211F',
  fieldBorder: '#5E6F6B',
  // Lighter than the track: in the dark a raised surface is lighter, not shadowed.
  raised: '#33413E',
  fab: '#E53D00',
  fabIcon: '#FCFFF7',
  fabText: '#000000',
  seriesCoupon: '#21A0A0',
  seriesRedemption: '#5C6CE6',
  seriesPurchase: '#EE5A24',
  seriesPlannedPurchase: '#A3478A',
  seriesCouponText: '#3CC9C3',
  seriesRedemptionText: '#8C98F5',
  seriesPurchaseText: '#FF6A33',
  seriesCouponBadge: '#00827D',
  seriesRedemptionBadge: '#5768E5',
  seriesPurchaseBadge: '#D04410',
  // Steps under the light `accentText` (4.6:1) that still stand out on `card` and black (3.9:1),
  // checked with the dataviz palette validator; berry–green is 7.0 for deutan readers.
  currencyUah: '#BD4892',
  currencyUsd: '#24835D',
  currencyEur: '#745FE4',
  // A drop shadow does not read on black; the lighter card surface sets cards apart instead.
  shadowCard: '0 0 0 0 transparent',
  shadowRaised: '0 8px 24px rgba(229, 61, 0, 0.35)',
  shadowOverlay: '0 8px 24px rgba(0, 0, 0, 0.6)',
};
