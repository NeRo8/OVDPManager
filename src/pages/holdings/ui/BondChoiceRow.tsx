import { type Bond, CURRENCY_NAMES, canBuyOn, isRedeemed } from '@/entities/portfolio';
import { currencySign, formatDate, formatTimeLeft } from '@/shared/lib';
import { currencyColor } from '@/shared/theme';
import { Avatar, ListRow, ThemedIcon, Typography } from '@/shared/ui';

type BondChoiceRowProps = {
  bond: Bond;
  today: string;
  /** Quantity already in the wallet */
  owned?: number;
  onPress: () => void;
};

/**
 * A bond to choose: its currency's badge, as in the wallet, when it matures and what is owned on
 * the left, what it pays on the right.
 */
export function BondChoiceRow({ bond, today, owned, onPress }: BondChoiceRowProps) {
  const isActive = canBuyOn(bond, today);
  const details = [
    isActive
      ? `до ${formatDate(bond.maturityDate)} · ${formatTimeLeft(today, bond.maturityDate)}`
      : isRedeemed(bond, today)
        ? `погашена ${formatDate(bond.maturityDate)}`
        : 'погашається сьогодні',
    owned && `у гаманці ${owned} шт`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ListRow
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${bond.isin}, ${CURRENCY_NAMES[bond.currency]}, ${bond.rate}% річних, ${details}`}
      leading={<Avatar label={currencySign(bond.currency)} color={currencyColor(bond.currency)} />}
      title={bond.isin}
      subtitle={details}
      trailing={
        <>
          <Typography variant="headline" tabular tone={isActive ? 'primary' : 'secondary'}>
            {bond.rate}%
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
