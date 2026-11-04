/** Half-open year boundaries: purchase [0, 1), then coupons [2, 3). */
export type PeriodRange = [number, number, number, number];
export type PeriodHandle = 0 | 1 | 2 | 3;

export type PeriodRangeLimits = {
  min: number;
  max: number;
  latestCouponStart: number;
  maxPurchaseYears: number;
  maxCouponYears: number;
};

/** Valid positions of one boundary while the other three stay in place. */
export function periodHandleLimits(
  [start, end, couponStart, couponEnd]: PeriodRange,
  handle: PeriodHandle,
  limits: PeriodRangeLimits,
): [number, number] {
  switch (handle) {
    case 0:
      return [Math.max(limits.min, end - limits.maxPurchaseYears), end - 1];
    case 1:
      return [start + 1, Math.min(start + limits.maxPurchaseYears, couponStart)];
    case 2:
      return [
        Math.max(end, couponEnd - limits.maxCouponYears),
        Math.min(couponEnd - 1, limits.latestCouponStart),
      ];
    case 3:
      return [couponStart + 1, Math.min(limits.max, couponStart + limits.maxCouponYears)];
  }
}

export function movePeriodHandle(
  range: PeriodRange,
  handle: PeriodHandle,
  boundary: number,
  limits: PeriodRangeLimits,
): PeriodRange {
  const [min, max] = periodHandleLimits(range, handle, limits);
  const next: PeriodRange = [...range];
  next[handle] = Math.min(max, Math.max(min, Math.round(boundary)));
  return next;
}
