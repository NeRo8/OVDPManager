import { Easing } from 'react-native-reanimated';

/** Same width as the native splash image, so the logo lands where the system draws it. */
export const LOGO_SIZE = 240;

// Bubbles spiral in, the logo spins out of the whirlpool they leave, then the splash fades away.
export const GATHER_DURATION = 800;
export const SWIRL_DELAY = 550;
export const SWIRL_DURATION = 800;
export const EXIT_DELAY = SWIRL_DELAY + SWIRL_DURATION + 150;
export const EXIT_DURATION = 300;
/** With reduced motion only the logo fades in and out. */
export const REDUCED_SWIRL_DURATION = 400;
export const REDUCED_EXIT_DELAY = REDUCED_SWIRL_DURATION + 300;

export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

/** How far each bubble turns around the center on its way in, in radians. */
export const BUBBLE_TURN = Math.PI * 1.25;

export type Bubble = {
  /** Start position around the center: angle in radians and distance in points */
  angle: number;
  distance: number;
  size: number;
  /** Peak opacity: fainter bubbles read as further away */
  opacity: number;
  /** Share of the gathering this bubble waits before it starts moving */
  delay: number;
};

const BUBBLE_COUNT = 16;

// Spread evenly around the circle and varied by index, so the layout is the same on every launch.
export const BUBBLES: Bubble[] = Array.from({ length: BUBBLE_COUNT }, (_, index) => ({
  angle: (index / BUBBLE_COUNT) * Math.PI * 2 + (index % 3) * 0.3,
  distance: 150 + (index % 4) * 30,
  size: 8 + ((index * 7) % 5) * 4,
  opacity: 0.45 + (index % 3) * 0.25,
  delay: (index % 5) * 0.06,
}));

/** How far the logo spins back before it settles, in degrees. */
export const LOGO_SPIN = 360;
