const NICE_STEPS = [1, 2, 2.5, 5, 10];
const MAX_ROWS = 8;
const MAX_COLUMNS = 6;

function niceStep(atLeast: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(atLeast));
  return NICE_STEPS.find((multiple) => multiple * magnitude >= atLeast)! * magnitude;
}

export type ChartGrid = {
  min: number;
  max: number;
  step: number;
  ticks: number[];
};

/** Equal-value rows with readable bounds; zero is always a gridline. */
export function chartGrid(minimum: number, maximum: number): ChartGrid {
  const low = Math.min(0, minimum);
  const high = Math.max(0, maximum) || (low === 0 ? 1 : 0);
  let step = niceStep((high - low) / MAX_ROWS);
  let min = Math.floor(low / step) * step;
  let max = Math.ceil(high / step) * step;
  while (Math.round((max - min) / step) > MAX_ROWS) {
    step = niceStep(step * 1.01);
    min = Math.floor(low / step) * step;
    max = Math.ceil(high / step) * step;
  }
  const rows = Math.round((max - min) / step);
  const ticks = Array.from({ length: rows + 1 }, (_, index) =>
    Number((max - index * step).toPrecision(12)),
  );
  return { min, max, step, ticks };
}

/** Boundaries follow whole point/column slots, with at most six cells across. */
export function gridBoundaries(count: number): number[] {
  if (count === 0) return [];
  const stride = Math.ceil(count / MAX_COLUMNS);
  const boundaries: number[] = [];
  for (let index = 0; index < count; index += stride) boundaries.push(index / count);
  boundaries.push(1);
  return boundaries;
}

/** Keep adjacent tick labels distinct even when the step is fractional. */
export function formatGridTick(value: number, step: number): string {
  const absolute = Math.abs(value);
  const divisor =
    absolute >= 1_000_000 && step >= 50_000
      ? 1_000_000
      : absolute >= 1_000 && step >= 50
        ? 1_000
        : 1;
  const scaledStep = step / divisor;
  let fractionDigits = 0;
  while (
    fractionDigits < 4 &&
    Math.abs(scaledStep * 10 ** fractionDigits - Math.round(scaledStep * 10 ** fractionDigits)) >
      1e-7
  ) {
    fractionDigits++;
  }
  const number = new Intl.NumberFormat('uk-UA', {
    maximumFractionDigits: fractionDigits,
  }).format(absolute / divisor);
  const unit = divisor === 1_000_000 ? ' млн' : divisor === 1_000 ? ' тис' : '';
  return `${value < 0 ? '−' : ''}${number}${unit}`;
}
