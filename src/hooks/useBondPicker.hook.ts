import { useState } from 'react';

import { bondPicker } from '@/lib/add-purchase/bondPicker';
import { groupPositions } from '@/lib/portfolio/portfolio';
import { plannedPart } from '@/lib/portfolio/position';
import { useToday } from '@/stores/appSettings';
import { useBondPickerFilters } from '@/stores/bonds';
import { useActiveOperations } from '@/stores/plans';

import { useBonds } from './useBonds.hook';

/**
 * The first step of adding a purchase: `bondPicker` over the NBU catalog with the filters from
 * their store, which the picker and its filters screen share, and the search typed here. Next to
 * the rows it gives what the active plan holds of each bond and how much of that is planned.
 */
export function useBondPicker() {
  const { bonds } = useBonds();
  const { operations } = useActiveOperations();
  const filters = useBondPickerFilters();
  const today = useToday();
  const [query, setQuery] = useState('');

  const owned = new Map(
    groupPositions(operations).map((position) => [
      position.isin,
      { quantity: position.quantity, planned: plannedPart(position, today).quantity },
    ]),
  );

  return {
    ...bondPicker(bonds ?? [], filters, query, today),
    today,
    query,
    setQuery,
    term: filters.term,
    sort: filters.sort,
    owned,
  };
}
