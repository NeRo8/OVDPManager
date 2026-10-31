/** Months in words, after «у»: «січні й липні», «квітні, травні й червні». */
const MONTHS_LOCATIVE = [
  'січні',
  'лютому',
  'березні',
  'квітні',
  'травні',
  'червні',
  'липні',
  'серпні',
  'вересні',
  'жовтні',
  'листопаді',
  'грудні',
];

export function monthsPhrase(months: number[]): string {
  const words = months.map((month) => MONTHS_LOCATIVE[month]);
  if (words.length < 2) return words.join('');
  return `${words.slice(0, -1).join(', ')} й ${words[words.length - 1]}`;
}

/** A span of years after «у»: «у 2029 році», «у 2029–2031 роках». */
export const inYears = (first: number, last: number): string =>
  first === last ? `у ${first} році` : `у ${first}–${last} роках`;

/** A span of years after «за»: «за 2029 рік», «за 2029–2031 роки». */
export const forYears = (first: number, last: number): string =>
  first === last ? `за ${first} рік` : `за ${first}–${last} роки`;

/** A span of years as a genitive: «2029 року», «2029–2031 років». */
export const ofYears = (first: number, last: number): string =>
  first === last ? `${first} року` : `${first}–${last} років`;

/** The years a span of dates falls in. */
export const spanYears = ({ from, to }: { from: string; to: string }): [number, number] => [
  Number(from.slice(0, 4)),
  Number(to.slice(0, 4)),
];
