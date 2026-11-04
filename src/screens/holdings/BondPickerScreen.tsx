import { FlatList, type ListRenderItemInfo } from 'react-native';

import { Stack, router } from 'expo-router';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';

import { EmptyState } from '@/components/layout/EmptyState';
import { screenContent } from '@/components/layout/screenContent';
import { SectionCell } from '@/components/layout/SectionCell';
import { BondsGate } from '@/components/portfolio/BondsGate';
import { Typography } from '@/components/typography/Typography';
import { useBondPicker } from '@/hooks/useBondPicker.hook';
import type { Bond } from '@/lib/portfolio/portfolio';

import { BondChoiceRow } from './BondChoiceRow';
import { BondFiltersButton } from './BondFiltersButton';

// The search field follows the app's theme, which may differ from the system one.
const HeaderSearchBar = withUnistyles(Stack.SearchBar, (theme) => ({
  textColor: theme.text,
  hintTextColor: theme.secondaryText,
  headerIconColor: theme.text,
  tintColor: theme.accent,
}));

/**
 * First step of adding a purchase to the active plan: bonds in circulation narrowed by currency
 * and term, sorted by maturity or rate; the header button opens those filters. The header search
 * finds any bond by ISIN.
 */
export default function BondPickerScreen() {
  const { today, query, setQuery, isSearching, choices, owned } = useBondPicker();

  const search = (event: { nativeEvent: { text: string } }) => setQuery(event.nativeEvent.text);
  const clearSearch = () => setQuery('');
  const chooseBond = (isin: string) => router.push({ pathname: '/add/[isin]', params: { isin } });
  const keyOf = (bond: Bond) => bond.isin;

  const renderBond = ({ item: bond, index }: ListRenderItemInfo<Bond>) => (
    <SectionCell index={index} count={choices.length}>
      <BondChoiceRow
        bond={bond}
        today={today}
        owned={owned.get(bond.isin)}
        onPress={() => chooseBond(bond.isin)}
      />
    </SectionCell>
  );

  return (
    <BondsGate>
      <Stack.Screen options={{ headerRight: () => <BondFiltersButton /> }} />
      <HeaderSearchBar
        placeholder="ISIN, дата або ставка з %"
        autoCapitalize="characters"
        onChangeText={search}
        onCancelButtonPress={clearSearch}
      />
      <FlatList
        style={styles.list}
        contentContainerStyle={[screenContent, styles.content]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        data={choices}
        keyExtractor={keyOf}
        ListHeaderComponent={
          isSearching ? (
            <Typography variant="footnote" tone="secondary" style={styles.summary}>
              {`Знайдено: ${choices.length}`}
            </Typography>
          ) : undefined
        }
        renderItem={renderBond}
        ListEmptyComponent={
          isSearching ? (
            <EmptyState
              layout="inline"
              icon="search-outline"
              title="Облігацій не знайдено"
              message={`Немає облігацій за запитом «${query.replace(/\s+/g, '')}». Пошук іде серед усіх облігацій, без фільтрів. Для ставки додайте знак %.`}
            />
          ) : (
            <EmptyState
              layout="inline"
              icon="funnel-outline"
              title="За цими фільтрами облігацій немає"
              message="Жодна облігація в обігу не відповідає обраним фільтрам. Змініть фільтри."
            />
          )
        }
      />
    </BondsGate>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { backgroundColor: theme.background },
  content: { gap: 0 },
  summary: { marginHorizontal: theme.space.lg, marginBottom: theme.space.md },
}));
