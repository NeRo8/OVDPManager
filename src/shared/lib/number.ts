/**
 * Rounds to cents, half away from zero. The scaled value is first snapped to 15 significant
 * digits, so float noise such as 1.005 * 100 = 100.49999… still rounds up to 1.01.
 */
export function round2(value: number): number {
  const cents = Math.round(Number((Math.abs(value) * 100).toPrecision(15)));
  // Keep -0 out of the results: Intl prints it as "-0,00".
  return value < 0 && cents !== 0 ? -cents / 100 : cents / 100;
}
