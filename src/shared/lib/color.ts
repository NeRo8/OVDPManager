/** A `#RRGGBB` palette color at the given opacity, for Skia gradients that fade it out. */
export function withAlpha(color: string, alpha: number): string {
  const channel = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${channel}`;
}
