import {
  type Currency,
  type Position,
  type PurchaseResults,
  pricePerBond,
} from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { InfoRow, Section, Separator, Typography } from '@/shared/ui';

type Props = {
  position: Position;
  currency: Currency;
  /** Bought in several purchases: the average price is worth showing */
  hasTopUps: boolean;
  /** Missing when the NBU data has no such bond */
  results?: PurchaseResults;
};

/** What a bond in the wallet has cost, brought and will bring. */
export function PositionSummary({ position, currency, hasTopUps, results }: Props) {
  return (
    <Section title="Підсумок">
      <InfoRow label="Кількість" value={`${position.quantity} шт`} />
      <Separator />
      <InfoRow label="Вкладено" value={formatMoney(position.investedAmount, currency)} />
      {hasTopUps && (
        <>
          <Separator />
          <InfoRow
            label="Середня ціна 1 шт"
            value={formatMoney(pricePerBond(position.investedAmount, position.quantity), currency)}
          />
        </>
      )}
      {results && (
        <>
          <Separator />
          <InfoRow label="Отримано" value={formatMoney(results.received, currency)} />
          <Separator />
          <InfoRow label="Очікується" value={formatMoney(results.expected, currency)} />
          <Separator />
          <InfoRow
            label="Чистий дохід"
            value={
              results.netIncome === null ? (
                'Немає повних даних НБУ'
              ) : (
                <Typography
                  variant="subhead"
                  weight="semibold"
                  tone={results.netIncome >= 0 ? 'positive' : 'danger'}
                >
                  {formatMoney(results.netIncome, currency)}
                </Typography>
              )
            }
          />
        </>
      )}
    </Section>
  );
}
