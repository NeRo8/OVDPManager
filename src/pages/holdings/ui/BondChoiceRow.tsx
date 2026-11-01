import { type Bond, CURRENCY_NAMES, canBuyOn, isRedeemed } from '@/entities/portfolio';

import { currencySign, formatDate, formatPercent, formatTimeLeft } from '@/shared/lib';
import { currencyColor } from '@/shared/theme';
import { Avatar, ListRow, Percent, ThemedIcon, Typography } from '@/shared/ui';

import { ownedLabel } from './ownedLabel';

type BondChoiceRowProps = {
  bond: Bond;
  today: string;
  /** What the wallet already holds of it, and how much of that is still planned */
  owned?: { quantity: number; planned: number };
  onPress: () => void;
};

function maturityLabel(bond: Bond, today: string) {
  if (canBuyOn(bond, today))
    return `до ${formatDate(bond.maturityDate)} · ${formatTimeLeft(today, bond.maturityDate)}`;
  if (isRedeemed(bond, today)) return `погашена ${formatDate(bond.maturityDate)}`;
  return 'погашається сьогодні';
}

/**
 * A bond to choose: its currency's badge, as in the wallet, when it matures and what is owned on
 * the left, what it pays on the right.
 */
export function BondChoiceRow({ bond, today, owned, onPress }: BondChoiceRowProps) {
  const isActive = canBuyOn(bond, today);
  const details = [
    maturityLabel(bond, today),
    owned && `у гаманці ${ownedLabel(owned.quantity, owned.planned)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ListRow
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${bond.isin}, ${CURRENCY_NAMES[bond.currency]}, ${formatPercent(bond.rate)} річних, ${details}`}
      leading={<Avatar label={currencySign(bond.currency)} color={currencyColor(bond.currency)} />}
      title={bond.isin}
      subtitle={details}
      trailing={
        <>
          <Typography variant="headline" tabular tone={isActive ? 'primary' : 'secondary'}>
            <Percent value={bond.rate} />
          </Typography>
          <ThemedIcon
            name="chevron-forward"
            size={16}
            uniProps={(theme) => ({ color: theme.secondaryText })}
          />
        </>
      }
    />
  );
}
