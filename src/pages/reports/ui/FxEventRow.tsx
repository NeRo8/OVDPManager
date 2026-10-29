import type { ExchangeCurrency } from '@/entities/portfolio';

import { currencySign, formatDate, formatMoney } from '@/shared/lib';
import { SERIES_COLORS } from '@/shared/theme';
import { Avatar, ListRow, SignedValue, Typography } from '@/shared/ui';

import type { FxEvent } from '../model/fxReport';

type Props = { event: FxEvent; currency: ExchangeCurrency };

const NAMES = { purchase: 'Купівля', coupon: 'Купон', redemption: 'Погашення' } as const;
const rateFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

/** One past hryvnia flow and its foreign currency equivalent at the rate on that day. */
export function FxEventRow({ event, currency }: Props) {
  const isPurchase = event.type === 'purchase';
  const signedEquivalent = isPurchase ? -event.equivalent : event.equivalent;
  const sign = signedEquivalent > 0 ? '+' : signedEquivalent < 0 ? '−' : '';
  return (
    <ListRow
      // The flow is in hryvnia; the badge takes its type's color, as in the payments' rows.
      leading={<Avatar label={currencySign('UAH')} color={SERIES_COLORS[event.type].badge} />}
      title={
        <Typography variant="callout" weight="medium">
          {NAMES[event.type]} · {formatDate(event.date)}
        </Typography>
      }
      subtitle={`${formatMoney(event.amount, 'UAH')} · курс ${rateFormat.format(event.rate)} ₴/${currency}`}
      trailing={
        <SignedValue
          value={signedEquivalent}
          variant="callout"
          weight="semibold"
          tabular
          align="right"
        >
          {sign}
          {formatMoney(event.equivalent, currency)}
        </SignedValue>
      }
    />
  );
}
