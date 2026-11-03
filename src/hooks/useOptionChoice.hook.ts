import { useState } from 'react';

/**
 * A choice among options that change over time: the chosen one while it is still among them,
 * otherwise the first. Undefined while there are no options.
 */
export function useOptionChoice<T>(options: readonly T[]): [T | undefined, (option: T) => void] {
  const [chosen, setChosen] = useState<{ option: T } | null>(null);
  const option = chosen && options.includes(chosen.option) ? chosen.option : options[0];
  const choose = (next: T) => setChosen({ option: next });
  return [option, choose];
}
