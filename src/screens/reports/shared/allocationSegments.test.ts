import { allocationSegments } from './allocationSegments';

describe('allocationSegments', () => {
  it('draws a full ring with two arcs for a single bond', () => {
    const [segment] = allocationSegments({
      currency: 'UAH',
      slices: [{ label: 'UA1', value: 100 }],
    });
    expect(segment.label).toBe('UA1');
    expect(segment.path.match(/ A /g)).toHaveLength(2);
    expect(segment.color).toBe('coupon');
  });

  it('keeps the order and values of the allocation with distinct colors', () => {
    const segments = allocationSegments({
      currency: 'USD',
      slices: [
        { label: 'UA1', value: 75 },
        { label: 'Інші', value: 25 },
      ],
    });
    expect(segments.map(({ label, value, color }) => ({ label, value, color }))).toEqual([
      { label: 'UA1', value: 75, color: 'coupon' },
      { label: 'Інші', value: 25, color: 'redemption' },
    ]);
    expect(segments[0].path).toContain(' 0 1 1 ');
    expect(segments[1].path).toContain(' 0 0 1 ');
  });
});
