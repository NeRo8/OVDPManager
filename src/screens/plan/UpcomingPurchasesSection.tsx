import { router } from 'expo-router';

import { Avatar } from '@/components/avatar/Avatar';
import { InfoRow } from '@/components/layout/InfoRow';
import { ListRow } from '@/components/layout/ListRow';
import { Section } from '@/components/layout/Section';
import { Money } from '@/components/typography/Money';
import { Typography } from '@/components/typography/Typography';
import type { OperationEvent } from '@/lib/portfolio/portfolio';
import { SERIES_COLORS } from '@/theme/series';
import { formatDate } from '@/utils/date';
import { currencySign } from '@/utils/format';

import type { UpcomingPurchases } from './upcomingPurchases';

type Props = {
  upcoming: UpcomingPurchases;
  /** Names the currency in the title when the plan has several */
  showCurrency: boolean;
  paymentsKnown: boolean;
};

function ownMoneyHint(paymentsKnown: boolean, ownMoney: number) {
  if (!paymentsKnown) return 'Буде розраховано, коли з’являться дані НБУ';
  if (ownMoney > 0)
    return 'Скільки мати своїх грошей: виплата плану йде лише на купівлі в день виплати чи пізніше';
  return 'Виплат плану, що надійдуть до дат купівель, вистачає на ці купівлі';
}

/**
 * «Найближчі купівлі»: what to buy until the end of next month and the money for it. A tap on a
 * purchase opens it to confirm with what was really paid.
 */
export function UpcomingPurchasesSection({ upcoming, showCurrency, paymentsKnown }: Props) {
  const { currency, through, operations, amount, planMoney, ownMoney } = upcoming;
  const confirm = ({ isin, id }: OperationEvent) =>
    router.push({ pathname: '/add/[isin]/purchase', params: { isin, purchaseId: id } });

  return (
    <Section
      title={showCurrency ? `Найближчі купівлі · ${currency}` : 'Найближчі купівлі'}
      footer={`До ${formatDate(through)}. Суми орієнтовні, доки купівлю не підтверджено: торкніться її, коли вона відбудеться, і внесіть те, що списав банк чи брокер.`}
    >
      {operations.map((purchase) => {
        const open = () => confirm(purchase);
        return (
          <ListRow
            key={purchase.id}
            leading={<Avatar label={currencySign(currency)} color={SERIES_COLORS.purchase.badge} />}
            title={`${formatDate(purchase.date)} · ${purchase.quantity} шт`}
            subtitle={purchase.isin}
            trailing={
              <Typography variant="subhead" weight="medium" tabular>
                <Money value={purchase.total} currency={currency} />
              </Typography>
            }
            onPress={open}
            accessibilityRole="button"
            accessibilityLabel={`Змінити купівлю ${purchase.isin} від ${formatDate(purchase.date)}`}
          />
        );
      })}
      <InfoRow label="Разом" value={<Money value={amount} currency={currency} />} />
      <InfoRow
        label="Виплати плану"
        hint={
          paymentsKnown
            ? 'Купони й погашення, що надійдуть за цей час'
            : 'Немає повних даних НБУ для розрахунку'
        }
        value={<Money value={paymentsKnown ? planMoney : null} currency={currency} />}
      />
      <InfoRow
        label="Власні кошти"
        hint={ownMoneyHint(paymentsKnown, ownMoney)}
        value={<Money value={paymentsKnown ? ownMoney : null} currency={currency} />}
      />
    </Section>
  );
}
