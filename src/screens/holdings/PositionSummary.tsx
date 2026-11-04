import { InfoRow } from '@/components/layout/InfoRow';
import { Section } from '@/components/layout/Section';
import { Money } from '@/components/typography/Money';
import { Percent } from '@/components/typography/Percent';
import { pricePerBond } from '@/lib/portfolio/portfolio';
import type { WalletPosition } from '@/lib/portfolio/position';

import { ownedLabel } from './ownedLabel';

type Props = {
  item: WalletPosition;
  /** Bought in several operations: the average price is worth showing */
  hasTopUps: boolean;
};

/** What a bond in the wallet has cost, brought and will bring, and what that comes to a year. */
export function PositionSummary({ item, hasTopUps }: Props) {
  const { position, currency, results, planned, annualYield, purchasesWithoutYield } = item;
  const price = pricePerBond(
    position.investedAmount,
    position.operations
      .filter((operation) => operation.type === 'purchase')
      .reduce((sum, operation) => sum + operation.quantity, 0),
  );
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
      {!!results?.saleProceeds && (
        <InfoRow
          label="Отримано від продажів"
          value={<Money value={results.saleProceeds} currency={currency} />}
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
          hint="Чистий дохід у відсотках від вкладеного за весь строк, без перерахунку на рік; комісії враховані в сумах операцій"
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
