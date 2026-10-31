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
