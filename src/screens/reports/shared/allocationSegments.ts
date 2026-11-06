import type { SeriesColor } from '@/theme/series';

import type { ReportAllocationChart } from './reportSection';

const COLORS: SeriesColor[] = ['coupon', 'redemption', 'purchase', 'plannedPurchase', 'sale'];
const CENTER = 90;
const RADIUS = 65;

/** Ring geometry shared by the mobile chart and the PDF. */
export function allocationSegments(chart: ReportAllocationChart) {
  const total = chart.slices.reduce((sum, item) => sum + item.value, 0);
  let angle = -Math.PI / 2;
  return chart.slices.map((item, index) => {
    const sweep = total ? (item.value / total) * Math.PI * 2 : 0;
    const startX = CENTER + RADIUS * Math.cos(angle);
    const startY = CENTER + RADIUS * Math.sin(angle);
    const endAngle = angle + sweep;
    const endX = CENTER + RADIUS * Math.cos(endAngle);
    const endY = CENTER + RADIUS * Math.sin(endAngle);
    const path =
      sweep >= Math.PI * 2 - 1e-10
        ? `M ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER} ${CENTER + RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER} ${CENTER - RADIUS}`
        : `M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${sweep > Math.PI ? 1 : 0} 1 ${endX} ${endY}`;
    angle = endAngle;
    return { ...item, color: COLORS[index % COLORS.length], path };
  });
}
