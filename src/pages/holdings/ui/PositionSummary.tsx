import { type WalletPosition, pricePerBond } from '@/entities/portfolio';

import { InfoRow, Money, Percent, Section } from '@/shared/ui';

import { ownedLabel } from './ownedLabel';

type Props = {
  item: WalletPosition;
  /** Bought in several purchases: the average price is worth showing */
  hasTopUps: boolean;
};

/** What a bond in the wallet has cost, brought and will bring, and what that comes to a year. */
export function PositionSummary({ item, hasTopUps }: Props) {
  const { position, currency, results, planned, annualYield, purchasesWithoutYield } = item;
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
      {results?.returnPercent != null && (
        <InfoRow
          label="Дохідність за весь строк"
          hint="Чистий дохід у відсотках від вкладеного, без перерахунку на рік, податків і комісій"
          value={<Percent value={results.returnPercent} />}
        />
      )}
      {annualYield !== null && (
        <InfoRow
          label="Річна дохідність"
          hint={`Ціна купівлі й виплати до погашення, перераховані на рік; середня зважена на суму купівель. Її можна порівнювати з депозитом.${purchasesWithoutYield ? ` Не враховано купівель без розрахованої дохідності: ${purchasesWithoutYield}.` : ''}`}
          value={<Percent value={annualYield} />}
        />
      )}
    </Section>
  );
}
