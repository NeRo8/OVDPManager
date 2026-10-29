import { CURRENCY_NAMES } from '@/entities/portfolio';

import { formatDate, formatMoney, formatTimeLeft } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

import type { CurrencyStructure } from '../model/structureReport';

import { shareCell } from './reportCells';

type Props = {
  report: CurrencyStructure;
  today: string;
};

/** The money in one currency's bonds: how much, for how long on average, at what rate. */
export function StructureSummary({ report, today }: Props) {
  const { currency, total, bonds, averageMaturity, averageRate } = report;
  const largest = bonds[0];
  const rows = [
    { label: 'Вкладено', value: formatMoney(total, currency) },
    { label: 'ОВДП', value: String(bonds.length) },
    {
      label: 'Середній строк до погашення',
      hint: `приблизно до ${formatDate(averageMaturity)}`,
      value: averageMaturity > today ? formatTimeLeft(today, averageMaturity) : '—',
    },
    { label: 'Середня ставка купону', value: `${averageRate}%` },
    bonds.length > 1 && {
      label: 'Найбільша частка',
      hint: largest.isin,
      value: shareCell(largest.share),
    },
  ].filter((row) => !!row);

  return (
    <Section
      title={`Підсумок · ${CURRENCY_NAMES[currency]}`}
      footer="Вкладено — ціна купівель ОВДП, що ще в обігу. Середні строк і ставка зважені на суму купівель."
    >
      {rows.map((row) => (
        <InfoRow key={row.label} {...row} />
      ))}
    </Section>
  );
}
