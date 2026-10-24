/** A patch of the onboarding backdrop; positions and sizes are fractions of the screen. */
export type Blob = {
  x: number;
  y: number;
  radius: number;
  /** How far it wanders from its place, as a share of the screen width */
  drift: number;
  /** Milliseconds per radian of its loop; different periods keep the patches out of step */
  period: number;
  phase: number;
  /** How far it slides, as a share of the width, for each page turned */
  parallax: number;
};

/** Accent, coupon teal and redemption blue, the colors of the money the app follows. */
export const AURORA_BLOBS = {
  accent: { x: 0.2, y: 0.22, radius: 0.5, drift: 0.08, period: 1400, phase: 0, parallax: 0.06 },
  coupon: { x: 0.95, y: 0.45, radius: 0.45, drift: 0.1, period: 1900, phase: 2, parallax: 0.1 },
  redemption: {
    x: 0.35,
    y: 0.78,
    radius: 0.4,
    drift: 0.07,
    period: 1700,
    phase: 4,
    parallax: 0.04,
  },
} as const satisfies Record<string, Blob>;
