import { CheckRow } from '@/components/layout/CheckRow';
import { Section } from '@/components/layout/Section';
import { CURRENCIES, type Currency } from '@/lib/portfolio/portfolio';
import type { Wallet } from '@/lib/portfolio/wallet';
import type { ReportScope } from '@/screens/reports/shared/reportScope';

type Props = { wallet: Wallet; value: ReportScope; onChange: (value: ReportScope) => void };

export function ReportScopePicker({ wallet, value, onChange }: Props) {
  const currencies = CURRENCIES.filter((currency) =>
    wallet.positions.some((item) => item.currency === currency),
  );
  const positions = wallet.positions.filter(
    (item) => !value.currency || item.currency === value.currency,
  );
  const chooseCurrency = (currency: Currency | null) => onChange({ currency, isins: [] });
  const chooseIsin = (isin: string) => {
    const selected = value.isins.includes(isin)
      ? value.isins.filter((item) => item !== isin)
      : [...value.isins, isin];
    onChange({ ...value, isins: selected });
  };
  return (
    <>
      {currencies.length > 1 && (
        <Section title="Валюта">
          <CheckRow
            title="Усі валюти"
            checked={value.currency === null}
            onPress={() => chooseCurrency(null)}
          />
          {currencies.map((currency) => (
            <CheckRow
              key={currency}
              title={currency}
              checked={value.currency === currency}
              onPress={() => chooseCurrency(currency)}
            />
          ))}
        </Section>
      )}
      {positions.length > 1 && (
        <Section title="Облігації" footer="Оберіть одну чи кілька облігацій або всі разом.">
          <CheckRow
            title="Усі облігації"
            checked={value.isins.length === 0}
            onPress={() => onChange({ ...value, isins: [] })}
          />
          {positions.map(({ position }) => (
            <CheckRow
              key={position.isin}
              title={position.isin}
              checked={value.isins.includes(position.isin)}
              onPress={() => chooseIsin(position.isin)}
            />
          ))}
        </Section>
      )}
    </>
  );
}
