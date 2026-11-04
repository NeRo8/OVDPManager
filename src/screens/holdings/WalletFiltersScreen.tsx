import { CheckRow } from '@/components/layout/CheckRow';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { ResetFiltersHeader } from '@/components/navigation/ResetFiltersHeader';
import { CURRENCIES, currencyTitle } from '@/lib/portfolio/portfolio';
import { resetWalletFilters, updateWalletFilters, useWalletFilters } from '@/stores/operations';

export default function WalletFiltersScreen() {
  const { kind, currency } = useWalletFilters();
  const activeFilterCount = Number(kind !== 'all') + Number(currency !== 'all');

  return (
    <ScreenScrollView>
      <ResetFiltersHeader activeFilterCount={activeFilterCount} onReset={resetWalletFilters} />
      <Section title="Валюта">
        <CheckRow
          title="Усі валюти"
          checked={currency === 'all'}
          onPress={() => updateWalletFilters({ currency: 'all' })}
        />
        {CURRENCIES.map((value) => (
          <CheckRow
            key={value}
            title={currencyTitle(value)}
            checked={currency === value}
            onPress={() => updateWalletFilters({ currency: value })}
          />
        ))}
      </Section>
      <Section title="Вид облігації">
        {(
          [
            ['all', 'Усі облігації'],
            ['ovdp', 'ОВДП'],
            ['ozdp', 'ОЗДП'],
            ['unknown', 'Вид невідомий'],
          ] as const
        ).map(([value, title]) => (
          <CheckRow
            key={value}
            title={title}
            checked={kind === value}
            onPress={() => updateWalletFilters({ kind: value })}
          />
        ))}
      </Section>
    </ScreenScrollView>
  );
}
