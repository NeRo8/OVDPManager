// Built from the brand colors #046865 (deep teal), #21A0A0 (teal), #E53D00 (vermilion), #000000
// and #FCFFF7. Teal is the money coming in and the main actions; vermilion is the money going out
// and the add button. Every text pair passes WCAG AA on `card` and `background`.
export const light = {
  background: '#EEF3EC',
  card: '#FCFFF7',
  text: '#000000',
  secondaryText: '#52625E',
  border: '#D5E0DA',
  accent: '#046865',
  accentText: '#FCFFF7',
  positive: '#046865',
  // #E53D00 itself is 4.2:1 on `card`, so text takes a darker step of it.
  danger: '#C23300',
  /** Fields, the segmented control's track and pressed rows */
  muted: '#E4EBE5',
  /** A surface raised above `muted`, such as the segmented control's thumb */
  raised: '#FCFFF7',
  /**
   * The floating add button. Its light glyph is 4.2:1 on vermilion, above the 3:1 that icons need;
   * a text label would need 4.5:1, so it stays black (5:1).
   */
  fab: '#E53D00',
  fabIcon: '#FCFFF7',
  fabText: '#000000',
  // Chart series: teal, blue, vermilion; checked with the dataviz palette validator against
  // `card` (lightness, chroma, CVD and normal-vision separation). Two teals did not separate.
  seriesCoupon: '#21A0A0',
  seriesNominal: '#4A5FD0',
  seriesPurchase: '#E53D00',
  // The same hues stepped to 4.5:1 on `card`, for amounts written in the series color.
  seriesCouponText: '#046865',
  seriesNominalText: '#4A5FD0',
  seriesPurchaseText: '#C23300',
  shadowCard: '0 1px 2px rgba(4, 48, 46, 0.08), 0 4px 8px -2px rgba(4, 48, 46, 0.08)',
  shadowRaised: '0 8px 20px rgba(229, 61, 0, 0.32)',
  /** Floating layers above the screen, such as toasts */
  shadowOverlay: '0 8px 24px rgba(4, 48, 46, 0.18)',
};

export type AppTheme = typeof light;

export const dark: AppTheme = {
  background: '#000000',
  card: '#0F1716',
  text: '#FCFFF7',
  secondaryText: '#9AAEA9',
  border: '#24302D',
  // #046865 is 2.7:1 on black, so the lighter teal takes its place.
  accent: '#21A0A0',
  accentText: '#000000',
  positive: '#3CC9C3',
  danger: '#FF6A33',
  muted: '#18211F',
  // Lighter than the track: in the dark a raised surface is lighter, not shadowed.
  raised: '#33413E',
  fab: '#E53D00',
  fabIcon: '#FCFFF7',
  fabText: '#000000',
  seriesCoupon: '#21A0A0',
  seriesNominal: '#5C6CE6',
  seriesPurchase: '#EE5A24',
  seriesCouponText: '#3CC9C3',
  seriesNominalText: '#8C98F5',
  seriesPurchaseText: '#FF6A33',
  // A drop shadow does not read on black; the lighter card surface sets cards apart instead.
  shadowCard: '0 0 0 0 transparent',
  shadowRaised: '0 8px 24px rgba(229, 61, 0, 0.35)',
  shadowOverlay: '0 8px 24px rgba(0, 0, 0, 0.6)',
};
