import { router } from 'expo-router';

import { type PurchaseEvent } from '@/entities/portfolio';

import { currencySign, formatDate, formatMoney } from '@/shared/lib';
import { SERIES_COLORS } from '@/shared/theme';
import { Avatar, InfoRow, ListRow, Section, Typography } from '@/shared/ui';

import type { UpcomingPurchases } from '../model/upcomingPurchases';

type Props = {
  upcoming: UpcomingPurchases;
  /** Names the currency in the title when the plan has several */
  showCurrency: boolean;
};

/**
 * «Найближчі купівлі»: what to buy until the end of next month and the money for it. A tap on a
 * purchase opens it to confirm with what was really paid.
 */
export function UpcomingPurchasesSection({ upcoming, showCurrency }: Props) {
  const { currency, through, purchases, amount, planMoney, ownMoney } = upcoming;
  const confirm = ({ isin, id }: PurchaseEvent) =>
    router.push({ pathname: '/add/[isin]/purchase', params: { isin, purchaseId: id } });

  return (
    <Section
      title={showCurrency ? `Найближчі купівлі · ${currency}` : 'Найближчі купівлі'}
      footer={`До ${formatDate(through)}. Суми орієнтовні, доки купівлю не підтверджено: торкніться її, коли вона відбудеться, і внесіть те, що списав банк чи брокер.`}
    >
      {purchases.map((purchase) => {
        const open = () => confirm(purchase);
        return (
          <ListRow
            key={purchase.id}
            leading={<Avatar label={currencySign(currency)} color={SERIES_COLORS.purchase.badge} />}
            title={`${formatDate(purchase.date)} · ${purchase.quantity} шт`}
            subtitle={purchase.isin}
            trailing={
              <Typography variant="subhead" weight="medium" tabular>
                {formatMoney(purchase.total, currency)}
              </Typography>
            }
            onPress={open}
            accessibilityRole="button"
            accessibilityLabel={`Підтвердити купівлю ${purchase.isin} від ${formatDate(purchase.date)}`}
          />
        );
      })}
      <InfoRow label="Разом" value={formatMoney(amount, currency)} />
      <InfoRow
        label="Виплати плану"
        hint="Купони й погашення, що надійдуть за цей час"
        value={formatMoney(planMoney, currency)}
      />
      <InfoRow
        label="Власні кошти"
        hint={
          ownMoney > 0
            ? 'Скільки додати понад виплати плану'
            : 'Виплат плану вистачає на ці купівлі'
        }
        value={formatMoney(ownMoney, currency)}
      />
    </Section>
  );
}
