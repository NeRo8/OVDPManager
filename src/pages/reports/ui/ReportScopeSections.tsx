import { Fragment } from 'react';

import { CURRENCY_NAMES, type Currency, type Wallet } from '@/entities/portfolio';
import type { ReportScope, ReportScopeOptions } from '@/features/report-filters';
import { currencySign, formatDate } from '@/shared/lib';
import { CheckRow, Section, Separator } from '@/shared/ui';

type Props = {
  wallet: Wallet;
  scope: ReportScope;
  options: ReportScopeOptions;
  onChange: (patch: Partial<ReportScope>) => void;
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
            <Fragment key={currency}>
              <Separator />
              <CheckRow
                title={`${currencySign(currency)} ${CURRENCY_NAMES[currency]}`}
                checked={currency === scope.currency}
                onPress={() => showCurrency(currency)}
              />
            </Fragment>
          ))}
        </Section>
      )}

      <Section title="ОВДП" footer="Позначте облігації, купівлі й виплати яких рахувати у звіті.">
        <CheckRow title="Усі ОВДП" checked={scope.isins.length === 0} onPress={showAllBonds} />
        {options.isins.map((isin) => {
          const bond = wallet.byIsin.get(isin);
          return (
            <Fragment key={isin}>
              <Separator />
              <CheckRow
                title={isin}
                subtitle={bond && `${bond.rate}% · до ${formatDate(bond.maturityDate)}`}
                checked={scope.isins.includes(isin)}
                onPress={() => onToggleIsin(isin)}
              />
            </Fragment>
          );
        })}
      </Section>
    </>
  );
}
