import { round2 } from '../number';

describe('round2', () => {
  it('rounds half cents away from zero despite floating point noise', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(-1.005)).toBe(-1.01);
    expect(round2(2.675)).toBe(2.68);
  });

  it('does not return negative zero for small negative amounts', () => {
    expect(Object.is(round2(-0.001), -0)).toBe(false);
    expect(round2(-0.001)).toBe(0);
  });
});
