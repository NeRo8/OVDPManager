import {
  type Currency,
  type Position,
  type PositionResults,
  type WalletPosition,
  pricePerBond,
} from '@/entities/portfolio';

import { InfoRow, Money, Section } from '@/shared/ui';

import { ownedLabel } from './ownedLabel';

type Props = {
  position: Position;
  currency: Currency;
  /** Bought in several purchases: the average price is worth showing */
  hasTopUps: boolean;
  /** Missing when the NBU data has no such bond */
  results?: PositionResults;
  /** Its purchases still planned */
  planned: WalletPosition['planned'];
};

/** What a bond in the wallet has cost, brought and will bring. */
export function PositionSummary({ position, currency, hasTopUps, results, planned }: Props) {
  const price = pricePerBond(position.investedAmount, position.quantity);
  return (
    <Section title="Підсумок">
      <InfoRow label="Кількість" value={ownedLabel(position.quantity, planned.quantity)} />
      <InfoRow
        label="Вкладено"
        value={<Money value={position.investedAmount} currency={currency} />}
      />
      {planned.amount > 0 && planned.amount < position.investedAmount && (
        <InfoRow
          label="З них заплановано"
          hint="Купівлі, яких ще не зроблено"
          value={<Money value={planned.amount} currency={currency} />}
        />
      )}
      {hasTopUps && (
        <InfoRow label="Середня ціна 1 шт" value={<Money value={price} currency={currency} />} />
      )}
      {results && (
        <>
          <InfoRow
            label="Отримано"
            value={<Money value={results.received} currency={currency} />}
          />
          <InfoRow
            label="Очікується"
            value={<Money value={results.expected} currency={currency} />}
          />
          <InfoRow
            label="Чистий дохід"
            value={
              results.netIncome === null ? (
                'Немає повних даних НБУ'
              ) : (
                <Money value={results.netIncome} currency={currency} />
              )
            }
            signedValue={results.netIncome ?? undefined}
          />
        </>
      )}
    </Section>
  );
}
