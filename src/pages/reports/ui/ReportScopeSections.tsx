import {
  currencyTitle,
  type Currency,
  type Wallet,
  type WalletScope,
  type WalletScopeOptions,
} from '@/entities/portfolio';

import { formatDate } from '@/shared/lib';
import { CheckRow, Section } from '@/shared/ui';

type Props = {
  wallet: Wallet;
  scope: WalletScope;
  options: WalletScopeOptions;
  onChange: (patch: Partial<WalletScope>) => void;
  onToggleIsin: (isin: string) => void;
};

/** The currency and the bonds a report covers, in its filters screen. */
export function ReportScopeSections({ wallet, scope, options, onChange, onToggleIsin }: Props) {
  const showAllCurrencies = () => onChange({ currency: null });
  const showCurrency = (currency: Currency) => onChange({ currency });
  const showAllBonds = () => onChange({ isins: [] });

  return (
    <>
      {options.currencies.length > 1 && (
        <Section title="Валюта" footer="Кожна валюта у звіті має власні підсумки.">
          <CheckRow
            title="Усі валюти"
            checked={scope.currency === null}
            onPress={showAllCurrencies}
          />
          {options.currencies.map((currency) => (
            <CheckRow
              key={currency}
              title={currencyTitle(currency)}
              checked={currency === scope.currency}
              onPress={() => showCurrency(currency)}
            />
          ))}
        </Section>
      )}

      <Section title="ОВДП" footer="Позначте ОВДП, купівлі й виплати яких рахувати у звіті.">
        <CheckRow title="Усі ОВДП" checked={scope.isins.length === 0} onPress={showAllBonds} />
        {options.isins.map((isin) => {
          const bond = wallet.byIsin.get(isin);
          return (
            <CheckRow
              key={isin}
              title={isin}
              subtitle={bond && `${bond.rate}% · до ${formatDate(bond.maturityDate)}`}
              checked={scope.isins.includes(isin)}
              onPress={() => onToggleIsin(isin)}
            />
          );
        })}
      </Section>
    </>
  );
}
