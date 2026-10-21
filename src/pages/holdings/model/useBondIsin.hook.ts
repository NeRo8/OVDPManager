import { useGlobalSearchParams } from 'expo-router';
import { useState } from 'react';

/**
 * The bond the tabs of the bond screen show, from the URL (`/bond/[isin]/…`). A tab gets no params
 * of its own when it is pressed or swiped to, so the `[isin]` segment is read from the whole URL.
 * While the screen slides away the URL already belongs to the next screen; the last ISIN keeps
 * the tabs filled until then.
 */
export function useBondIsin(): string {
  const { isin } = useGlobalSearchParams<{ isin?: string }>();
  const [lastIsin, setLastIsin] = useState(isin);
  if (isin && isin !== lastIsin) setLastIsin(isin);
  return isin ?? lastIsin ?? '';
}
